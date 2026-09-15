"use client";

import * as React from "react";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Flag, 
  Send, 
  X,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSecondsToTime } from "@/lib/utils";

interface SubmitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  bookmarkedCount: number;
  secondsRemaining: number;
  isSubmitting?: boolean;
}

export function SubmitConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
  unansweredCount,
  bookmarkedCount,
  secondsRemaining,
  isSubmitting = false,
}: SubmitConfirmationModalProps) {
  if (!isOpen) return null;

  const hasUnanswered = unansweredCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-card border-2 border-border/90 text-card-foreground rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${hasUnanswered ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"}`}>
              {hasUnanswered ? <AlertCircle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {hasUnanswered ? "Unanswered Questions" : "Submit Practice Test?"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {hasUnanswered ? "Review your progress before final evaluation" : "Confirm to finalize your test and compute your score"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Summary Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-muted-foreground font-medium">Answered</span>
            <p className="text-base font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{answeredCount} / {totalQuestions}</span>
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border space-y-1 ${
            hasUnanswered
              ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
              : "bg-muted/40 border-border/60 text-muted-foreground"
          }`}>
            <span className="font-medium">Unanswered</span>
            <p className="text-base font-bold text-foreground flex items-center gap-1.5">
              {hasUnanswered ? (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{unansweredCount}</span>
            </p>
          </div>

          {bookmarkedCount > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 col-span-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
                <Flag className="h-4 w-4 text-amber-500" />
                <span>{bookmarkedCount} question{bookmarkedCount > 1 ? "s" : ""} flagged for review</span>
              </div>
              <Badge variant="warning" className="text-[10px]">Flagged</Badge>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 col-span-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span>Time Remaining:</span>
            </span>
            <span className="font-mono font-bold text-foreground">
              {formatSecondsToTime(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* Warning if unanswered */}
        {hasUnanswered && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
            ⚠️ You have <strong>{unansweredCount}</strong> unanswered question{unansweredCount > 1 ? "s" : ""}. Unanswered questions will be scored as incorrect.
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-semibold"
          >
            Keep Reviewing
          </Button>

          <Button
            type="button"
            variant="glow"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-xl gap-2 text-xs font-semibold shadow-md"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isSubmitting ? "Evaluating..." : "Confirm & Submit"}</span>
          </Button>
        </div>

      </div>
    </div>
  );
}
