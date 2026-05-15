import { useCallback, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import type { SearchResult } from "@/lib/web-search.functions";

type Props = {
  markdown: string;
  sources?: SearchResult[];
  prompt?: string | null;
};

function buildSourcesMarkdown(sources: SearchResult[]): string {
  if (!sources.length) return "";
  const lines = sources.map((s, i) => `${i + 1}. [${s.title || s.url}](${s.url})`);
  return `\n\n## Sources\n\n${lines.join("\n")}\n`;
}

function markdownToHtml(md: string): string {
  return renderToStaticMarkup(
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>,
  );
}

async function copyRich(html: string, plain: string) {
  // Prefer ClipboardItem (rich HTML) so Google Docs paste preserves formatting.
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
      // fall through to plain text
    }
  }
  await navigator.clipboard.writeText(plain);
}

export function ReportView({ markdown, sources = [], prompt }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const heading = prompt ? `# Research: ${prompt}\n\n` : "";
    const fullMd = heading + markdown + buildSourcesMarkdown(sources);
    const html = markdownToHtml(fullMd);
    try {
      await copyRich(html, fullMd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  }, [markdown, sources, prompt]);

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute right-0 top-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        title="Copy report with formatting (paste into Google Docs)"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy report"}
      </button>
      <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-foreground prose-a:underline prose-a:underline-offset-2 hover:prose-a:opacity-70 prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
