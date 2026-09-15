import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf/parser";
import { extractEducationalTopics } from "@/lib/ai/topic-extractor";
import { saveDocument } from "@/lib/storage/document-store";
import { StudyDocument } from "@/types";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please upload a valid PDF study material." },
        { status: 400 }
      );
    }

    // Validation: PDF extension & MIME type
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF documents (.pdf) are supported." },
        { status: 400 }
      );
    }

    // Validation: File size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 25 MB.` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The uploaded file is empty (0 bytes). Please upload a valid document." },
        { status: 400 }
      );
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text and structural intelligence from PDF
    const parsed = await extractPdfText(arrayBuffer, file.name);

    // Deep topic extraction with keyword generation and validation
    const structuredTopics = await extractEducationalTopics(parsed.text, parsed.detectedTitle);

    // Format file size
    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    // Derive tags
    const generatedTags = structuredTopics.slice(0, 3).map(t => t.name.split(" ")[0]);
    if (!generatedTags.includes("PDF")) generatedTags.unshift("PDF");

    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newDocument: StudyDocument & { extractedText: string } = {
      id: documentId,
      title: parsed.detectedTitle,
      fileName: file.name,
      fileSizeFormatted: sizeFormatted,
      pageCount: parsed.pageCount,
      wordCount: parsed.wordCount,
      uploadedAt: new Date().toISOString(),
      summary: parsed.summary,
      topics: structuredTopics,
      tags: generatedTags,
      status: "ready",
      quizzesTaken: 0,
      averageScore: undefined,
      extractedText: parsed.text,
    };

    // Save in document store
    saveDocument(newDocument);

    return NextResponse.json({
      success: true,
      document: newDocument,
      message: `Successfully processed "${file.name}" (${parsed.pageCount} pages, ${parsed.wordCount.toLocaleString()} words).`,
    });
  } catch (error: any) {
    console.error("PDF Parsing error:", error);
    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred while parsing the PDF document.",
      },
      { status: 500 }
    );
  }
}
