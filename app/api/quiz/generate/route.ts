import { NextRequest, NextResponse } from "next/server";
import { generateGroundedQuestions } from "@/lib/ai/question-generator";
import { getDocumentById } from "@/lib/storage/document-store";
import { DifficultyLevel } from "@/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      documentId, 
      documentIds,
      topic,
      topics, 
      difficulty = "intermediate", 
      questionCount = 5,
      questionTypes = ["mcq"],
      mode = "online" 
    } = body;

    // Collect all document IDs
    const targetDocIds: string[] = [];
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      targetDocIds.push(...documentIds);
    } else if (documentId) {
      targetDocIds.push(documentId);
    }

    if (targetDocIds.length === 0) {
      return NextResponse.json(
        { error: "At least one valid document ID is required to generate questions." },
        { status: 400 }
      );
    }

    // Retrieve documents
    const resolvedDocs = targetDocIds
      .map((id) => getDocumentById(id))
      .filter((d): d is NonNullable<typeof d> => !!d);

    if (resolvedDocs.length === 0) {
      return NextResponse.json(
        { error: "The selected study materials could not be found in storage." },
        { status: 404 }
      );
    }

    // Combine extracted text across all selected materials
    const combinedTexts: string[] = [];
    const combinedTitles: string[] = [];

    for (const doc of resolvedDocs) {
      const text = doc.extractedText || doc.summary;
      if (text && text.trim().length > 10) {
        combinedTexts.push(`--- STUDY MATERIAL: ${doc.title} (${doc.fileName}) ---\n${text}`);
        combinedTitles.push(doc.title);
      }
    }

    const textToUse = combinedTexts.join("\n\n");
    if (!textToUse || textToUse.length < 20) {
      return NextResponse.json(
        { error: "The selected documents have insufficient text content for question generation." },
        { status: 400 }
      );
    }

    const effectiveTitle = combinedTitles.join(" & ");

    const effectiveTopics: string[] = topics && Array.isArray(topics) && topics.length > 0
      ? topics
      : topic
      ? [topic]
      : resolvedDocs.flatMap(d => (d.topics ? d.topics.map(t => t.name) : [d.title]));

    const validCount = Math.min(30, Math.max(1, parseInt(questionCount, 10) || 5));
    const validDifficulty = (["easy", "intermediate", "advanced"].includes(difficulty?.toLowerCase())
      ? difficulty.toLowerCase()
      : "intermediate") as DifficultyLevel;

    // Generate questions strictly grounded in the document text
    const questions = await generateGroundedQuestions({
      documentId: targetDocIds[0],
      documentText: textToUse,
      documentTitle: effectiveTitle,
      topics: effectiveTopics,
      topic: effectiveTopics[0],
      difficulty: validDifficulty,
      questionCount: validCount,
      questionTypes: questionTypes && Array.isArray(questionTypes) && questionTypes.length > 0 ? questionTypes : ["mcq"],
      mode: mode === "offline" ? "offline" : "online",
    });

    const quizId = `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    return NextResponse.json({
      success: true,
      quizId,
      documentId: targetDocIds[0],
      documentIds: targetDocIds,
      documentTitle: effectiveTitle,
      topics: effectiveTopics,
      topic: effectiveTopics.join(", "),
      difficulty: validDifficulty,
      questionCount: questions.length,
      questionTypes,
      questions,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate questions." },
      { status: 500 }
    );
  }
}
