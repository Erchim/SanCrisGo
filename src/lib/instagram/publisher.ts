import "server-only";

const GRAPH_API_ORIGIN = "https://graph.instagram.com";
const DEFAULT_API_VERSION = "v26.0";
const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_TIMEOUT_MS = 120_000;

type Fetch = typeof fetch;

export interface InstagramPublisherConfig {
  accessToken: string;
  igUserId: string;
  apiVersion?: string;
  locationId?: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

interface InstagramPublisherDependencies {
  fetch?: Fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
}

interface GraphApiErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

interface IdResponse extends GraphApiErrorBody {
  id?: string;
}

interface ContainerStatusResponse extends GraphApiErrorBody {
  status_code?: string;
  status?: string;
}

export interface PublishImageInput {
  imageUrl: string;
  caption: string;
}

export class InstagramPublisherError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "InstagramPublisherError";
  }
}

export class InstagramPublisher {
  private readonly accessToken: string;
  private readonly igUserId: string;
  private readonly apiVersion: string;
  private readonly locationId: string | undefined;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;
  private readonly fetch: Fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(
    config: InstagramPublisherConfig,
    dependencies: InstagramPublisherDependencies = {},
  ) {
    this.accessToken = requireValue(config.accessToken, "Instagram access token");
    this.igUserId = requireValue(config.igUserId, "Instagram user ID");
    this.apiVersion = normalizeApiVersion(config.apiVersion ?? DEFAULT_API_VERSION);
    this.locationId = normalizeLocationId(config.locationId);
    this.pollIntervalMs = positiveNumber(
      config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
      "pollIntervalMs",
    );
    this.timeoutMs = positiveNumber(config.timeoutMs ?? DEFAULT_TIMEOUT_MS, "timeoutMs");
    this.fetch = dependencies.fetch ?? globalThis.fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? ((milliseconds) => new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    }));
  }

  async publishImage(input: PublishImageInput): Promise<string> {
    const imageUrl = requireHttpUrl(input.imageUrl);
    const creationId = await this.createContainer(imageUrl, input.caption);
    await this.waitForContainer(creationId);

    const response = await this.post<IdResponse>(`/${this.igUserId}/media_publish`, {
      creation_id: creationId,
    });

    if (!response.id) {
      throw new InstagramPublisherError("Instagram media publish response did not include an ID.");
    }

    return response.id;
  }

  private async createContainer(imageUrl: string, caption: string): Promise<string> {
    const fields: Record<string, string> = {
      image_url: imageUrl,
    };
    if (caption) fields.caption = caption;
    if (this.locationId) fields.location_id = this.locationId;

    const response = await this.post<IdResponse>(`/${this.igUserId}/media`, fields);

    if (!response.id) {
      throw new InstagramPublisherError("Instagram container response did not include a creation ID.");
    }

    return response.id;
  }

  private async waitForContainer(creationId: string): Promise<void> {
    const startedAt = this.now();

    while (true) {
      const query = new URLSearchParams({
        fields: "status_code,status",
      });
      const response = await this.request<ContainerStatusResponse>(
        `${this.endpoint(`/${creationId}`)}?${query.toString()}`,
        { method: "GET" },
      );
      const status = response.status_code?.toUpperCase();

      if (status === "FINISHED") {
        return;
      }

      if (status === "ERROR" || status === "EXPIRED") {
        const detail = response.status ? `: ${response.status}` : "";
        throw new InstagramPublisherError(`Instagram container entered ${status} status${detail}.`);
      }

      if (this.now() - startedAt >= this.timeoutMs) {
        throw new InstagramPublisherError(
          `Instagram container did not finish within ${this.timeoutMs}ms.`,
        );
      }

      await this.sleep(this.pollIntervalMs);
    }
  }

  private async post<T>(path: string, fields: Record<string, string>): Promise<T> {
    const body = new URLSearchParams(fields);
    return this.request<T>(this.endpoint(path), { method: "POST", body });
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    let response: Response;
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.accessToken}`);

    try {
      response = await this.fetch(url, { ...init, headers });
    } catch {
      // Do not attach the fetch error: request metadata may contain credentials.
      throw new InstagramPublisherError("Instagram API request failed.");
    }

    let body: T & GraphApiErrorBody;
    try {
      body = await response.json() as T & GraphApiErrorBody;
    } catch (cause) {
      throw new InstagramPublisherError(
        `Instagram API returned an invalid response (HTTP ${response.status}).`,
        { cause },
      );
    }

    if (!response.ok || body.error) {
      const error = body.error;
      const description = error?.message ?? `HTTP ${response.status}`;
      const code = error?.code === undefined ? "" : ` (code ${error.code})`;
      throw new InstagramPublisherError(`Instagram API error${code}: ${description}.`);
    }

    return body;
  }

  private endpoint(path: string): string {
    return `${GRAPH_API_ORIGIN}/${this.apiVersion}${path}`;
  }
}

export function createInstagramPublisherFromEnv(): InstagramPublisher {
  return new InstagramPublisher({
    accessToken: requireValue(process.env.IG_ACCESS_TOKEN, "IG_ACCESS_TOKEN"),
    igUserId: requireValue(process.env.IG_USER_ID, "IG_USER_ID"),
    apiVersion: process.env.IG_API_VERSION ?? DEFAULT_API_VERSION,
    locationId: process.env.IG_DEFAULT_LOCATION_ID,
  });
}

function requireValue(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new InstagramPublisherError(`${name} is required.`);
  }
  return normalized;
}

function normalizeApiVersion(value: string): string {
  const normalized = value.trim();
  if (!/^v\d+\.\d+$/.test(normalized)) {
    throw new InstagramPublisherError("Instagram API version must look like v26.0.");
  }
  return normalized;
}

function normalizeLocationId(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (!/^\d+$/.test(normalized)) {
    throw new InstagramPublisherError("Instagram location ID must be numeric.");
  }
  return normalized;
}

function positiveNumber(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new InstagramPublisherError(`${name} must be a positive number.`);
  }
  return value;
}

function requireHttpUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Unsupported protocol");
    }
    return url.toString();
  } catch {
    throw new InstagramPublisherError("imageUrl must be a valid HTTP(S) URL.");
  }
}
