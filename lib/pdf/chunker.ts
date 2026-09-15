export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  pageNumber?: number;
  sectionTitle?: string;
  text: string;
  keywords: string[];
  charCount: number;
}

/**
 * Splits extracted document text into structured, page-indexed chunks
 */
export function chunkDocumentText(
  documentId: string,
  documentTitle: string,
  fullText: string
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  
  // Check if text has explicit [Page X] demarcations
  const pageSections = fullText.split(/\[Page\s+(\d+)\]/i);

  if (pageSections.length > 1) {
    for (let i = 1; i < pageSections.length; i += 2) {
      const pageNum = parseInt(pageSections[i], 10) || undefined;
      const pageContent = (pageSections[i + 1] || "").trim();
      if (!pageContent) continue;

      // Sub-chunk page content by headings or paragraph blocks of ~200-400 words
      const paragraphs = pageContent.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      let currentBuffer = "";
      let currentSection = detectHeading(pageContent) || `Page ${pageNum}`;

      for (const p of paragraphs) {
        if (isHeading(p)) {
          if (currentBuffer.length > 100) {
            chunks.push(createChunk(documentId, documentTitle, currentBuffer, pageNum, currentSection));
            currentBuffer = "";
          }
          currentSection = p.replace(/^[\d.]+\s*/, "").replace(/:$/, "").trim();
        }

        currentBuffer += (currentBuffer ? "\n\n" : "") + p;

        if (currentBuffer.length >= 800) {
          chunks.push(createChunk(documentId, documentTitle, currentBuffer, pageNum, currentSection));
          currentBuffer = "";
        }
      }

      if (currentBuffer.trim().length > 0) {
        chunks.push(createChunk(documentId, documentTitle, currentBuffer, pageNum, currentSection));
      }
    }
  } else {
    // No page demarcations: chunk by paragraphs
    const paragraphs = fullText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    let currentBuffer = "";
    let currentSection = "General Content";

    for (const p of paragraphs) {
      if (isHeading(p)) {
        if (currentBuffer.length > 100) {
          chunks.push(createChunk(documentId, documentTitle, currentBuffer, undefined, currentSection));
          currentBuffer = "";
        }
        currentSection = p.replace(/^[\d.]+\s*/, "").replace(/:$/, "").trim();
      }

      currentBuffer += (currentBuffer ? "\n\n" : "") + p;

      if (currentBuffer.length >= 800) {
        chunks.push(createChunk(documentId, documentTitle, currentBuffer, undefined, currentSection));
        currentBuffer = "";
      }
    }

    if (currentBuffer.trim().length > 0) {
      chunks.push(createChunk(documentId, documentTitle, currentBuffer, undefined, currentSection));
    }
  }

  return chunks;
}

/**
 * Lightweight keyword & topic-based retrieval engine (BM25-style term frequency scoring)
 */
export function retrieveRelevantChunks(
  chunks: DocumentChunk[],
  topic: string,
  topK: number = 4
): DocumentChunk[] {
  if (!chunks || chunks.length === 0) return [];
  if (chunks.length <= topK) return chunks;

  const topicTerms = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scoredChunks = chunks.map((chunk) => {
    let score = 0;
    const lowerText = chunk.text.toLowerCase();
    const lowerSection = (chunk.sectionTitle || "").toLowerCase();

    // 1. Direct topic match in section heading
    if (lowerSection.includes(topic.toLowerCase())) {
      score += 50;
    }

    // 2. Individual topic keywords in section
    for (const term of topicTerms) {
      if (lowerSection.includes(term)) score += 15;
    }

    // 3. Keyword occurrences in body text
    for (const term of topicTerms) {
      const matches = lowerText.split(term).length - 1;
      score += Math.min(10, matches * 4);
    }

    // 4. Overlap with chunk extracted keywords
    for (const kw of chunk.keywords) {
      if (topicTerms.includes(kw.toLowerCase())) {
        score += 8;
      }
    }

    return { chunk, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);

  // Return top K chunks (or all if top scores are non-zero)
  const topResults = scoredChunks.slice(0, topK).map((item) => item.chunk);
  return topResults.length > 0 ? topResults : chunks.slice(0, topK);
}

/**
 * Retrieves relevant chunks pooled across multiple selected topics
 */
export function retrieveChunksForMultipleTopics(
  chunks: DocumentChunk[],
  topics: string[],
  maxTotalChunks: number = 6
): DocumentChunk[] {
  if (!chunks || chunks.length === 0) return [];
  if (!topics || topics.length === 0) return chunks.slice(0, maxTotalChunks);

  const selectedSet = new Set<string>();
  const results: DocumentChunk[] = [];
  const perTopicK = Math.max(2, Math.ceil(maxTotalChunks / topics.length));

  for (const topic of topics) {
    const topicChunks = retrieveRelevantChunks(chunks, topic, perTopicK);
    for (const chunk of topicChunks) {
      if (!selectedSet.has(chunk.id)) {
        selectedSet.add(chunk.id);
        results.push(chunk);
      }
      if (results.length >= maxTotalChunks) break;
    }
    if (results.length >= maxTotalChunks) break;
  }

  return results.length > 0 ? results : chunks.slice(0, maxTotalChunks);
}

function isHeading(line: string): boolean {
  return /^(?:(?:Section|Chapter|Unit|Module|Part)\s+\d+[:.]?|\d+\.\d+|\b[A-Z][A-Za-z0-9\s,&:\-]{3,60}$)/.test(line.trim());
}

function detectHeading(text: string): string | null {
  const firstLine = text.split("\n")[0]?.trim();
  return firstLine && isHeading(firstLine) ? firstLine : null;
}

function createChunk(
  documentId: string,
  documentTitle: string,
  text: string,
  pageNumber?: number,
  sectionTitle?: string
): DocumentChunk {
  const words = text.split(/\s+/).filter(w => w.length > 3);
  const keywords = Array.from(
    new Set(words.map(w => w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()).filter(w => w.length >= 4))
  ).slice(0, 6);

  return {
    id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    documentId,
    documentTitle,
    pageNumber,
    sectionTitle,
    text: text.trim(),
    keywords,
    charCount: text.length,
  };
}
