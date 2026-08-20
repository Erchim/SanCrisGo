"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  action: (formData: FormData) => Promise<void>;
  autoStart: boolean;
  candidateId: string;
  hasPrefill: boolean;
};

function AnalyzeButton({ hasPrefill }: { hasPrefill: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div className="admin-ai-action" aria-busy={pending} aria-live="polite">
      <button disabled={pending} type="submit">
        {pending && <span aria-hidden="true" className="admin-spinner" />}
        {pending ? "Analyzing flyer…" : hasPrefill ? "Analyze again" : "Analyze flyer"}
      </button>
      {pending && (
        <span className="admin-ai-progress">
          Reading the image and caption, then filling the form.
        </span>
      )}
    </div>
  );
}

export function AiAnalyzeForm({ action, autoStart, candidateId, hasPrefill }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;

    const frame = window.requestAnimationFrame(() => formRef.current?.requestSubmit());
    return () => window.cancelAnimationFrame(frame);
  }, [autoStart]);

  return (
    <form action={action} ref={formRef}>
      <input name="candidate_id" type="hidden" value={candidateId} />
      <AnalyzeButton hasPrefill={hasPrefill} />
    </form>
  );
}
