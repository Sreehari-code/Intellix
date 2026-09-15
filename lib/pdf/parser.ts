import { extractText, getDocumentProxy, getMeta } from "unpdf";
import { TopicItem } from "@/types";

export interface ParsedPdfResult {
  text: string;
  pageCount: number;
  wordCount: number;
  charCount: number;
  summary: string;
  topics: TopicItem[];
  detectedTitle: string;
}

/**
 * Extracts and processes text from a PDF ArrayBuffer
 */
export async function extractPdfText(
  pdfBuffer: ArrayBuffer,
  fileName: string
): Promise<ParsedPdfResult> {
  const uint8 = new Uint8Array(pdfBuffer);
  
  if (uint8.length === 0) {
    throw new Error("The uploaded PDF file is empty (0 bytes).");
  }

  const pdf = await getDocumentProxy(uint8);
  const pageCount = pdf.numPages;

  if (pageCount === 0) {
    throw new Error("Unable to parse pages from this PDF file.");
  }

  // Extract page texts
  const { text: rawTextArray } = await extractText(pdf, { mergePages: false });
  
  const pagesText: string[] = Array.isArray(rawTextArray) 
    ? rawTextArray 
    : [rawTextArray];

  // Join pages with explicit page demarcation
  const fullText = pagesText
    .map((page, index) => `[Page ${index + 1}]\n${page.trim()}`)
    .join("\n\n")
    .replace(/\r\n/g, "\n");

  const cleanText = fullText.replace(/[ \t]+/g, " ").trim();

  // Word count & Char count
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const charCount = cleanText.length;

  if (wordCount < 10) {
    throw new Error("The PDF does not contain enough extractable text. Scanned images without OCR cannot be processed directly.");
  }

  // Generate Document Title from filename or first non-empty line
  const fallbackTitle = fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const firstLines = cleanText.split("\n").map(l => l.trim()).filter(l => l.length > 3 && !l.startsWith("[Page"));
  const detectedTitle = firstLines.length > 0 && firstLines[0].length < 80 
    ? firstLines[0] 
    : fallbackTitle;

  // Generate Executive Summary
  const summaryParagraphs = cleanText
    .split("\n\n")
    .map(p => p.trim())
    .filter(p => p.length > 80 && !p.startsWith("[Page"));
  
  const rawSummary = summaryParagraphs.slice(0, 2).join(" ") || cleanText.slice(0, 300);
  const summary = rawSummary.length > 280 ? rawSummary.slice(0, 280) + "..." : rawSummary;

  // Heuristic Topic Discovery from Headings & Section markers
  const topics: TopicItem[] = extractHeuristicTopics(cleanText, detectedTitle);

  return {
    text: cleanText,
    pageCount,
    wordCount,
    charCount,
    summary,
    topics,
    detectedTitle,
  };
}

/**
 * Extracts candidate topics from headings, capitalizations, or page chunks
 */
function extractHeuristicTopics(fullText: string, fallbackTitle: string): TopicItem[] {
  const topics: TopicItem[] = [];
  const lines = fullText.split("\n").map(l => l.trim());

  const headingRegex = /^(?:Chapter\s+\d+|Section\s+\d+|\d+\.\d+|\b[A-Z][A-Za-z0-9\s,&-]{3,50}:?$)/;
  
  for (const line of lines) {
    if (line.startsWith("[Page")) continue;
    if (headingRegex.test(line) && line.length >= 5 && line.length <= 60) {
      const cleanName = line.replace(/^[\d.]+\s*/, "").replace(/:$/, "").trim();
      if (cleanName && !topics.some(t => t.name.toLowerCase() === cleanName.toLowerCase())) {
        topics.push({
          id: `topic-${topics.length + 1}`,
          name: cleanName,
          description: `Extracted from document section: ${cleanName}`,
          estimatedQuestions: Math.max(5, Math.min(15, Math.floor(Math.random() * 8) + 8)),
        });
      }
    }
    if (topics.length >= 6) break;
  }

  // If no explicit headings found, extract frequent multi-word capitalized domain concepts
  if (topics.length < 2) {
    const capitalizedPhrases = fullText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
    const counts = new Map<string, number>();
    for (const phrase of capitalizedPhrases) {
      if (phrase.length > 5 && phrase.length < 35 && !phrase.startsWith("Page") && !phrase.includes("Intellix")) {
        counts.set(phrase, (counts.get(phrase) || 0) + 1);
      }
    }
    const topPhrases = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([p]) => p);

    for (const phrase of topPhrases) {
      if (!topics.some(t => t.name.toLowerCase() === phrase.toLowerCase())) {
        topics.push({
          id: `topic-${topics.length + 1}`,
          name: phrase,
          description: `Key principles, mechanisms, and rules regarding ${phrase}.`,
          estimatedQuestions: 10,
        });
      }
    }
  }

  if (topics.length === 0) {
    topics.push({
      id: "topic-1",
      name: fallbackTitle,
      description: `Comprehensive study content and questions for ${fallbackTitle}.`,
      estimatedQuestions: 12,
    });
  }

  return topics;
}
