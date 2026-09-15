import { StudyDocument } from "@/types";

// In-memory server-side document store
declare global {
  // eslint-disable-next-line no-var
  var __INTELLIX_DOCUMENTS__: Map<string, StudyDocument & { extractedText?: string }> | undefined;
}

if (!globalThis.__INTELLIX_DOCUMENTS__) {
  globalThis.__INTELLIX_DOCUMENTS__ = new Map();
}

const documentStore = globalThis.__INTELLIX_DOCUMENTS__;

export function getAllDocuments(): (StudyDocument & { extractedText?: string })[] {
  return Array.from(documentStore.values());
}

export function getDocumentById(id: string): (StudyDocument & { extractedText?: string }) | undefined {
  return documentStore.get(id);
}

export function saveDocument(doc: StudyDocument & { extractedText?: string }): void {
  documentStore.set(doc.id, doc);
}

export function deleteDocument(id: string): boolean {
  return documentStore.delete(id);
}
