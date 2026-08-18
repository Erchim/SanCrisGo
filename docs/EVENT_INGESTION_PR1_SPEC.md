# PR №1: Event Ingestion Data Foundation

## Статус и цель

Это техническое задание описывает первый небольшой PR для ingestion-инфраструктуры
событий. PR создаёт только фундамент данных: таблицы, ограничения, индексы, RLS и
Storage bucket. Он не подключает OpenWA, Telegram, Instagram, AI/OCR и не меняет
публичный frontend.

Единым источником данных остаётся существующий Supabase-проект SanCrisGo:

```text
external source -> event candidate -> moderation -> structured event -> publication
```

На этапе MVP публикация в Instagram может исходить непосредственно из одобренного
candidate. Таблица `public.events` остаётся моделью структурированного события для
будущего сайта и в этом PR не изменяется.

## Проверка против текущей архитектуры

Предложение совместимо с текущим проектом при следующих условиях:

- новые сущности добавляются отдельной migration после существующих migrations;
- `events`, `places`, `guides`, их связи, политики и публичные URL не меняются;
- пути объектов, а не URL, хранятся в PostgreSQL, как уже принято для
  `cover_image_path`;
- ingestion-данные не доступны `anon` или обычным `authenticated` пользователям;
- серверные adapters и publishers в следующих PR работают с Supabase service role,
  который хранится только в server-side environment;
- каналы публикации моделируются отдельными строками, а не колонками candidate или
  `events`.

Разделение `event_candidates` и `events` обязательно: первый объект хранит
непроверенный исходный материал и provenance, второй — нормализованные данные,
пригодные для server-rendered страницы и SEO.

## Deliverables PR №1

### 1. Одна новая migration

Добавить новый, последовательно датированный файл в `supabase/migrations`. Не
редактировать уже применённые migrations. Migration должна в одной транзакционной
единице создать перечисленные ниже таблицы, ограничения, индексы, triggers, grants,
RLS и Storage bucket.

### 2. `public.event_candidates`

| Колонка | Тип и default | Требования |
| --- | --- | --- |
| `id` | `uuid default gen_random_uuid()` | primary key |
| `source_type` | `text` | not null, непустая строка; MVP пишет `whatsapp`, но constraint не должен блокировать будущие adapters |
| `source_group_id` | `text` | nullable, внешний id группы/контекста; nullable для источников без группы |
| `source_group_name` | `text` | nullable, исходное display name, не идентификатор |
| `source_sender_id` | `text` | nullable, внешний id автора |
| `source_sender_name` | `text` | nullable, исходное display name автора |
| `anchor_message_id` | `text` | not null, id сообщения/submit, открывшего candidate |
| `original_text` | `text default ''` | not null; агрегированный текст для moderation, исходные части остаются в messages |
| `media_path` | `text` | nullable; canonical Storage object path без bucket name и без URL |
| `status` | `text default 'collecting'` | not null; только `collecting`, `pending`, `approved`, `rejected` |
| `collection_started_at` | `timestamptz default now()` | not null |
| `collection_closed_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz default now()` | not null |
| `updated_at` | `timestamptz default now()` | not null; обновляется существующей `public.set_updated_at()` |

Ограничения:

- `source_type <> ''`, `anchor_message_id <> ''` и, если присутствует,
  `media_path <> ''` после `btrim`;
- `collection_closed_at >= collection_started_at`;
- `collecting` требует `collection_closed_at is null`;
- `pending`, `approved` и `rejected` требуют `collection_closed_at is not null`;
- уникальность `(source_type, anchor_message_id)`. Adapter обязан передавать
  namespace-stable id; для WhatsApp это полный OpenWA message id, а не локальный
  порядковый номер.

Индексы:

- partial index `(source_type, source_group_id, source_sender_id, collection_started_at desc)`
  для поиска открытого `collecting` candidate;
- index `(status, created_at)` для moderation queue;
- unique constraint по source/anchor уже создаёт индекс дедупликации.

Не кодировать трёхминутное окно в constraint или SQL trigger: это правило
`CandidateService`, которое должно меняться без migration.

### 3. `public.event_candidate_messages`

| Колонка | Тип и default | Требования |
| --- | --- | --- |
| `id` | `uuid default gen_random_uuid()` | primary key |
| `candidate_id` | `uuid` | not null FK на `event_candidates(id) on delete cascade` |
| `source_message_id` | `text` | not null, непустой внешний id |
| `message_type` | `text` | not null, непустой adapter-normalized тип (`image`, `text` для MVP) |
| `text` | `text` | nullable, оригинальный текст без извлечения/классификации |
| `media_path` | `text` | nullable, Storage object path без bucket name и URL |
| `sender_id` | `text` | nullable, внешний sender id для provenance |
| `received_at` | `timestamptz` | not null, timestamp источника |
| `sequence` | `integer` | not null, `>= 0`, порядок внутри candidate |
| `created_at` | `timestamptz default now()` | not null |

Ограничения и индексы:

- unique `(candidate_id, sequence)`;
- unique `(candidate_id, source_message_id)` для idempotent redelivery;
- index `(candidate_id, received_at, sequence)` для детерминированной сборки;
- хотя бы одно из `text` и `media_path` должно быть не-null;
- непустые `source_message_id`, `message_type` и присутствующий `media_path`.

Не добавлять OCR text, extracted date или AI output. Позже результаты pipeline должны
получить отдельные typed поля/таблицы, а оригинальные сообщения остаться неизменными.

### 4. `public.event_publications`

| Колонка | Тип и default | Требования |
| --- | --- | --- |
| `id` | `uuid default gen_random_uuid()` | primary key |
| `candidate_id` | `uuid` | not null FK на `event_candidates(id) on delete restrict` |
| `event_id` | `uuid` | nullable FK на существующий `events(id) on delete set null` |
| `channel` | `text` | not null, непустая строка; MVP пишет `instagram`, список не закрывать constraint-ом |
| `status` | `text default 'pending'` | not null; только `pending`, `publishing`, `published`, `failed` |
| `caption` | `text` | nullable; точный отправленный/подготовленный caption |
| `external_id` | `text` | nullable; Instagram media id для опубликованной строки |
| `published_at` | `timestamptz` | nullable |
| `error` | `text` | nullable; безопасное сообщение без token/request secrets |
| `created_at` | `timestamptz default now()` | not null |
| `updated_at` | `timestamptz default now()` | not null; trigger через `public.set_updated_at()` |

Ограничения и индексы:

- unique `(candidate_id, channel)`: одна логическая публикация на канал; retry
  обновляет эту строку, а не создаёт дубликат;
- `published` требует `published_at is not null`; остальные состояния требуют
  `published_at is null`;
- `published` для `instagram` дополнительно требует непустой `external_id`;
- `failed` требует непустой `error`; при выходе из `failed` service очищает `error`;
- index `(status, channel, created_at)` для publisher queue;
- index на ненулевой `event_id` для будущей связи с website event.

Создание publication row не должно автоматически менять candidate через database
trigger. Переходы состояния и идемпотентность оркестрирует будущий
`PublicationService`; channel-specific API остаётся в `InstagramPublisher`.

### 5. RLS и privileges

Для всех трёх таблиц:

1. Включить RLS.
2. Явно `revoke all` от `anon, authenticated`.
3. Не создавать public/user policies в PR №1.

Итог: browser clients не могут читать персональные sender/group данные, создавать
candidate, одобрять его или подделывать результат публикации. Server-side workers с
service-role key используют штатный bypass RLS. Это намеренно строже существующей
staff-модерации core content; доступ staff через Supabase Auth можно добавить вместе
с реальным moderation UI, если он появится. Telegram bot не считается browser user.

SQL tests должны подтвердить отсутствие доступа и для `anon`, и для обычного
`authenticated`, а также работоспособность service-role пути. Никогда не помещать
service-role key в `NEXT_PUBLIC_*` переменную.

### 6. Supabase Storage

Migration создаёт private bucket `event-media` через idempotent insert в
`storage.buckets` со следующими настройками:

- `public = false`;
- ограничение размера одного файла: 10 MiB;
- разрешённые MIME types: `image/jpeg`, `image/png`, `image/webp`.

Canonical layout:

```text
event-media/
  candidates/{candidate_id}/{message_id}.{safe_extension}
```

В базе хранится только часть после `event-media/`, например
`candidates/<candidate_id>/<message_id>.jpg`. Не хранить signed URL, public URL,
OpenWA URL, imgbb URL или локальный filesystem path.

Не добавлять `storage.objects` policies для `anon`/`authenticated`: загрузка и чтение
в MVP выполняются service-role workers. Будущий Instagram publisher создаёт
короткоживущий signed URL непосредственно перед Graph API `/media`; TTL должен
покрывать создание container, ожидание `FINISHED` и разумный запас. Постоянно
публичный bucket для Instagram не требуется. Удаление database candidate не должно
неявно удалять Storage object; lifecycle cleanup проектируется отдельно, чтобы не
терять audit source случайно.

### 7. TypeScript boundary types

Если репозиторий уже генерирует Supabase database types к моменту реализации,
обновить их штатной генерацией. В текущем состоянии генератора и committed database
types нет, поэтому PR №1 не должен вводить вручную дублированные row interfaces и не
должен добавлять dependency только ради types.

Разрешено добавить маленькие domain unions (`CandidateStatus`,
`PublicationStatus`) только одновременно с кодом, который их использует. В
data-only PR они не нужны: исполняемым контрактом остаются migration constraints.

## Явно вне scope

- OpenWA/WhatsApp webhook и трёхминутный scheduler;
- `CandidateService`, adapters и parsing;
- OCR, Vision, AI filter, classification и date extraction;
- Telegram bot, callback verification и moderation audit identity;
- Instagram Graph API и environment variables для него;
- создание/изменение строк `events`;
- frontend, admin panel, `/events`, Facebook и Telegram publishing;
- автоматическое удаление media и ведение истории каждой попытки retry.

## Порядок последующих PR

1. **PR №2 — publication core + `InstagramPublisher`:** server-only Supabase client,
   signed URL, container creation/status polling/publish, idempotent state transitions,
   secret validation и unit tests с mocked HTTP.
2. **PR №3 — Telegram moderation:** отправка private media/text, проверка callback и
   admin allowlist, atomic approve/reject, создание Instagram publication job.
   Если нужен полный audit решения, этот PR добавляет отдельную migration с
   moderator identity и Telegram update id.
3. **PR №4 — manual vertical test:** fixture/candidate без выдуманных публичных
   данных, полный test cycle до реального Instagram и runbook.
4. **PR №5 — OpenWA adapter:** только после отдельного номера; image trigger,
   same-group/same-sender aggregation, close timer и idempotent webhook handling.

## Acceptance criteria

- новая migration применяется к чистой локальной Supabase database поверх трёх
  существующих migrations и откатывается без ручных действий;
- schema diff содержит только три ingestion tables, их database objects и private
  `event-media` bucket; core tables не изменены;
- все check/FK/unique constraints имеют явные имена;
- повторная доставка anchor или candidate message завершается unique violation, а
  не создаёт дубль;
- невозможно закрыть candidate временем раньше начала или оставить закрытый status
  без `collection_closed_at`;
- невозможно пометить Instagram publication опубликованной без timestamp/media id
  или failed без error;
- `anon` и обычный `authenticated` не получают строки и не могут выполнять write
  operations во всех трёх таблицах и bucket;
- service role может создать candidate, добавить image/text messages, перевести его
  в `pending`/`approved`, создать publication и сохранить успешный результат;
- lint/build существующего Next.js приложения остаются зелёными;
- в commit отсутствуют реальные sender данные, изображения, Supabase credentials,
  Telegram token и Instagram access token.

## Обязательная проверка в PR №1

В описании PR привести результаты:

```bash
npm run lint
npm run build
supabase db reset
supabase db lint
git diff --check
```

Если Supabase CLI/Docker недоступны, это должно быть явно отмечено; вместо заявления
об успешной migration необходимо приложить review SQL и CI/local follow-up. Желательно
добавить SQL test, выполняемый через проектный test harness, как только он появится:
он должен покрывать happy path, constraint failures и RLS для обеих client roles.

