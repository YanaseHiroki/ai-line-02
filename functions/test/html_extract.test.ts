import { describe, it, expect } from "vitest";
import { extractTextFromHtml } from "../src/rag/html";

describe("extractTextFromHtml", () => {
  it("script/styleを除去し本文テキストを抽出する", () => {
    const html = `
      <html>
        <head>
          <style>.x{color:red}</style>
          <script>console.log('x')</script>
        </head>
        <body>
          <h1>店舗情報</h1>
          <p>営業時間は9:00-18:00です。</p>
          <p>所在地は東京都渋谷区です。</p>
        </body>
      </html>`;
    const text = extractTextFromHtml(html);
    expect(text).toContain("店舗情報");
    expect(text).toContain("営業時間は9:00-18:00です。");
    expect(text).toContain("所在地は東京都渋谷区です。");
    expect(text).not.toContain("console.log");
    expect(text).not.toContain(".x{color:red}");
  });
});


