import "server-only";
import {
  generateEventAiPrefill,
  getEventAiModel,
  safeAiErrorClass,
  type GeneratedEventAiPrefill,
} from "@/lib/events/event-ai-prefill";
import {
  EventWebsiteAdminError,
  EventWebsiteAdminService,
  type WebsiteCandidateDetail,
} from "@/lib/events/website-admin";

const FALLBACK_EVENT_AI_MODEL = "openai/gpt-5-nano";

type EventAiPrefillStore = Pick<
  EventWebsiteAdminService,
  "getCandidateDetail" | "saveAiPrefill" | "saveAiPrefillFailure"
>;

type GeneratePrefill = (input: {
  caption: string;
  receivedAt: string;
  imageUrls: string[];
}) => Promise<GeneratedEventAiPrefill>;

export type EventAiPrefillWorkflowDependencies = {
  store: EventAiPrefillStore;
  generate: GeneratePrefill;
  getModel: () => string;
};

export type EventAiPrefillWorkflowResult = "generated" | "already-ready";

function defaultDependencies(): EventAiPrefillWorkflowDependencies {
  return {
    store: new EventWebsiteAdminService(),
    generate: generateEventAiPrefill,
    getModel: getEventAiModel,
  };
}

function generationInput(detail: WebsiteCandidateDetail) {
  return {
    caption: detail.candidate.original_text,
    receivedAt: detail.candidate.created_at,
    imageUrls: detail.media.slice(0, 2).map((media) => media.signedUrl),
  };
}

export async function runEventAiPrefillWorkflow(
  candidateId: string,
  options: { force?: boolean } = {},
  dependencies: EventAiPrefillWorkflowDependencies = defaultDependencies(),
): Promise<EventAiPrefillWorkflowResult> {
  const detail = await dependencies.store.getCandidateDetail(candidateId);
  if (!detail) throw new EventWebsiteAdminError("Event candidate was not found.");

  const hadReadyPrefill = detail.aiPrefill?.status === "ready";
  if (hadReadyPrefill && !options.force) return "already-ready";

  let model = FALLBACK_EVENT_AI_MODEL;
  try {
    model = dependencies.getModel();
    const generated = await dependencies.generate(generationInput(detail));
    await dependencies.store.saveAiPrefill(candidateId, generated);
    return "generated";
  } catch (error) {
    if (!hadReadyPrefill) {
      try {
        await dependencies.store.saveAiPrefillFailure(candidateId, model, safeAiErrorClass(error));
      } catch {
        // The original analysis error is more useful than a secondary telemetry failure.
      }
    }
    throw error;
  }
}
