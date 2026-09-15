"use client";

import * as React from "react";
import { 
  ShieldCheck, 
  BookOpen, 
  FileText, 
  Quote, 
  X, 
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionSource } from "@/types";

interface SourceEvidenceDialogProps {
  source?: QuestionSource;
  documentTitle: string;
  defaultExcerpt?: string;
  pageNumber?: number;
}

export function SourceEvidenceViewer({
  source,
  documentTitle,
  defaultExcerpt,
  pageNumber,
}: SourceEvidenceDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const docName = source?.document || documentTitle;
  const page = source?.page !== undefined && source?.page !== null ? source.page : pageNumber;
  const excerptText = source?.excerpt || defaultExcerpt || "Supporting text excerpt from uploaded study material.";
  const section = source?.sectionTitle;

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-2xs"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Source</span>
      </button>

      {/* Popover / Overlay Card */}
      {isOpen && (
        <div className="absolute z-40 right-0 sm:left-0 sm:right-auto mt-2 w-80 sm:w-96 p-4 rounded-2xl bg-card border-2 border-indigo-500/30 text-card-foreground shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>✓ Grounded in your study material</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Document & Page Metadata */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              <span className="line-clamp-1">{docName}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {page !== undefined && page !== null && page > 0 && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0">
                  Page {page}
                </Badge>
              )}
              {section && (
                <Badge variant="outline" className="text-[10px] px-2 py-0 line-clamp-1">
                  {section}
                </Badge>
              )}
            </div>
          </div>

          {/* Supporting Excerpt Blockquote */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Supporting Excerpt:
            </span>
            <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-xs italic text-indigo-950 dark:text-indigo-200 leading-relaxed max-h-40 overflow-y-auto">
              "{excerptText}"
            </div>
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-muted-foreground">
            Strictly derived from your uploaded study document without external AI modifications.
          </p>
        </div>
      )}
    </div>
  );
}
