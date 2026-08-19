/* eslint-disable @typescript-eslint/no-require-imports */
const wa = require('@open-wa/wa-automate');
const fs = require('fs');
const path = require('path');

const TARGET_GROUPS = new Map([
  ['120363164824588336@g.us', 'Events.SanCristobal']
]);

const INGEST_URL = 'https://www.sancrisgo.com/api/internal/whatsapp/events';
const INGEST_SECRET = process.env.WHATSAPP_INGEST_SECRET;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

const TEXT_WAIT_MS = 60_000;
const MEDIA_BURST_MS = 12_000;
const TEXT_SETTLE_MS = 5_000;
const MAX_IMAGES = 10;
const MAX_TOTAL_IMAGE_BYTES = 4 * 1024 * 1024;
const MEDIA_RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 20_000];
const INGEST_RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 20_000];

const pendingCollections = new Map();
const processingQueues = new Map();

if (!INGEST_SECRET) {
  console.error('ERROR: WHATSAPP_INGEST_SECRET is not set');
  process.exit(1);
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getMessageId(message) {
  if (typeof message.id === 'string') return message.id;

  if (message.id && typeof message.id === 'object') {
    if (message.id._serialized) return message.id._serialized;

    try {
      return JSON.stringify(message.id);
    } catch {}
  }

  return `${message.from}-${message.t || Date.now()}-${getSenderId(message)}`;
}

function getReceivedAt(message) {
  const rawTimestamp = Number(message.t || message.timestamp);

  if (Number.isFinite(rawTimestamp) && rawTimestamp > 0) {
    const milliseconds = rawTimestamp > 1_000_000_000_000
      ? rawTimestamp
      : rawTimestamp * 1000;
    return new Date(milliseconds).toISOString();
  }

  return new Date().toISOString();
}

function serializedId(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && value._serialized) {
    return value._serialized;
  }
  return '';
}

function getSenderId(message) {
  return serializedId(message.author) ||
    serializedId(message.senderId) ||
    serializedId(message.sender?.id) ||
    serializedId(message.from) ||
    'unknown';
}

function getSenderName(message) {
  return message.notifyName ||
    message.sender?.formattedName ||
    message.sender?.pushname ||
    '';
}

function getGroupName(message) {
  return message.chat?.name ||
    message.chat?.formattedTitle ||
    TARGET_GROUPS.get(message.from) ||
    'WhatsApp events group';
}

function getImageCaption(message) {
  return typeof message.caption === 'string'
    ? message.caption.trim()
    : typeof message.text === 'string'
      ? message.text.trim()
      : '';
}

function getChatText(message) {
  for (const value of [message.body, message.text, message.content]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function collectionKey(message) {
  return `${message.from}:${getSenderId(message)}`;
}

function extensionFor(mimetype) {
  if (mimetype.includes('png')) return 'png';
  if (mimetype.includes('webp')) return 'webp';
  return 'jpg';
}

function errorCodes(error, result = new Set()) {
  if (!error || typeof error !== 'object') return result;
  if (typeof error.code === 'string') result.add(error.code);
  if (Array.isArray(error.errors)) {
    for (const nested of error.errors) errorCodes(nested, result);
  }
  if (error.cause) errorCodes(error.cause, result);
  return result;
}

function isRetryableNetworkError(error) {
  const retryable = new Set([
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'EAI_AGAIN',
    'ENETUNREACH',
    'EHOSTUNREACH',
    'UND_ERR_CONNECT_TIMEOUT'
  ]);

  return [...errorCodes(error)].some(code => retryable.has(code)) ||
    error?.name === 'AbortError' ||
    error?.name === 'TypeError';
}

function safeError(error) {
  const codes = [...errorCodes(error)];
  const rawMessage = typeof error?.message === 'string'
    ? error.message.split('\n')[0]
    : 'Unknown error';
  const message = rawMessage.replace(/https?:\/\/\S+/g, '[url]');
  return `${error?.name || 'Error'}${codes.length ? ` [${codes.join(', ')}]` : ''}: ${message}`;
}

async function decryptMediaWithRetry(message) {
  const totalAttempts = MEDIA_RETRY_DELAYS_MS.length + 1;

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    try {
      return await wa.decryptMedia(message);
    } catch (error) {
      if (attempt === totalAttempts || !isRetryableNetworkError(error)) throw error;
      const delay = MEDIA_RETRY_DELAYS_MS[attempt - 1];
      console.warn(`MEDIA DOWNLOAD RETRY ${attempt}/${totalAttempts - 1} IN ${delay / 1000}s`);
      await wait(delay);
    }
  }
}

function createCollection(message) {
  return {
    groupId: message.from,
    groupName: getGroupName(message),
    senderId: getSenderId(message),
    senderName: getSenderName(message),
    images: [],
    texts: [],
    timer: null,
    textOrder: 0
  };
}

function addText(collection, text, message, kind) {
  if (!text) return;
  collection.texts.push({
    text,
    kind,
    receivedAt: getReceivedAt(message),
    sourceMessageId: getMessageId(message),
    order: collection.textOrder++
  });
}

function assembledCaption(collection) {
  const ordered = [...collection.texts].sort((left, right) => {
    const timeDifference = Date.parse(left.receivedAt) - Date.parse(right.receivedAt);
    return timeDifference || left.order - right.order;
  });
  const parts = [];

  for (const entry of ordered) {
    if (parts[parts.length - 1] !== entry.text) parts.push(entry.text);
  }

  return parts.join('\n\n');
}

function clearCollectionTimer(key) {
  const collection = pendingCollections.get(key);
  if (!collection?.timer) return;
  clearTimeout(collection.timer);
  collection.timer = null;
}

function enqueue(key, task) {
  const previous = processingQueues.get(key) || Promise.resolve();
  let next;
  next = previous
    .catch(() => undefined)
    .then(task)
    .catch(error => console.error('EVENT PROCESSING ERROR:', safeError(error)))
    .finally(() => {
      if (processingQueues.get(key) === next) processingQueues.delete(key);
    });
  processingQueues.set(key, next);
  return next;
}

function scheduleCollection(key, delay, reason) {
  const collection = pendingCollections.get(key);
  if (!collection) return;

  clearCollectionTimer(key);
  collection.timer = setTimeout(() => {
    enqueue(key, () => flushCollection(key));
  }, delay);
  console.log(`WAITING ${delay / 1000}s: ${reason}`);
}

function safeLocalMessageId(message) {
  const normalized = getMessageId(message).replace(/[^a-zA-Z0-9_-]/g, '');
  return normalized.slice(-40) || String(Date.now());
}

async function handleImage(message, key) {
  let collection = pendingCollections.get(key);

  if (collection?.images.length >= MAX_IMAGES) {
    await flushCollection(key);
    collection = null;
  }

  if (!collection) {
    collection = createCollection(message);
    pendingCollections.set(key, collection);
  }

  console.log('\n--- EVENT IMAGE ---');
  console.log('Group:', collection.groupName);
  console.log('Sender:', collection.senderName || collection.senderId);

  let media;
  try {
    media = await decryptMediaWithRetry(message);
  } catch (error) {
    if (collection.images.length === 0 && collection.texts.length === 0) {
      pendingCollections.delete(key);
    } else {
      scheduleCollection(key, TEXT_WAIT_MS, 'media download failed; keeping collected images');
    }
    throw error;
  }

  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  const extension = extensionFor(message.mimetype);
  const filename = path.join(
    DOWNLOAD_DIR,
    `${message.t || Date.now()}-${safeLocalMessageId(message)}.${extension}`
  );
  fs.writeFileSync(filename, media);

  collection.images.push({
    media,
    mimetype: message.mimetype,
    extension,
    sourceMessageId: getMessageId(message),
    receivedAt: getReceivedAt(message),
    localPath: filename
  });
  collection.images.sort((left, right) => Date.parse(left.receivedAt) - Date.parse(right.receivedAt));

  const caption = getImageCaption(message);
  addText(collection, caption, message, 'caption');

  console.log('IMAGE SAVED:', filename);
  console.log('SIZE:', media.length, 'bytes');
  console.log('COLLECTION IMAGES:', collection.images.length);
  console.log('CAPTION:', caption || '(none)');

  if (collection.texts.length > 0) {
    scheduleCollection(key, MEDIA_BURST_MS, 'collecting the rest of the album');
  } else {
    scheduleCollection(key, TEXT_WAIT_MS, 'waiting for text from the same sender');
  }
}

function handleText(message, key) {
  const collection = pendingCollections.get(key);
  if (!collection || collection.images.length === 0) return;

  const text = getChatText(message);
  if (!text) return;

  const receivedAt = getReceivedAt(message);
  const lastImageAt = Math.max(...collection.images.map(image => Date.parse(image.receivedAt)));
  const textAt = Date.parse(receivedAt);

  if (Number.isFinite(lastImageAt) && Number.isFinite(textAt) && textAt - lastImageAt > TEXT_WAIT_MS) {
    console.log('IGNORED TEXT: outside the 60-second assembly window');
    scheduleCollection(key, 1_000, 'closing the earlier image collection');
    return;
  }

  addText(collection, text, message, 'text');
  console.log('\n--- EVENT TEXT ATTACHED ---');
  console.log('Text:', text);
  scheduleCollection(key, TEXT_SETTLE_MS, 'waiting for possible additional text');
}

function buildForm(collection) {
  const form = new FormData();

  for (const image of collection.images) {
    form.append(
      'image',
      new Blob([image.media], { type: image.mimetype }),
      `${image.sourceMessageId}.${image.extension}`
    );
    form.append('sourceMessageId', image.sourceMessageId);
    form.append('receivedAt', image.receivedAt);
  }

  form.append('sourceGroupId', collection.groupId);
  form.append('sourceGroupName', collection.groupName);
  form.append('sourceSenderId', collection.senderId);
  form.append('sourceSenderName', collection.senderName);
  form.append('caption', assembledCaption(collection));
  return form;
}

async function postCollectionWithRetry(collection) {
  const totalAttempts = INGEST_RETRY_DELAYS_MS.length + 1;

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetch(INGEST_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${INGEST_SECRET}`
        },
        body: buildForm(collection),
        signal: controller.signal
      });
      const responseText = await response.text();

      console.log('INGEST STATUS:', response.status);
      console.log('INGEST RESPONSE:', responseText);

      if (response.ok) return true;

      const retryable = response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;
      if (!retryable || attempt === totalAttempts) return false;
    } catch (error) {
      if (attempt === totalAttempts || !isRetryableNetworkError(error)) {
        console.error('INGEST REQUEST ERROR:', safeError(error));
        return false;
      }
    } finally {
      clearTimeout(timeout);
    }

    const delay = INGEST_RETRY_DELAYS_MS[attempt - 1];
    console.warn(`INGEST RETRY ${attempt}/${totalAttempts - 1} IN ${delay / 1000}s`);
    await wait(delay);
  }

  return false;
}

async function flushCollection(key) {
  const collection = pendingCollections.get(key);
  if (!collection) return;

  clearCollectionTimer(key);
  pendingCollections.delete(key);

  if (collection.images.length === 0) return;

  const totalBytes = collection.images.reduce((total, image) => total + image.media.length, 0);
  console.log('\n=== FINALIZING EVENT COLLECTION ===');
  console.log('IMAGES:', collection.images.length);
  console.log('TOTAL SIZE:', totalBytes, 'bytes');
  console.log('CAPTION:', assembledCaption(collection) || '(none)');

  if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
    console.error('✗ NOT SENT: images exceed the 4 MiB ingestion limit');
    console.error('LOCAL COPIES:');
    for (const image of collection.images) console.error(image.localPath);
    return;
  }

  console.log('SENDING TO SANCRISGO...');
  const sent = await postCollectionWithRetry(collection);

  if (sent) {
    console.log('✓ EVENT SENT TO MODERATION');
  } else {
    console.error('✗ INGEST FAILED; local image copies were kept');
  }
}

function handleMessage(message, key) {
  // The message may have entered this sender's queue while an earlier image
  // was still downloading, so stop any timer created in the meantime.
  clearCollectionTimer(key);

  if (message.type === 'image' && message.mimetype) {
    return handleImage(message, key);
  }

  if (message.type === 'chat' || message.type === 'text') {
    handleText(message, key);
  }
}

wa.create({
  sessionId: 'sancrisgo',
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  qrTimeout: 0,
  authTimeout: 0,
  chromiumArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage'
  ]
})
.then(async client => {
  console.log('\n=== OPENWA READY ===');
  console.log('Listening to:');
  for (const [groupId, groupName] of TARGET_GROUPS) {
    console.log(`- ${groupName}: ${groupId}`);
  }
  console.log('');

  client.onMessage(message => {
    if (!TARGET_GROUPS.has(message.from) || message.fromMe) return;

    const isImage = message.type === 'image' && Boolean(message.mimetype);
    const isText = message.type === 'chat' || message.type === 'text';
    if (!isImage && !isText) return;

    const key = collectionKey(message);
    clearCollectionTimer(key);
    enqueue(key, () => handleMessage(message, key));
  });
})
.catch(error => console.error('OPENWA ERROR:', safeError(error)));
