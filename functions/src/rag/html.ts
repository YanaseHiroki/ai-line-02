import { load } from "cheerio";

export function extractTextFromHtml(html: string): string {
  const $ = load(html);

  // Remove non-content elements
  $(
    "script, style, noscript, iframe, svg, canvas, meta, link, title, aside, nav, header, footer"
  ).remove();

  // Prefer body text; fallback to root
  const raw = ($("body").text() || $.root().text() || "").trim();

  // Normalize whitespace
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}


