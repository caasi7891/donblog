import { codeToHtml } from "shiki";
import { CopyButton } from "./CopyButton";
import clsx from "clsx";
import React from "react";

// MDX maps `pre` to this component. The children is a <code> React element.
// We need to extract: the raw text content and the language class.
function extractFromChildren(children: React.ReactNode): {
  code: string;
  lang: string;
  className?: string;
} {
  // children is typically a React element: <code className="language-ts">...</code>
  if (React.isValidElement(children)) {
    const el = children as React.ReactElement<{
      children?: React.ReactNode;
      className?: string;
    }>;
    const rawCode =
      typeof el.props.children === "string" ? el.props.children.trim() : "";
    const className = el.props.className ?? "";
    const langMatch = className.match(/language-(.+)/);
    const lang = langMatch ? langMatch[1] : "text";
    return { code: rawCode, lang, className };
  }
  // Fallback: plain string inside <pre>
  return { code: String(children ?? "").trim(), lang: "text" };
}

export async function CodeBlock({
  children,
  title,
}: {
  children?: React.ReactNode;
  title?: string;
}) {
  const { code, lang } = extractFromChildren(children);

  const html = await codeToHtml(code, {
    lang: lang || "text",
    theme: "one-dark-pro",
  });

  return (
    <div className="relative group rounded-xl overflow-hidden my-6 border border-white/10 shadow-lg shadow-black/50">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-container-high border-b border-white/5 text-xs font-mono">
        <span className="text-on-surface-variant uppercase">{lang || "text"}</span>
        {title && <span className="text-outline-variant italic">{title}</span>}
      </div>
      <CopyButton text={code} />
      <div
        className={clsx(
          "p-4 text-sm font-mono system-scroll overflow-x-auto bg-[#0b0b0b] opacity-90"
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
