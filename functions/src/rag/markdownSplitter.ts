interface Heading {
  level: number;
  text: string;
  lineNumber: number;
}

interface Section {
  heading: Heading | null;
  content: string;
  startLine: number;
  endLine: number;
}

/**
 * マークダウンの階層構造を考慮してテキストを分割します
 * @param {string} markdown マークダウンテキスト
 * @param {number} maxChunkSize 最大チャンクサイズ（デフォルト: 1500文字）
 * @return {string[]} 分割されたチャンクの配列
 */
export function splitMarkdownByHierarchy(
  markdown: string,
  maxChunkSize = 1500,
): string[] {
  const lines = markdown.split("\n");
  const headings: Heading[] = [];

  // 見出しを検出
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      headings.push({
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
        lineNumber: i,
      });
    }
  }

  // 見出しがない場合は全体を1つのチャンクとして扱う
  if (headings.length === 0) {
    return [markdown];
  }

  // Instagramノウハウ資料の構造に合わせて、レベル2見出し（##）で分割
  const level2Headings = headings.filter((h) => h.level === 2);

  if (level2Headings.length === 0) {
    // レベル2見出しがない場合は、最初の見出しレベルで分割
    const firstLevel = headings[0].level;
    const sections = groupByHeadingLevel(headings, lines, firstLevel);
    return processSections(sections, maxChunkSize);
  }

  // レベル2見出しでセクションを作成
  const sections: Section[] = [];

  for (let i = 0; i < level2Headings.length; i++) {
    const currentHeading = level2Headings[i];
    const nextHeading = level2Headings[i + 1];

    const startLine = currentHeading.lineNumber;
    const endLine = nextHeading ? nextHeading.lineNumber - 1 : lines.length - 1;

    const content = lines.slice(startLine, endLine + 1).join("\n");

    sections.push({
      heading: currentHeading,
      content,
      startLine,
      endLine,
    });
  }

  return processSections(sections, maxChunkSize);
}

/**
 * 最小単位の見出し（###）ごとにテキストを分割します
 * @param {string} markdown マークダウンテキスト
 * @param {number} _maxChunkSize 最大チャンクサイズ（デフォルト: 1500文字）
 * @return {string[]} 分割されたチャンクの配列
 */
export function splitMarkdownByFineGrained(
  markdown: string,
  _maxChunkSize = 1500,
): string[] {
  const lines = markdown.split("\n");
  const headings: Heading[] = [];

  // 見出しを検出
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      headings.push({
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
        lineNumber: i,
      });
    }
  }

  // 見出しがない場合は全体を1つのチャンクとして扱う
  if (headings.length === 0) {
    return [markdown];
  }

  // レベル3以上の見出しを取得
  const level3PlusHeadings = headings.filter((h) => h.level >= 3);

  if (level3PlusHeadings.length === 0) {
    // レベル3以上の見出しがない場合は、レベル2見出しで分割
    const level2Headings = headings.filter((h) => h.level === 2);
    if (level2Headings.length === 0) {
      return [markdown];
    }

    const sections: Section[] = [];
    for (let i = 0; i < level2Headings.length; i++) {
      const currentHeading = level2Headings[i];
      const nextHeading = level2Headings[i + 1];

      const startLine = currentHeading.lineNumber;
      const endLine = nextHeading ? nextHeading.lineNumber - 1 : lines.length - 1;

      const content = lines.slice(startLine, endLine + 1).join("\n");

      sections.push({
        heading: currentHeading,
        content,
        startLine,
        endLine,
      });
    }

    return sections.map((section) => section.content);
  }

  // レベル3以上の見出しでセクションを作成
  const sections: Section[] = [];

  for (let i = 0; i < level3PlusHeadings.length; i++) {
    const currentHeading = level3PlusHeadings[i];
    const nextHeading = level3PlusHeadings[i + 1];

    const startLine = currentHeading.lineNumber;
    const endLine = nextHeading ? nextHeading.lineNumber - 1 : lines.length - 1;

    // 親の見出し情報を含むコンテキストを構築
    const context = buildContextWithParentHeadings(lines, currentHeading, headings);

    sections.push({
      heading: currentHeading,
      content: context,
      startLine,
      endLine,
    });
  }

  return sections.map((section) => section.content);
}

/**
 * 親の見出し情報を含むコンテキストを構築します
 * @param {string[]} lines 行の配列
 * @param {Heading} currentHeading 現在の見出し
 * @param {Heading[]} allHeadings 全ての見出し
 * @return {string} コンテキスト付きのコンテンツ
 */
function buildContextWithParentHeadings(
  lines: string[],
  currentHeading: Heading,
  allHeadings: Heading[],
): string {
  // 現在の見出しより上位の見出しを取得
  const parentHeadings = allHeadings
    .filter((h) => h.level < currentHeading.level && h.lineNumber < currentHeading.lineNumber)
    .sort((a, b) => a.lineNumber - b.lineNumber);

  // 親の見出し情報を構築
  const contextLines: string[] = [];

  // 最上位の見出し（#）を追加
  const topLevelHeading = parentHeadings.find((h) => h.level === 1);
  if (topLevelHeading) {
    contextLines.push(`# ${topLevelHeading.text}`);
  }

  // 現在の見出しの直近の親見出しを追加
  const immediateParent = parentHeadings
    .filter((h) => h.level < currentHeading.level)
    .sort((a, b) => b.lineNumber - a.lineNumber)[0];

  if (immediateParent) {
    const prefix = "#".repeat(immediateParent.level);
    contextLines.push(`${prefix} ${immediateParent.text}`);
  }

  // 現在の見出しを追加
  const currentPrefix = "#".repeat(currentHeading.level);
  contextLines.push(`${currentPrefix} ${currentHeading.text}`);

  // 現在の見出しから次の見出しまでの内容を追加
  const nextHeading = allHeadings.find((h) =>
    h.lineNumber > currentHeading.lineNumber && h.level <= currentHeading.level,
  );

  const endLine = nextHeading ? nextHeading.lineNumber - 1 : lines.length - 1;
  const contentLines = lines.slice(currentHeading.lineNumber + 1, endLine + 1);

  return contextLines.join("\n") + "\n\n" + contentLines.join("\n");
}

/**
 * 指定された見出しレベルでセクションをグループ化します
 * @param {Heading[]} headings 見出しの配列
 * @param {string[]} lines 行の配列
 * @param {number} targetLevel 対象の見出しレベル
 * @return {Section[]} セクションの配列
 */
function groupByHeadingLevel(
  headings: Heading[],
  lines: string[],
  targetLevel: number,
): Section[] {
  const targetHeadings = headings.filter((h) => h.level === targetLevel);
  const sections: Section[] = [];

  for (let i = 0; i < targetHeadings.length; i++) {
    const currentHeading = targetHeadings[i];
    const nextHeading = targetHeadings[i + 1];

    const startLine = currentHeading.lineNumber;
    const endLine = nextHeading ? nextHeading.lineNumber - 1 : lines.length - 1;

    const content = lines.slice(startLine, endLine + 1).join("\n");

    sections.push({
      heading: currentHeading,
      content,
      startLine,
      endLine,
    });
  }

  return sections;
}

/**
 * セクションを処理してチャンクに変換します
 * @param {Section[]} sections セクションの配列
 * @param {number} maxChunkSize 最大チャンクサイズ
 * @return {string[]} チャンクの配列
 */
function processSections(sections: Section[], maxChunkSize: number): string[] {
  const chunks: string[] = [];

  for (const section of sections) {
    // セクションが大きすぎる場合は分割
    if (section.content.length > maxChunkSize) {
      const subChunks = splitLargeSection(section.content, maxChunkSize);
      chunks.push(...subChunks);
    } else {
      chunks.push(section.content);
    }
  }

  return chunks;
}

/**
 * 大きなセクションを適切に分割します
 * @param {string} content セクションの内容
 * @param {number} maxChunkSize 最大チャンクサイズ
 * @return {string[]} 分割されたチャンクの配列
 */
function splitLargeSection(content: string, maxChunkSize: number): string[] {
  const lines = content.split("\n");
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentSize = 0;

  for (const line of lines) {
    const lineSize = line.length + 1; // +1 for newline

    // 新しいチャンクを開始する必要があるかチェック
    if (currentSize + lineSize > maxChunkSize && currentChunk.length > 0) {
      // 現在のチャンクを保存
      chunks.push(currentChunk.join("\n"));
      currentChunk = [];
      currentSize = 0;
    }

    // 単一の行がmaxChunkSizeを超える場合は、強制的に分割
    if (lineSize > maxChunkSize) {
      // 現在のチャンクを保存（空でなくても）
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join("\n"));
        currentChunk = [];
        currentSize = 0;
      }

      // 長い行を複数のチャンクに分割
      const words = line.split(" ");
      let tempChunk: string[] = [];
      let tempSize = 0;

      for (const word of words) {
        const wordSize = word.length + 1; // +1 for space

        if (tempSize + wordSize > maxChunkSize && tempChunk.length > 0) {
          chunks.push(tempChunk.join(" "));
          tempChunk = [];
          tempSize = 0;
        }

        tempChunk.push(word);
        tempSize += wordSize;
      }

      if (tempChunk.length > 0) {
        chunks.push(tempChunk.join(" "));
      }
    } else {
      currentChunk.push(line);
      currentSize += lineSize;
    }
  }

  // 最後のチャンクを追加
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n"));
  }

  return chunks;
}

/**
 * マークダウンの見出しレベルを取得します
 * @param {string} line 行のテキスト
 * @return {number} 見出しレベル（0の場合は見出しではない）
 */
export function getHeadingLevel(line: string): number {
  const match = line.match(/^(#{1,6})\s+/);
  return match ? match[1].length : 0;
}

/**
 * 見出しのテキストを抽出します
 * @param {string} line 行のテキスト
 * @return {string|null} 見出しのテキスト（見出しでない場合はnull）
 */
export function extractHeadingText(line: string): string | null {
  const match = line.match(/^(#{1,6})\s+(.+)$/);
  return match ? match[2].trim() : null;
}
