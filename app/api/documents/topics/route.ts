import { NextRequest, NextResponse } from "next/server";
import { extractEducationalTopics } from "@/lib/ai/topic-extractor";
import { getDocumentById, saveDocument } from "@/lib/storage/document-store";
import { TopicItem } from "@/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, documentText, documentTitle, mode = "online" } = body;

    let textToAnalyze = documentText;
    let title = documentTitle || "Study Material";
    let existingDoc = null;

    if (documentId) {
      existingDoc = getDocumentById(documentId);
      if (existingDoc) {
        textToAnalyze = existingDoc.extractedText || existingDoc.summary;
        title = existingDoc.title;
      }
    }

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return NextResponse.json(
        { error: "No document text available for topic extraction." },
        { status: 400 }
      );
    }

    // Extract structured topics with mode preference
    const extractedTopics = await extractEducationalTopics(textToAnalyze, title, mode === "offline" ? "offline" : "online");

    // If associated with a stored document, update its topics
    if (existingDoc) {
      existingDoc.topics = extractedTopics;
      saveDocument(existingDoc);
    }

    return NextResponse.json({
      success: true,
      documentId: documentId || null,
      topics: extractedTopics,
      message: `Extracted ${extractedTopics.length} structured topics.`,
    });
  } catch (error: any) {
    console.error("Topic extraction API error:", error);
    return NextResponse.json(
      {
        error: error.message || "An error occurred during topic extraction.",
        topics: [],
      },
      { status: 500 }
    );
  }
}

/**
 * Add or update custom topics for a document
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, newTopic } = body;

    if (!documentId || !newTopic || !newTopic.name) {
      return NextResponse.json(
        { error: "Document ID and valid topic name are required." },
        { status: 400 }
      );
    }

    const doc = getDocumentById(documentId);
    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const topicItem: TopicItem = {
      id: `topic-custom-${Date.now()}`,
      name: newTopic.name.trim(),
      description: newTopic.description?.trim() || `User-defined study topic for ${newTopic.name}.`,
      keywords: newTopic.keywords || [newTopic.name.trim()],
      keyTerms: newTopic.keywords || [newTopic.name.trim()],
      estimatedQuestions: 10,
      isCustom: true,
    };

    doc.topics = [...doc.topics, topicItem];
    saveDocument(doc);

    return NextResponse.json({
      success: true,
      topic: topicItem,
      topics: doc.topics,
      message: "Custom topic added successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add custom topic." },
      { status: 500 }
    );
  }
}
