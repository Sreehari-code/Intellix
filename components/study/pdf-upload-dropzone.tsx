"use client";

import * as React from "react";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Plus, 
  FileCheck,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StudyDocument } from "@/types";

interface PdfUploadDropzoneProps {
  onDocumentUploaded: (newDoc: StudyDocument) => void;
  compact?: boolean;
}

export function PdfUploadDropzone({ onDocumentUploaded, compact = false }: PdfUploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadingState, setUploadingState] = React.useState<"idle" | "uploading" | "extracting" | "processing" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [currentFileName, setCurrentFileName] = React.useState<string | null>(null);
  const [currentFileSize, setCurrentFileSize] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);

    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setUploadingState("error");
      setErrorMessage("Please select a valid PDF document (.pdf).");
      return;
    }

    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadingState("error");
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 25 MB.`);
      return;
    }

    if (file.size === 0) {
      setUploadingState("error");
      setErrorMessage("The selected file is empty (0 bytes).");
      return;
    }

    setCurrentFileName(file.name);
    setCurrentFileSize(
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`
    );

    setUploadingState("uploading");
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const progressTimer = setTimeout(() => {
        setUploadingState("extracting");
        setUploadProgress(65);
      }, 400);

      const response = await fetch("/api/documents/parse", {
        method: "POST",
        body: formData,
      });

      clearTimeout(progressTimer);

      setUploadingState("processing");
      setUploadProgress(90);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to process PDF text.");
      }

      setUploadProgress(100);
      setUploadingState("success");
      onDocumentUploaded(result.document);

      setTimeout(() => {
        handleReset();
      }, 1200);
    } catch (err: any) {
      setUploadingState("error");
      setErrorMessage(err.message || "An error occurred while uploading and extracting the PDF.");
    }
  };

  const handleReset = () => {
    setUploadingState("idle");
    setUploadProgress(0);
    setCurrentFileName(null);
    setCurrentFileSize(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Clean Notion Dropzone */}
      {uploadingState === "idle" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${
            isDragging
              ? "border-zinc-900 bg-zinc-100/80 scale-[0.99]"
              : "border-zinc-300 bg-zinc-50/50 hover:bg-zinc-100/60 hover:border-zinc-400"
          } ${compact ? "p-4" : "p-6"}`}
        >
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-xs">
              <UploadCloud className="h-5 w-5 text-zinc-700" />
            </div>

            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-zinc-900">
                Click or drag PDF here to upload
              </p>
              <p className="text-xs text-zinc-500">
                PDF textbook, lecture slides, syllabus, or notes (up to 25MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Progress */}
      {(uploadingState === "uploading" || uploadingState === "extracting" || uploadingState === "processing") && (
        <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <Loader2 className="h-4 w-4 text-zinc-800 animate-spin" />
              <div>
                <p className="font-semibold text-zinc-900">{currentFileName}</p>
                <p className="text-zinc-500 text-[11px]">{currentFileSize}</p>
              </div>
            </div>
            <span className="font-mono font-medium text-zinc-700">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5 bg-zinc-100" />
          <p className="text-[11px] text-zinc-500">
            {uploadingState === "uploading" && "Uploading document to server..."}
            {uploadingState === "extracting" && "Parsing pages and extracting text..."}
            {uploadingState === "processing" && "Indexing educational concepts and chunking..."}
          </p>
        </div>
      )}

      {/* Success State */}
      {uploadingState === "success" && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">Uploaded & Indexed: {currentFileName}</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {uploadingState === "error" && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Upload Failed</p>
                <p className="text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button onClick={handleReset} className="text-rose-500 hover:text-rose-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={handleReset} className="h-7 text-xs border-rose-200 bg-white hover:bg-rose-50">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
