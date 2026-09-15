"use client";

import * as React from "react";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  X, 
  Plus, 
  FileCheck,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StudyDocument } from "@/types";
import Link from "next/link";

interface PdfUploadDropzoneProps {
  onDocumentUploaded: (newDoc: StudyDocument) => void;
}

export function PdfUploadDropzone({ onDocumentUploaded }: PdfUploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadingState, setUploadingState] = React.useState<"idle" | "uploading" | "extracting" | "processing" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [currentFileName, setCurrentFileName] = React.useState<string | null>(null);
  const [currentFileSize, setCurrentFileSize] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = React.useState<StudyDocument | null>(null);

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
    // Reset state
    setErrorMessage(null);
    setUploadedDoc(null);

    // Validation 1: Check if file is PDF
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setUploadingState("error");
      setErrorMessage("Please upload a valid PDF file. Other file formats are not supported.");
      return;
    }

    // Validation 2: Check max size (25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadingState("error");
      setErrorMessage(`The file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 25 MB.`);
      return;
    }

    // Validation 3: Check empty file
    if (file.size === 0) {
      setUploadingState("error");
      setErrorMessage("The selected file is empty (0 bytes). Please select a valid document.");
      return;
    }

    setCurrentFileName(file.name);
    setCurrentFileSize(
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`
    );

    // Stage 1: Uploading
    setUploadingState("uploading");
    setUploadProgress(25);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulating realistic stage transitions for smooth UX feedback
      const progressTimer = setTimeout(() => {
        setUploadingState("extracting");
        setUploadProgress(60);
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
      setUploadedDoc(result.document);
      onDocumentUploaded(result.document);
    } catch (err: any) {
      setUploadingState("error");
      setErrorMessage(err.message || "An error occurred while uploading and parsing the PDF.");
    }
  };

  const handleReset = () => {
    setUploadingState("idle");
    setUploadProgress(0);
    setCurrentFileName(null);
    setCurrentFileSize(null);
    setErrorMessage(null);
    setUploadedDoc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Dropzone Card */}
      {uploadingState === "idle" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-3xl border-2 border-dashed p-8 md:p-10 text-center cursor-pointer transition-all duration-200 group ${
            isDragging
              ? "border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.01]"
              : "border-indigo-400/40 bg-indigo-50/20 dark:bg-indigo-950/10 hover:border-primary/80 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
          }`}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
              <UploadCloud className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-lg text-foreground">
                Drop your PDF study material here
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Drag and drop your syllabus, textbook chapter, lecture slides, or exam notes.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                size="sm"
                variant="glow"
                className="rounded-xl gap-1.5 text-xs font-semibold shadow-md pointer-events-none"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Browse Local Files</span>
              </Button>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                PDF up to 25MB
              </span>
              <span>•</span>
              <span>Text is strictly grounded</span>
            </div>
          </div>
        </div>
      )}

      {/* Uploading / Extracting / Processing State Card */}
      {(uploadingState === "uploading" || uploadingState === "extracting" || uploadingState === "processing") && (
        <Card className="p-8 space-y-6 border-primary/40 bg-gradient-to-br from-indigo-50/30 via-background to-transparent dark:from-indigo-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary animate-spin">
                <Loader2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{currentFileName}</h4>
                <p className="text-xs text-muted-foreground">{currentFileSize}</p>
              </div>
            </div>

            <Badge variant="purple" className="text-xs">
              {uploadingState === "uploading" && "Uploading..."}
              {uploadingState === "extracting" && "Extracting text..."}
              {uploadingState === "processing" && "Processing material..."}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>
                {uploadingState === "uploading" && "Sending document to server..."}
                {uploadingState === "extracting" && "Parsing pages, removing whitespace & counting words..."}
                {uploadingState === "processing" && "Generating structured summary & detecting subtopics..."}
              </span>
              <span className="font-bold text-primary">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2.5" />
          </div>
        </Card>
      )}

      {/* Success State Card */}
      {uploadingState === "success" && uploadedDoc && (
        <Card className="p-6 border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <FileCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-foreground">{uploadedDoc.title}</h4>
                  <Badge variant="success" className="text-[10px]">
                    Extracted Successfully
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{uploadedDoc.pageCount} Pages</span>
                  <span>•</span>
                  <span>{uploadedDoc.wordCount.toLocaleString()} Words</span>
                  <span>•</span>
                  <span>{uploadedDoc.topics.length} Subtopics Indexed</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link href={`/generate?docId=${uploadedDoc.id}`}>
                <Button size="sm" variant="glow" className="rounded-xl gap-1.5 text-xs font-semibold shadow-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Questions</span>
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={handleReset} className="rounded-xl text-xs">
                Upload Another
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-background/80 p-3 rounded-xl border border-border/80 leading-relaxed">
            {uploadedDoc.summary}
          </p>
        </Card>
      )}

      {/* Error State Card */}
      {uploadingState === "error" && (
        <Card className="p-6 border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/20 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-sm text-foreground">Upload Error</h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={handleReset} className="text-xs rounded-xl">
              Try Again
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
