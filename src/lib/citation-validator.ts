import { type SearchResult } from "./web-search.functions";

/**
 * Strip any inline Markdown link whose URL was not in the gathered sources.
 * Preserves the anchor text so the prose still reads naturally.
 */
export function sanitizeReportCitations(
  rawMarkdown: string,
  collectedSources: SearchResult[],
): { sanitizedMarkdown: string; hallucinatedUrls: string[] } {
  const validUrls = new Set(
    collectedSources.map((s) => s.url.trim().toLowerCase()),
  );

  const hallucinatedUrls: string[] = [];
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

  const sanitizedMarkdown = rawMarkdown.replace(
    markdownLinkRegex,
    (match, anchorText: string, url: string) => {
      const normalized = url.trim().toLowerCase();
      if (validUrls.has(normalized)) return match;
      hallucinatedUrls.push(url);
      return anchorText;
    },
  );

  return { sanitizedMarkdown, hallucinatedUrls };
}
