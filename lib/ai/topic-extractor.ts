import { z } from "zod";
import { TopicItem } from "@/types";

export const TopicSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  keywords: z.array(z.string()).default([]),
});

export const TopicsResponseSchema = z.object({
  topics: z.array(TopicSchema).min(1),
});

/**
 * Extracts structured, material-specific educational topics from study material text.
 * Uses AI (Gemini / OpenAI) with intelligent content-grounded NLP fallback.
 */
export async function extractEducationalTopics(
  documentText: string,
  documentTitle: string = "Study Material",
  mode: "online" | "offline" = "online"
): Promise<TopicItem[]> {
  if (mode === "offline") {
    return extractHeuristicTopics(documentText, documentTitle);
  }

  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey && geminiKey.trim().length > 5) {
      const aiTopics = await extractWithGemini(documentText, documentTitle, geminiKey.trim());
      if (aiTopics && aiTopics.length > 0) {
        return deduplicateAndFormatTopics(aiTopics);
      }
    }

    if (openaiKey && openaiKey.trim().length > 5) {
      const aiTopics = await extractWithOpenAI(documentText, documentTitle, openaiKey.trim());
      if (aiTopics && aiTopics.length > 0) {
        return deduplicateAndFormatTopics(aiTopics);
      }
    }
  } catch (error) {
    console.warn("AI topic extraction encountered an error, falling back to heuristic extraction:", error);
  }

  // Fallback to intelligent NLP heuristic topic extraction directly from text
  return extractHeuristicTopics(documentText, documentTitle);
}

/**
 * LLM Call via Google Gemini REST API
 */
async function extractWithGemini(
  documentText: string,
  documentTitle: string,
  apiKey: string
): Promise<Array<{ name: string; description: string; keywords: string[] }> | null> {
  const truncatedText = documentText.slice(0, 18000);

  const prompt = `You are an expert curriculum analyzer and textbook editor.
Analyze the following educational study material titled "${documentTitle}".
Extract 3 to 8 distinct, specific subject-matter topics and core concepts covered directly in this text.

RULES:
1. Every topic name MUST be the exact domain concept from the text (e.g., "Memory Virtualization", "Binary Tree Traversals", "TCP 3-Way Handshake", "Mendelian Inheritance").
2. DO NOT output generic names like "Chapter 1", "Introduction", "General Overview", or "Principles and Architecture".
3. Provide a clear, educational description of what the text teaches about that concept.
4. List 3-5 specific technical terms, formulas, or methods mentioned in the text for that topic.

Return ONLY valid JSON matching this schema:
{
  "topics": [
    {
      "name": "Specific Concept Name",
      "description": "Accurate 1-2 sentence explanation of this concept based strictly on the text.",
      "keywords": ["term1", "term2", "term3"]
    }
  ]
}

Study Material Content:
${truncatedText}`;

  const candidateModels = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-1.5-flash",
  ];

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJsonText) continue;

      const parsedJson = JSON.parse(rawJsonText);
      const validated = TopicsResponseSchema.safeParse(parsedJson);

      if (validated.success && validated.data.topics.length > 0) {
        return validated.data.topics;
      }
    } catch (e) {
      // Try next candidate model
    }
  }

  return null;
}

/**
 * LLM Call via OpenAI REST API
 */
async function extractWithOpenAI(
  documentText: string,
  documentTitle: string,
  apiKey: string
): Promise<Array<{ name: string; description: string; keywords: string[] }> | null> {
  const truncatedText = documentText.slice(0, 18000);

  const prompt = `Analyze the following study material titled "${documentTitle}" and extract 3 to 8 specific educational topics covered in the text as JSON.
Every topic name must be an actual named domain concept from the text (e.g., "Static Typing vs Dynamic Typing", "Polymorphism & Method Overriding", "Dijkstra's Algorithm").

Study Material:
${truncatedText}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an academic curriculum analyzer. Extract distinct, specific subject-matter study topics as JSON with schema: {"topics": [{"name": string, "description": string, "keywords": string[]}]}`,
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const rawJsonText = data?.choices?.[0]?.message?.content;
  if (!rawJsonText) return null;

  const parsedJson = JSON.parse(rawJsonText);
  const validated = TopicsResponseSchema.safeParse(parsedJson);

  return validated.success ? validated.data.topics : null;
}

/**
 * Intelligent NLP heuristic extraction engine that extracts REAL domain concepts
 * directly from the document text when offline or as fallback.
 */
function extractHeuristicTopics(text: string, title: string): TopicItem[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rawTopics: Array<{ name: string; description: string; keywords: string[] }> = [];
  const seenTopicNames = new Set<string>();

  // 1. Scan for explicit headings, section titles, and numbered topic markers
  const sectionHeadingRegex = /^(?:(?:Section|Chapter|Unit|Module|Part|Topic)\s+\d*[:.\-]?\s*|\d+\.\d+\s*|\b[A-Z][A-Za-z0-9\s,&:\-]{3,65}$)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("[Page") || line.length < 4 || line.length > 70) continue;

    // Check if line looks like a title/heading (short, doesn't end with a period, starts with uppercase)
    const isHeading = sectionHeadingRegex.test(line) || (!line.endsWith(".") && line.length < 50 && /^[A-Z]/.test(line));

    if (isHeading) {
      const cleanName = line
        .replace(/^(?:(?:Section|Chapter|Unit|Module|Part|Topic)\s*\d*[:.\-]?\s*|\d+\.\d+[:.\-]?\s*)/i, "")
        .replace(/[:.\-]+$/, "")
        .trim();

      const normalized = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Ignore noise or single words like "Introduction", "Summary", "Table of Contents"
      if (
        cleanName.length >= 4 &&
        !seenTopicNames.has(normalized) &&
        !["tableofcontents", "contents", "references", "index", "summary", "conclusion"].includes(normalized)
      ) {
        seenTopicNames.add(normalized);

        // Extract context excerpt for description
        const nextParagraph = lines.slice(i + 1, i + 5).join(" ");
        const words = nextParagraph.split(/\s+/).filter((w) => w.length > 3);
        const keywords = Array.from(
          new Set(words.map((w) => w.replace(/[^a-zA-Z0-9-]/g, "")).filter((w) => w.length >= 4 && !/^[0-9]+$/.test(w)))
        ).slice(0, 4);

        const desc = nextParagraph.length > 30
          ? nextParagraph.slice(0, 160).replace(/\s+/g, " ") + "..."
          : `Core principles and concepts regarding ${cleanName}.`;

        rawTopics.push({
          name: cleanName,
          description: desc,
          keywords: keywords.length > 0 ? keywords : [cleanName.split(" ")[0]],
        });
      }
    }
    if (rawTopics.length >= 8) break;
  }

  // 2. Scan for definition statements: "X is defined as...", "X refers to...", "X is a mechanism..."
  if (rawTopics.length < 3) {
    const definitionRegex = /\b([A-Z][A-Za-z0-9\s]{2,30})\s+(?:is defined as|refers to|is a mechanism|is an algorithm|is a technique|is a structure|represents)\s+([^.]{20,150})/gi;
    let match;
    while ((match = definitionRegex.exec(text)) !== null && rawTopics.length < 8) {
      const conceptName = match[1].trim();
      const defSnippet = match[2].trim();
      const norm = conceptName.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (!seenTopicNames.has(norm) && conceptName.length >= 4 && conceptName.length <= 40) {
        seenTopicNames.add(norm);
        rawTopics.push({
          name: conceptName,
          description: `${conceptName} ${defSnippet}.`,
          keywords: [conceptName.split(" ")[0]],
        });
      }
    }
  }

  // 3. If still fewer than 2 topics, extract top capitalized multi-word domain keyphrases
  if (rawTopics.length < 2) {
    const capitalizedPhrases = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
    const phraseCounts = new Map<string, number>();

    for (const phrase of capitalizedPhrases) {
      if (phrase.length > 5 && phrase.length < 35 && !phrase.startsWith("Page") && !phrase.includes("Intellix")) {
        phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
      }
    }

    const sortedPhrases = Array.from(phraseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase]) => phrase);

    for (const phrase of sortedPhrases) {
      const norm = phrase.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!seenTopicNames.has(norm)) {
        seenTopicNames.add(norm);
        rawTopics.push({
          name: phrase,
          description: `Key concepts, operational rules, and mechanics of ${phrase} as covered in ${title}.`,
          keywords: phrase.split(" "),
        });
      }
    }
  }

  // 4. If all else fails, use the document title
  if (rawTopics.length === 0) {
    rawTopics.push({
      name: title,
      description: `Complete curriculum topics and practice concepts from ${title}.`,
      keywords: title.split(" "),
    });
  }

  return deduplicateAndFormatTopics(rawTopics);
}

/**
 * Deduplicate similar topics and format as TopicItem[]
 */
function deduplicateAndFormatTopics(
  topics: Array<{ name: string; description: string; keywords?: string[] }>
): TopicItem[] {
  const seenNames = new Set<string>();
  const results: TopicItem[] = [];

  for (const t of topics) {
    const normalized = t.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!seenNames.has(normalized)) {
      seenNames.add(normalized);
      results.push({
        id: `topic-${results.length + 1}-${Math.random().toString(36).substring(2, 6)}`,
        name: t.name.trim(),
        description: t.description.trim(),
        keywords: t.keywords || [],
        keyTerms: t.keywords || [],
        estimatedQuestions: Math.max(5, Math.min(15, Math.floor(Math.random() * 6) + 8)),
      });
    }
  }

  return results;
}
