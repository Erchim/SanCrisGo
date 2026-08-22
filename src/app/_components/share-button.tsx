"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locales";
import { shareOrCopy } from "@/lib/share";

const labels = {
  en: { share: "Share", copied: "Link copied", unavailable: "Copy unavailable" },
  es: { share: "Compartir", copied: "Enlace copiado", unavailable: "No se pudo copiar" },
} as const;

async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Copy command was unavailable.");
}

export function ShareButton({
  locale,
  title,
  url,
}: {
  locale: Locale;
  title: string;
  url: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const text = labels[locale];

  async function handleShare() {
    setStatus("idle");
    try {
      const result = await shareOrCopy(
        { title, url },
        {
          share: navigator.share
            ? (payload) => navigator.share(payload)
            : undefined,
          copy: copyToClipboard,
        },
      );
      if (result === "copied") setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <span className="share-action">
      <button type="button" onClick={handleShare}>{text.share}</button>
      <span aria-live="polite" className="share-status">
        {status === "copied" ? text.copied : status === "error" ? text.unavailable : ""}
      </span>
    </span>
  );
}
