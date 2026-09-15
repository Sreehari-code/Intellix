import { z } from "zod";
import { Question, DifficultyLevel, QuestionType, QuestionSource, QuestionOption } from "@/types";
import { DocumentChunk, chunkDocumentText, retrieveChunksForMultipleTopics } from "@/lib/pdf/chunker";

export const GeneratedQuestionOptionSchema = z.union([
  z.string(),
  z.object({
    id: z.string().optional().default("opt-a"),
    text: z.string().min(1),
  })
]);

export const GeneratedQuestionSourceSchema = z.object({
  document: z.string().optional().default("Study Material"),
  chunkId: z.string().optional(),
  page: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
  reference: z.string().optional(),
  excerpt: z.string().optional().default(""),
  sectionTitle: z.string().optional().nullable(),
});

export const GeneratedQuestionSchema = z.object({
  question: z.string().min(5),
  type: z.enum(["mcq", "coding", "essay", "short_answer", "true_false"]).optional().default("mcq"),
  difficulty: z.string().optional(),
  topic: z.string().optional(),
  options: z.array(GeneratedQuestionOptionSchema).optional(),
  correctAnswer: z.string().optional(),
  correctAnswerId: z.string().optional(),
  answer: z.string().optional(),
  explanation: z.string().optional().default("Supported by study material."),
  source: GeneratedQuestionSourceSchema.optional(),
  sourceReference: z.string().optional(),
  starterCode: z.string().optional(),
  sampleSolution: z.string().optional(),
  language: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  rubric: z.string().optional(),
});

export const GeneratedQuizResponseSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).min(1),
});

export interface GenerateQuizParams {
  documentId?: string;
  documentText: string;
  documentTitle: string;
  topic?: string;
  topics?: string[];
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes?: QuestionType[];
  mode?: "online" | "offline";
}

/**
 * High-Quality Exam-Oriented RAG Grounded Question Generator
 */
export async function generateGroundedQuestions({
  documentId = "doc-default",
  documentText,
  documentTitle,
  topic,
  topics,
  difficulty,
  questionCount,
  questionTypes = ["mcq"],
  mode = "online",
}: GenerateQuizParams): Promise<Question[]> {
  // Resolve list of topics
  const effectiveTopics: string[] = topics && topics.length > 0 
    ? topics 
    : topic 
    ? [topic] 
    : [documentTitle];

  // 1. Lightweight RAG: Chunk document text
  const allChunks = chunkDocumentText(documentId, documentTitle, documentText);

  // 2. Retrieve top relevant chunks pooled across all selected topics
  const relevantChunks = retrieveChunksForMultipleTopics(allChunks, effectiveTopics, 6);

  // If explicit offline mode requested, run local exam-oriented deterministic generator
  if (mode === "offline") {
    return generateExamQualityDeterministicQuestions({
      relevantChunks,
      documentTitle,
      topics: effectiveTopics,
      difficulty,
      questionCount,
      questionTypes,
    });
  }

  // Combine retrieved chunks as the focused context
  const focusedContextText = relevantChunks
    .map((c, idx) => `[EXCERPT ${idx + 1} | ChunkID: ${c.id}${c.pageNumber ? ` | Page ${c.pageNumber}` : ""}${c.sectionTitle ? ` | ${c.sectionTitle}` : ""}]\n${c.text}`)
    .join("\n\n---\n\n");

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  try {
    if (geminiKey && geminiKey.trim().length > 5) {
      const questions = await generateWithGemini({
        focusedContextText,
        relevantChunks,
        documentTitle,
        topics: effectiveTopics,
        difficulty,
        questionCount,
        questionTypes,
        apiKey: geminiKey,
      });
      if (questions && questions.length > 0) {
        return validateAndDeduplicateQuestions(questions, relevantChunks, questionCount);
      }
    } else if (openaiKey && openaiKey.trim().length > 5) {
      const questions = await generateWithOpenAI({
        focusedContextText,
        relevantChunks,
        documentTitle,
        topics: effectiveTopics,
        difficulty,
        questionCount,
        questionTypes,
        apiKey: openaiKey,
      });
      if (questions && questions.length > 0) {
        return validateAndDeduplicateQuestions(questions, relevantChunks, questionCount);
      }
    }
  } catch (error) {
    console.warn("Online AI generation encountered an issue, falling back to deterministic exam generator:", error);
  }

  // Fallback to deterministic exam quality questions
  return generateExamQualityDeterministicQuestions({
    relevantChunks,
    documentTitle,
    topics: effectiveTopics,
    difficulty,
    questionCount,
    questionTypes,
  });
}

/**
 * Builds the University Examiner Prompt
 */
function buildUniversityExaminerPrompt({
  documentTitle,
  topics,
  difficulty,
  questionCount,
  questionTypes,
  focusedContextText,
}: {
  documentTitle: string;
  topics: string[];
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes: QuestionType[];
  focusedContextText: string;
}): string {
  const typesDesc = questionTypes.map(t => {
    if (t === "mcq") return "Multiple Choice Questions (MCQ: exactly 4 choices with 1 correct answer)";
    if (t === "coding") return "Coding / Problem Solving (Coding exercise with starter code and reference solution)";
    if (t === "essay") return "Descriptive / General Essay (In-depth theoretical prompt with model answer & rubric)";
    return t;
  }).join(", ");

  let difficultyGuidelines = "";
  if (difficulty === "easy") {
    difficultyGuidelines = `DIFFICULTY: EASY
- Test basic definitions, direct facts, identification, and fundamental understanding.
- Questions should be clear, concise, and focused on core principles mentioned in the material.`;
  } else if (difficulty === "advanced") {
    difficultyGuidelines = `DIFFICULTY: HARD / ADVANCED
- Test multi-concept reasoning, scenario-based analysis, trade-offs, and edge cases.
- Analyze relationships and cause-and-effect strictly supported by the text.
- Must STILL be completely answerable using ONLY the provided excerpts.`;
  } else {
    difficultyGuidelines = `DIFFICULTY: MEDIUM / INTERMEDIATE
- Test comprehension, mechanism explanation (how/why something works), concept comparison, and practical applications described in the material.`;
  }

  return `You are a university professor and examiner creating an educational, exam-oriented practice assessment from a student's uploaded study material.

DOCUMENT: "${documentTitle}"
TOPICS: ${topics.map(t => `"${t}"`).join(", ")}
TOTAL QUESTIONS: Exactly ${questionCount}
QUESTION TYPES REQUESTED: ${typesDesc}

${difficultyGuidelines}

CRITICAL SOURCE GROUNDING RULES (ZERO HALLUCINATION):
1. Every question and answer MUST be based ONLY on the provided source excerpts.
2. DO NOT introduce outside facts, formulas, or examples not present in the text.
3. If information is insufficient for a concept, do not fabricate questions.
4. Avoid repetitive "What is X?" stems. Use diverse question styles (e.g., concept comparison, operational mechanisms, step-by-step processes, cause-and-effect, scenario problem solving).
5. For MCQ questions:
   - Provide exactly 4 options.
   - Exactly one option is correct.
   - Distractors must be plausible yet clearly incorrect according to the source material.
   - Do not make the correct option noticeably longer or more detailed than distractors.
   - Randomize correct answer placement.
6. For Coding questions:
   - Provide starterCode stub, sampleSolution, language, and concise answer summary.
7. For Essay questions:
   - Provide analytical question, comprehensive model answer, and array of 3 to 5 key evaluation points (rubric).
8. Source citation: Include chunkId, page number (if available), and verbatim excerpt in "source".

RETURN VALID JSON matching this structure:
{
  "questions": [
    {
      "question": "Question stem testing understanding...",
      "type": "mcq",
      "difficulty": "${difficulty}",
      "topic": "${topics[0] || "Core Concept"}",
      "options": [
        "Plausible Option A",
        "Plausible Option B",
        "Plausible Option C",
        "Plausible Option D"
      ],
      "correctAnswer": "Plausible Option B",
      "explanation": "Pedagogical explanation explaining why this answer is correct based on the study material.",
      "source": {
        "chunkId": "chunk-1",
        "page": 1,
        "reference": "Verbatim quotation or sentence from source"
      }
    }
  ]
}

SOURCE EXCERPTS:
${focusedContextText}`;
}

/**
 * Gemini Question Generation with University Examiner Prompt
 */
async function generateWithGemini({
  focusedContextText,
  relevantChunks,
  documentTitle,
  topics,
  difficulty,
  questionCount,
  questionTypes,
  apiKey,
}: {
  focusedContextText: string;
  relevantChunks: DocumentChunk[];
  documentTitle: string;
  topics: string[];
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes: QuestionType[];
  apiKey: string;
}): Promise<Question[] | null> {
  const prompt = buildUniversityExaminerPrompt({
    documentTitle,
    topics,
    difficulty,
    questionCount,
    questionTypes,
    focusedContextText,
  });

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
              temperature: 0.25,
            },
          }),
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJsonText) continue;

      const parsedJson = JSON.parse(rawJsonText);
      const rawArray = Array.isArray(parsedJson)
        ? parsedJson
        : Array.isArray(parsedJson?.questions)
        ? parsedJson.questions
        : Array.isArray(parsedJson?.quiz)
        ? parsedJson.quiz
        : [];

      if (rawArray.length > 0) {
        const validated = GeneratedQuizResponseSchema.safeParse({ questions: rawArray });
        if (validated.success && validated.data.questions.length > 0) {
          return formatValidatedQuestions(validated.data.questions, documentTitle, topics[0] || "General", difficulty, relevantChunks);
        }
      }
    } catch (e) {
      // Try next model candidate
    }
  }

  return null;
}

/**
 * OpenAI Question Generation with University Examiner Prompt
 */
async function generateWithOpenAI({
  focusedContextText,
  relevantChunks,
  documentTitle,
  topics,
  difficulty,
  questionCount,
  questionTypes,
  apiKey,
}: {
  focusedContextText: string;
  relevantChunks: DocumentChunk[];
  documentTitle: string;
  topics: string[];
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes: QuestionType[];
  apiKey: string;
}): Promise<Question[] | null> {
  const prompt = buildUniversityExaminerPrompt({
    documentTitle,
    topics,
    difficulty,
    questionCount,
    questionTypes,
    focusedContextText,
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert university examiner creating high-quality, strictly grounded assessments." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.25,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawJsonText = data?.choices?.[0]?.message?.content;
  if (!rawJsonText) return null;

  const parsedJson = JSON.parse(rawJsonText);
  const rawArray = Array.isArray(parsedJson)
    ? parsedJson
    : Array.isArray(parsedJson?.questions)
    ? parsedJson.questions
    : [];

  if (rawArray.length > 0) {
    const validated = GeneratedQuizResponseSchema.safeParse({ questions: rawArray });
    if (validated.success && validated.data.questions.length > 0) {
      return formatValidatedQuestions(validated.data.questions, documentTitle, topics[0] || "General", difficulty, relevantChunks);
    }
  }

  return null;
}

/**
 * Normalizes validated questions to internal Question interface with source metadata
 */
function formatValidatedQuestions(
  rawQuestions: z.infer<typeof GeneratedQuestionSchema>[],
  documentTitle: string,
  defaultTopic: string,
  defaultDifficulty: DifficultyLevel,
  relevantChunks: DocumentChunk[]
): Question[] {
  return rawQuestions.map((q, idx) => {
    const normDifficulty = (q.difficulty ? (q.difficulty.toLowerCase() as DifficultyLevel) : defaultDifficulty) || defaultDifficulty;
    const fallbackChunk = relevantChunks[idx % relevantChunks.length];

    const rawPage = q.source?.page;
    let validPage: number | undefined = undefined;
    if (typeof rawPage === "number" && rawPage > 0) {
      validPage = rawPage;
    } else if (typeof rawPage === "string" && parseInt(rawPage, 10) > 0) {
      validPage = parseInt(rawPage, 10);
    } else if (fallbackChunk?.pageNumber && fallbackChunk.pageNumber > 0) {
      validPage = fallbackChunk.pageNumber;
    }

    const excerptQuote = q.source?.reference || q.source?.excerpt || q.sourceReference || fallbackChunk?.text?.slice(0, 180) || "Directly verified in study material.";

    const sourceObj: QuestionSource = {
      document: q.source?.document || documentTitle,
      chunkId: q.source?.chunkId || fallbackChunk?.id,
      page: validPage,
      excerpt: excerptQuote,
      sectionTitle: q.source?.sectionTitle || fallbackChunk?.sectionTitle,
    };

    const qType: QuestionType = (q.type as QuestionType) || (q.options && q.options.length > 0 ? "mcq" : q.starterCode ? "coding" : "essay");

    let formattedOptions: QuestionOption[] | undefined = undefined;
    let correctIds: string[] | undefined = undefined;
    let answerText = q.correctAnswer || q.answer || "";

    if (qType === "mcq") {
      let rawOpts: Array<{ id: string; text: string }> = [];

      if (q.options && Array.isArray(q.options) && q.options.length >= 2) {
        rawOpts = q.options.map((opt, oIdx) => {
          if (typeof opt === "string") {
            return { id: `opt-${String.fromCharCode(97 + oIdx)}`, text: opt.trim() };
          } else {
            return { id: opt.id || `opt-${String.fromCharCode(97 + oIdx)}`, text: opt.text.trim() };
          }
        });
      } else {
        rawOpts = [
          { id: "opt-a", text: answerText || "Verified statement per study material." },
          { id: "opt-b", text: "Alternative mechanism not supported by the document." },
          { id: "opt-c", text: "Invalid assumption contrary to source findings." },
          { id: "opt-d", text: "Behavior that bypasses document-defined rules." }
        ];
      }

      // Determine correct text
      let correctText = "";
      if (q.correctAnswer && rawOpts.some(o => o.text.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase())) {
        correctText = q.correctAnswer.trim();
      } else if (q.answer && rawOpts.some(o => o.text.trim().toLowerCase() === q.answer?.trim().toLowerCase())) {
        correctText = q.answer.trim();
      } else {
        correctText = rawOpts[0].text;
      }

      // Randomize option positions (Fisher-Yates shuffle)
      const shuffled = [...rawOpts];
      for (let sIdx = shuffled.length - 1; sIdx > 0; sIdx--) {
        const rIdx = Math.floor(Math.random() * (sIdx + 1));
        [shuffled[sIdx], shuffled[rIdx]] = [shuffled[rIdx], shuffled[sIdx]];
      }

      // Re-index with clean opt-a, opt-b, opt-c, opt-d IDs
      formattedOptions = shuffled.map((opt, oIdx) => ({
        id: `opt-${String.fromCharCode(97 + oIdx)}`,
        text: opt.text,
      }));

      const finalCorrectOpt = formattedOptions.find(o => o.text.trim().toLowerCase() === correctText.toLowerCase()) || formattedOptions[0];
      correctIds = [finalCorrectOpt.id];
      answerText = finalCorrectOpt.text;
    }

    return {
      id: `gen-q-${idx + 1}-${Date.now()}`,
      type: qType,
      question: q.question,
      answer: answerText || "Verified in study material.",
      options: formattedOptions,
      correctAnswerIds: correctIds,
      starterCode: q.starterCode,
      sampleSolution: q.sampleSolution,
      language: q.language || "python",
      keyPoints: q.keyPoints,
      rubric: q.rubric,
      difficulty: normDifficulty,
      topic: q.topic || defaultTopic,
      explanation: q.explanation || `Supported by ${documentTitle}: "${excerptQuote}"`,
      source: sourceObj,
      sourceQuote: excerptQuote,
      conceptTested: q.topic || defaultTopic,
      pageReference: sourceObj.page,
    };
  });
}

/**
 * Validates, filters, and deduplicates questions before returning
 */
function validateAndDeduplicateQuestions(
  questions: Question[],
  relevantChunks: DocumentChunk[],
  targetCount: number
): Question[] {
  const seenStems = new Set<string>();
  const validated: Question[] = [];

  for (const q of questions) {
    const cleanStem = q.question.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    if (seenStems.has(cleanStem)) continue;
    seenStems.add(cleanStem);

    // Ensure MCQ has options and answers
    if (q.type === "mcq" && (!q.options || q.options.length < 2)) {
      continue;
    }

    validated.push(q);
    if (validated.length >= targetCount) break;
  }

  return validated.length > 0 ? validated : questions.slice(0, targetCount);
}

/**
 * Deterministic generator supporting university exam questions for Easy, Medium, and Hard
 */
function generateExamQualityDeterministicQuestions({
  relevantChunks,
  documentTitle,
  topics,
  difficulty,
  questionCount,
  questionTypes = ["mcq"],
}: {
  relevantChunks: DocumentChunk[];
  documentTitle: string;
  topics: string[];
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes?: QuestionType[];
}): Question[] {
  const candidateFacts: Array<{ sentence: string; cleanConcept: string; chunk: DocumentChunk }> = [];

  for (const chunk of relevantChunks) {
    const cleanText = chunk.text
      .replace(/\[Page\s+\d+\]/gi, "")
      .replace(/^(?:Section|Chapter|Unit|Module|Part)\s+\d+[:.]?\s*/gim, "")
      .replace(/^[A-Z\s]{4,40}:/gm, "");

    const sentences = cleanText.match(/[^.!?\n]+[.!?]/g) || [];

    for (const raw of sentences) {
      let s = raw.trim().replace(/\s+/g, " ");
      s = s.replace(/^(?:[A-Za-z\s]{3,30}\s+(?:Section|Chapter|Part)\s+\d+[:.]?\s*)/i, "");
      
      if (s.length >= 30 && s.length <= 220 && !/^(see|figure|table|page)\b/i.test(s)) {
        const words = s.split(" ").filter(w => w.length > 2);
        const significantWords = words.filter(w => !/^(which|where|because|during|through|between|according|therefore|however|these|those|their|there|after|before|first|second|both|either|neither|left|right|every|each|some|when|what|while|degrades|produces|operates|requires|contains)$/i.test(w));
        
        let cleanConcept = significantWords.slice(0, 3).join(" ").replace(/[^a-zA-Z0-9\s]/g, "").trim();
        if (!cleanConcept || cleanConcept.length < 3 || /^(and|or|the|is|in|of|to|for|with)$/i.test(cleanConcept)) {
          cleanConcept = chunk.sectionTitle?.replace(/^(Section|Chapter)\s+\d+[:.]?\s*/i, "").trim() || topics[0] || "Core Concept";
        }

        candidateFacts.push({ sentence: s, cleanConcept, chunk });
      }
    }
  }

  if (candidateFacts.length === 0) {
    for (const chunk of relevantChunks) {
      candidateFacts.push({ 
        sentence: chunk.text.slice(0, 150), 
        cleanConcept: topics[0] || "Core Concept", 
        chunk 
      });
    }
  }

  const targetCount = Math.min(questionCount, Math.max(3, candidateFacts.length));
  const questions: Question[] = [];

  for (let i = 0; i < targetCount; i++) {
    const fact = candidateFacts[i % candidateFacts.length];
    const currentTopic = topics[i % topics.length] || fact.cleanConcept;
    const requestedType = questionTypes[i % questionTypes.length] || "mcq";

    const sourceObj: QuestionSource = {
      document: documentTitle,
      chunkId: fact.chunk.id,
      page: fact.chunk.pageNumber,
      excerpt: fact.sentence,
      sectionTitle: fact.chunk.sectionTitle,
    };

    if (requestedType === "coding") {
      const isJavaOrC = /class|public|static|void|int|new\s+/i.test(fact.sentence);
      const lang = isJavaOrC ? "java" : "python";
      
      const starterCode = lang === "java"
        ? `public class Solution {\n    // Implement logic conforming to: ${fact.cleanConcept}\n    public static void executeMechanism() {\n        // TODO: Implement solution strictly following document rules\n    }\n}`
        : `def solve_${fact.cleanConcept.toLowerCase().replace(/[^a-z0-9]/g, "_")}() -> None:\n    """Implement logic conforming to: ${fact.cleanConcept}"""\n    # TODO: Write solution strictly following document rules\n    pass`;

      const sampleSolution = lang === "java"
        ? `public class Solution {\n    public static void executeMechanism() {\n        // Rule: ${fact.sentence}\n        System.out.println("Grounded implementation for: ${fact.cleanConcept}");\n    }\n}`
        : `def solve_${fact.cleanConcept.toLowerCase().replace(/[^a-z0-9]/g, "_")}() -> None:\n    # Rule: ${fact.sentence}\n    print("Grounded implementation for: ${fact.cleanConcept}")`;

      questions.push({
        id: `gen-q-${i + 1}-${Date.now()}`,
        type: "coding",
        question: `Implement a function or code structure that enforces the operational rules of ${fact.cleanConcept} in ${currentTopic}.`,
        answer: `Implement a valid solution conforming to: "${fact.sentence}".`,
        starterCode,
        sampleSolution,
        language: lang,
        difficulty,
        topic: currentTopic,
        explanation: `Directly supported by ${documentTitle}${fact.chunk.pageNumber ? ` (Page ${fact.chunk.pageNumber})` : ""}: "${fact.sentence}"`,
        source: sourceObj,
        sourceQuote: fact.sentence,
        conceptTested: `${currentTopic} (${fact.cleanConcept})`,
        pageReference: fact.chunk.pageNumber,
      });
    } else if (requestedType === "essay") {
      questions.push({
        id: `gen-q-${i + 1}-${Date.now()}`,
        type: "essay",
        question: `Analyze the role and operational behavior of ${fact.cleanConcept} in ${currentTopic}. Explain its underlying principles and how it functions.`,
        answer: `Comprehensive Model Answer: In ${currentTopic}, ${fact.cleanConcept} operates under the documented principle that: "${fact.sentence}".`,
        keyPoints: [
          `Clear definition and purpose of ${fact.cleanConcept}`,
          `Explanation of underlying rule: "${fact.sentence.slice(0, 70)}..."`,
          `Edge case considerations and validation steps described in ${documentTitle}`,
        ],
        rubric: `Award full marks for clearly addressing the definition, operational mechanism, and constraints outlined in ${documentTitle}.`,
        difficulty,
        topic: currentTopic,
        explanation: `Directly grounded in ${documentTitle}: "${fact.sentence}"`,
        source: sourceObj,
        sourceQuote: fact.sentence,
        conceptTested: `${currentTopic} (${fact.cleanConcept})`,
        pageReference: fact.chunk.pageNumber,
      });
    } else {
      // MCQ Formats based on difficulty
      let questionStem = "";
      if (difficulty === "easy") {
        questionStem = `In ${currentTopic}, which statement accurately identifies the definition or principle of ${fact.cleanConcept}?`;
      } else if (difficulty === "advanced") {
        questionStem = `When evaluating operational constraints in ${currentTopic}, how does ${fact.cleanConcept} govern system behavior?`;
      } else {
        questionStem = `In the context of ${currentTopic}, which of the following accurately describes the mechanism of ${fact.cleanConcept}?`;
      }

      const correctOptionText = fact.sentence;
      const distractor1 = `It contradicts the primary architectural constraints established for ${currentTopic}.`;
      const distractor2 = `It is only applicable when standard verification mechanisms are bypassed at runtime.`;
      const distractor3 = `It describes an alternative convention not supported by ${documentTitle}.`;

      const options = [
        { id: "opt-a", text: correctOptionText },
        { id: "opt-b", text: distractor1 },
        { id: "opt-c", text: distractor2 },
        { id: "opt-d", text: distractor3 },
      ];

      // Shuffle options and assign clean letter IDs
      const shuffled = [...options].sort(() => Math.random() - 0.5);
      const reindexedOptions = shuffled.map((o, oIdx) => ({
        id: `opt-${String.fromCharCode(97 + oIdx)}`,
        text: o.text,
      }));

      const correctOpt = reindexedOptions.find(o => o.text === correctOptionText) || reindexedOptions[0];

      questions.push({
        id: `gen-q-${i + 1}-${Date.now()}`,
        type: "mcq",
        question: questionStem,
        answer: correctOptionText,
        options: reindexedOptions,
        correctAnswerIds: [correctOpt.id],
        difficulty,
        topic: currentTopic,
        explanation: `Verified directly in ${documentTitle}${fact.chunk.pageNumber ? ` (Page ${fact.chunk.pageNumber})` : ""}: "${fact.sentence}"`,
        source: sourceObj,
        sourceQuote: fact.sentence,
        conceptTested: `${currentTopic} (${fact.cleanConcept})`,
        pageReference: fact.chunk.pageNumber,
      });
    }
  }

  return questions;
}
