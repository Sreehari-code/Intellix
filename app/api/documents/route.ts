import { NextRequest, NextResponse } from "next/server";
import { getAllDocuments, deleteDocument } from "@/lib/storage/document-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const documents = getAllDocuments();
    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing document ID." }, { status: 400 });
    }

    const deleted = deleteDocument(id);
    if (!deleted) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Document deleted successfully." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete document." },
      { status: 500 }
    );
  }
}
