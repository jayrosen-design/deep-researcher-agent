import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquare, Send, Plus, X, Loader2, BookOpen, Minus } from "lucide-react";

import { navigatorChat } from "@/lib/navigator-chat.functions";
import { loadHistory, type HistoryEntry } from "@/lib/research-history";
import type { SearchResult } from "@/lib/web-search.functions";
import type { UserSettings } from "@/lib/user-settings";

type ChatMsg = { role: "user" | "assistant"; content: string };

type ContextDoc = {
  id: string;
  title: string;
  prompt: string;
  report: string;
  sources: SearchResult[];
};

type Props = {
  currentDoc: ContextDoc;
  settings: UserSettings;
};

function buildGroundingPrompt(docs: ContextDoc[]): {
  system: string;
  flatSources: { url: string; title: string }[];
} {
  const flatSources: { url: string; title: string }[] = [];
  const seen = new Set<string>();
  const docBlocks: string[] = [];

  for (const doc of docs) {
    const localStart = flatSources.length + 1;
    const localLines: string[] = [];
    for (const s of doc.sources) {
      if (seen.has(s.url)) continue;
      seen.add(s.url);
      flatSources.push({ url: s.url, title: s.title });
      localLines.push(`  [${flatSources.length}] ${s.title} — ${s.url}`);
    }
    docBlocks.push(
      `===== DOCUMENT: ${doc.title} =====
Original research prompt: ${doc.prompt}

Report:
${doc.report}

Sources for this document (numbered globally, ${localStart}–${flatSources.length}):
${localLines.join("\n") || "  (none)"}
===== END DOCUMENT =====`,
    );
  }

  const system = `You are a research assistant chatbot. The user has completed deep research and wants to chat about the resulting report(s) below.

STRICT GROUNDING RULES:
- Answer ONLY using information found in the provided documents below.
- If the user asks something that is not covered, say so plainly and suggest what additional research could answer it. Do NOT speculate or use outside knowledge.
- Whenever you make a factual claim, cite the source(s) inline using the format [n](URL) where n is the source number from the list below and URL is its URL. Use multiple citations when relevant, e.g. "...growth has accelerated [1](https://...) [3](https://...)."
- Prefer concise, well-structured Markdown answers. Use bullet lists and short paragraphs.
- Never fabricate URLs or source numbers. Only use the ones listed.

Available documents and sources:

${docBlocks.join("\n\n")}

Begin the conversation. Be helpful, accurate, and always cite.`;

  return { system, flatSources };
}

export function ResearchChat({ currentDoc, settings }: Props) {
  const [extraDocs, setExtraDocs] = useState<ContextDoc[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, [pickerOpen]);

  // Reset chat when the current research changes.
  useEffect(() => {
    setMessages([]);
    setExtraDocs([]);
    setError(null);
  }, [currentDoc.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const allDocs = useMemo(() => [currentDoc, ...extraDocs], [currentDoc, extraDocs]);
  const { system } = useMemo(() => buildGroundingPrompt(allDocs), [allDocs]);

  const availableHistory = history.filter(
    (h) => h.id !== currentDoc.id && !extraDocs.some((d) => d.id === h.id) && !!h.report,
  );

  const handleAddDoc = (entry: HistoryEntry) => {
    setExtraDocs((d) => [
      ...d,
      {
        id: entry.id,
        title: entry.title || entry.prompt,
        prompt: entry.prompt,
        report: entry.report,
        sources: entry.sources,
      },
    ]);
    setPickerOpen(false);
  };

  const handleRemoveDoc = (id: string) => {
    setExtraDocs((d) => d.filter((doc) => doc.id !== id));
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setError(null);
    const next: ChatMsg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const { content } = await navigatorChat({
        data: {
          model: settings.synthesisModel,
          temperature: 0.3,
          maxTokens: 4000,
          apiKey: settings.navigatorApiKey || undefined,
          messages: [
            { role: "system", content: system },
            ...next.map((m) => ({ role: m.role, content: m.content })),
          ],
        },
      });
      setMessages((m) => [...m, { role: "assistant", content: content.trim() }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:opacity-90"
        aria-label="Open chat"
      >
        <MessageSquare className="size-4" />
        Chat with research
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex h-[min(620px,calc(100vh-3rem))] w-[min(420px,calc(100vw-3rem))] flex-col rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Chat with research
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Minimize chat"
        >
          <Minus className="size-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">


      {/* Document chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-foreground/30 bg-background px-3 py-1.5 text-xs text-foreground">
          <BookOpen className="size-3.5" />
          <span className="max-w-[240px] truncate" title={currentDoc.title}>
            {currentDoc.title}
          </span>
          <span className="text-muted-foreground">(this report)</span>
        </div>
        {extraDocs.map((d) => (
          <div
            key={d.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground"
          >
            <BookOpen className="size-3.5" />
            <span className="max-w-[240px] truncate" title={d.title}>
              {d.title}
            </span>
            <button
              type="button"
              onClick={() => handleRemoveDoc(d.id)}
              className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Remove document"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add report
          </button>
          {pickerOpen && (
            <div className="absolute left-0 top-full z-10 mt-2 w-80 rounded-lg border border-border bg-popover p-2 shadow-lg">
              {availableHistory.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No other researches available.
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto">
                  {availableHistory.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => handleAddDoc(h)}
                        className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-xs hover:bg-accent"
                      >
                        <span className="line-clamp-1 font-medium text-foreground">
                          {h.title || h.prompt}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {h.sources.length} sources
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="mb-3 min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background p-3"
      >
        {messages.length === 0 && !sending && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Ask anything about {extraDocs.length > 0 ? "these reports" : "this report"}.
            Answers are grounded in the sources with inline citations.
          </div>
        )}
        <div className="space-y-5">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="prose prose-sm prose-neutral max-w-none dark:prose-invert prose-a:text-foreground prose-a:underline prose-a:underline-offset-2 hover:prose-a:opacity-70 prose-p:my-2 prose-ul:my-2">
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
                  {m.content}
                </ReactMarkdown>
              </div>
            ),
          )}
          {sending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Thinking…
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2 rounded-lg border border-border bg-background p-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the research…"
          rows={2}
          className="min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          Send
        </button>
      </div>
      </div>
    </div>
  );
}
