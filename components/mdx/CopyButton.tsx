"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import clsx from "clsx";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className={clsx(
        "p-1.5 rounded-md border border-white/5 transition-colors absolute right-4 top-4",
        copied ? "bg-secondary/20 text-secondary" : "bg-surface-container-high hover:bg-surface-bright text-neutral-500 hover:text-white"
      )}
      aria-label="Copy code"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
