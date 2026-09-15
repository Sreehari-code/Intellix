"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  HelpCircle,
  Sparkles,
  Send,
  Zap,
  ArrowRight,
  RotateCcw,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SubmitConfirmationModal } from "@/components/quiz/submit-confirmation-modal";
import { evaluateTestSubmission } from "@/lib/quiz/evaluator";
import { formatSecondsToTime, getDifficultyColor } from "@/lib/utils";
import { Question, DifficultyLevel } from "@/types";

interface ActiveQuizSession {
  quizId?: string;
  documentId?: string;
  documentTitle?: string;
  topic?: string;
  difficulty?: DifficultyLevel;
  questions: Question[];
}

function PracticeTestRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRemediation = searchParams.get("mode") === "remediation";

  // Active quiz session state
  const [session, setSession] = React.useState<ActiveQuizSession>({
    quizId: "quiz-custom",
    documentId: "doc-1",
    documentTitle: "Study Material",
    topic: "Generated Topics",
    difficulty: "intermediate",
    questions: [],
  });

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, string[]>>({});
  const [bookmarkedIds, setBookmarkedIds] = React.useState<string[]>([]);
  const [secondsRemaining, setSecondsRemaining] = React.useState(600); // 10 minutes default
  const [totalTimeSpent, setTotalTimeSpent] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [isClientReady, setIsClientReady] = React.useState(false);

  const storageKey = React.useMemo(() => {
    return `intellix_active_test_${session.documentId || "default"}_${session.topic || "general"}`;
  }, [session.documentId, session.topic]);

  // 1. Load active quiz from sessionStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedQuiz = sessionStorage.getItem("intellix_active_quiz");
      if (storedQuiz) {
        const parsed = JSON.parse(storedQuiz);
        if (parsed.questions && parsed.questions.length > 0) {
          setSession({
            quizId: parsed.quizId || `quiz-${Date.now()}`,
            documentId: parsed.documentId || "doc-1",
            documentTitle: parsed.documentTitle || "Study Material",
            topic: parsed.topic || "Core Concepts",
            difficulty: parsed.difficulty || "intermediate",
            questions: parsed.questions,
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load active quiz from session:", e);
    }

    setIsClientReady(true);
  }, []);

  // 2. Restore saved progress from localStorage (anti-destroy on refresh)
  React.useEffect(() => {
    if (!isClientReady || typeof window === "undefined") return;

    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.selectedAnswers) setSelectedAnswers(parsed.selectedAnswers);
        if (parsed.bookmarkedIds) setBookmarkedIds(parsed.bookmarkedIds);
        if (typeof parsed.currentIndex === "number" && parsed.currentIndex < session.questions.length) {
          setCurrentIndex(parsed.currentIndex);
        }
        if (typeof parsed.secondsRemaining === "number" && parsed.secondsRemaining > 0) {
          setSecondsRemaining(parsed.secondsRemaining);
        }
        if (typeof parsed.totalTimeSpent === "number") {
          setTotalTimeSpent(parsed.totalTimeSpent);
        }
      }
    } catch (e) {
      console.warn("Failed to restore saved test progress:", e);
    }
  }, [isClientReady, storageKey, session.questions.length]);

  // 3. Persist progress on state changes
  React.useEffect(() => {
    if (!isClientReady || typeof window === "undefined") return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          selectedAnswers,
          bookmarkedIds,
          currentIndex,
          secondsRemaining,
          totalTimeSpent,
          savedAt: Date.now(),
        })
      );
    } catch (e) {
      console.warn("Failed to save progress to localStorage:", e);
    }
  }, [selectedAnswers, bookmarkedIds, currentIndex, secondsRemaining, totalTimeSpent, storageKey, isClientReady]);

  // 4. Timer countdown
  React.useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
      setTotalTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const questions = session.questions;
  const currentQuestion = questions[currentIndex] || questions[0];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).filter((qId) => selectedAnswers[qId]?.length > 0).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Option selection handler
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: [optionId],
    }));
  };

  // Flag toggle handler
  const toggleBookmark = (questionId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Keyboard navigation & option selection
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when modal is open or typing in inputs
      if (showConfirmModal || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }

      // Option selection by key (1-4 or A-D)
      if (currentQuestion && currentQuestion.options) {
        let optIdx = -1;
        if (["1", "2", "3", "4"].includes(e.key)) {
          optIdx = parseInt(e.key, 10) - 1;
        } else if (["a", "b", "c", "d", "A", "B", "C", "D"].includes(e.key)) {
          optIdx = e.key.toLowerCase().charCodeAt(0) - 97;
        }

        if (optIdx >= 0 && optIdx < currentQuestion.options.length) {
          const optId = currentQuestion.options[optIdx].id;
          handleSelectOption(optId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, totalQuestions, currentQuestion, showConfirmModal]);

  // Submission & evaluation execution
  const executeSubmission = () => {
    setIsSubmitting(true);

    try {
      // Calculate scoring and diagnostics report
      const resultReport = evaluateTestSubmission({
        quizId: session.quizId,
        documentId: session.documentId,
        documentTitle: session.documentTitle,
        topic: session.topic,
        difficulty: session.difficulty,
        questions: session.questions,
        selectedAnswers,
        timeSpentSeconds: totalTimeSpent || 600 - secondsRemaining,
      });

      // Save latest evaluation to sessionStorage for /results
      if (typeof window !== "undefined") {
        sessionStorage.setItem("intellix_latest_test_report", JSON.stringify(resultReport));
        // Clear active progress
        localStorage.removeItem(storageKey);
      }

      // Navigate to results
      setTimeout(() => {
        router.push("/results");
      }, 400);
    } catch (err) {
      console.error("Failed to submit test:", err);
      setIsSubmitting(false);
    }
  };

  // Reset test progress
  const handleResetTest = () => {
    if (confirm("Are you sure you want to reset your test progress and start over?")) {
      setSelectedAnswers({});
      setBookmarkedIds([]);
      setCurrentIndex(0);
      setSecondsRemaining(600);
      setTotalTimeSpent(0);
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
    }
  };

  if (isClientReady && totalQuestions === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="glass-card-premium p-8 rounded-3xl space-y-4">
          <BookOpen className="h-10 w-10 text-primary mx-auto" />
          <h3 className="font-bold text-lg text-foreground">No Active Assessment Found</h3>
          <p className="text-xs text-muted-foreground">
            Please generate questions from your uploaded study materials to start an interactive practice test.
          </p>
          <Link href="/">
            <Button variant="glow" className="w-full rounded-2xl gap-2 text-xs font-bold mt-2">
              <Sparkles className="h-4 w-4" />
              <span>Generate Questions</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const diffColors = getDifficultyColor(currentQuestion?.difficulty || "intermediate");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Test Navigation & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-card border border-border shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-foreground line-clamp-1">
                {isRemediation ? "Targeted Remediation Practice" : session.documentTitle}
              </h2>
              {isRemediation && (
                <Badge variant="purple" className="text-[10px]">
                  Concept Focus
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Question <strong className="text-foreground">{currentIndex + 1}</strong> of <strong className="text-foreground">{totalQuestions}</strong> • {answeredCount} answered
            </p>
          </div>
        </div>

        {/* Right Timer, Reset & Submit Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-foreground text-xs font-mono font-bold">
            <Clock className={`h-4 w-4 ${secondsRemaining < 60 ? "text-rose-500 animate-pulse" : "text-indigo-500"}`} />
            <span className={secondsRemaining < 60 ? "text-rose-600 dark:text-rose-400" : ""}>
              {formatSecondsToTime(secondsRemaining)}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleResetTest}
            title="Reset answers & restart"
            className="rounded-xl h-9 text-xs px-2.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="glow"
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="rounded-xl gap-1.5 text-xs font-semibold h-9 shadow-md"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Finish Test</span>
          </Button>
        </div>
      </div>

      {/* Animated Overall Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>Test Progress ({answeredCount}/{totalQuestions} Answered)</span>
          <span className="font-bold text-foreground">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Main Single Question Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-border/90 relative overflow-hidden shadow-sm">
        
        {/* Question Meta Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {currentQuestion.topic || session.topic}
            </Badge>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${diffColors.bg} ${diffColors.text} ${diffColors.border} uppercase`}
            >
              {currentQuestion.difficulty}
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleBookmark(currentQuestion.id)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl transition-colors ${
              bookmarkedIds.includes(currentQuestion.id)
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Flag className={`h-3.5 w-3.5 ${bookmarkedIds.includes(currentQuestion.id) ? "fill-current" : ""}`} />
            <span>{bookmarkedIds.includes(currentQuestion.id) ? "Flagged for Review" : "Flag for review"}</span>
          </button>
        </div>

        {/* Question Stem */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Question {(currentIndex + 1).toString().padStart(2, "0")}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-foreground leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Question Body: MCQ / Coding / Essay */}
        {currentQuestion.options && currentQuestion.options.length > 0 ? (
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQuestion.id]?.includes(option.id);
              const letter = String.fromCharCode(65 + idx); // A, B, C, D

              return (
                <div
                  key={option.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectOption(option.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectOption(option.id);
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm text-foreground ring-1 ring-primary/20"
                      : "border-border/70 hover:border-border hover:bg-muted/40 text-foreground/90"
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 pr-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {letter}
                    </div>
                    <span className="text-sm font-medium leading-relaxed">{option.text}</span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : currentQuestion.type === "coding" ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="font-bold text-primary uppercase">Language: {currentQuestion.language || "Python"}</span>
              <span>Solve directly or in your local IDE</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto border border-zinc-800">
              <pre><code>{currentQuestion.starterCode || "# Solution stub"}</code></pre>
            </div>
            <textarea
              className="w-full h-32 p-3 rounded-xl border border-border bg-card text-foreground font-mono text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Type your implementation here..."
              value={selectedAnswers[currentQuestion.id]?.[0] || ""}
              onChange={(e) => setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: [e.target.value] }))}
            />
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground italic">
              Write your analytical answer addressing the key mechanisms from the study material:
            </p>
            <textarea
              className="w-full h-36 p-3.5 rounded-xl border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Write your detailed essay / response here..."
              value={selectedAnswers[currentQuestion.id]?.[0] || ""}
              onChange={(e) => setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: [e.target.value] }))}
            />
          </div>
        )}

        {/* Bottom Material Reference Indicator */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Concept: <strong className="text-foreground">{currentQuestion.conceptTested || currentQuestion.topic}</strong>
          </span>

          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>✓ Grounded in study material</span>
          </div>
        </div>
      </Card>

      {/* Question Palette & Bottom Step Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        
        {/* Previous Button */}
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="w-full sm:w-auto rounded-xl gap-2 text-xs font-semibold"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>

        {/* Question Palette Indicators */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {questions.map((q, idx) => {
            const isAnswered = !!selectedAnswers[q.id]?.length;
            const isCurrent = idx === currentIndex;
            const isBookmarked = bookmarkedIds.includes(q.id);

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all relative ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/40 scale-105 shadow-xs"
                    : isAnswered
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-semibold"
                    : "bg-secondary text-muted-foreground hover:bg-muted"
                }`}
                title={`Question ${idx + 1}: ${isAnswered ? "Answered" : "Unanswered"}${isBookmarked ? " (Flagged)" : ""}`}
              >
                {idx + 1}
                {isBookmarked && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-card" />
                )}
              </button>
            );
          })}
        </div>

        {/* Next / Submit Button */}
        {currentIndex < totalQuestions - 1 ? (
          <Button
            variant="default"
            onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            className="w-full sm:w-auto rounded-xl gap-2 text-xs font-semibold"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="glow"
            onClick={() => setShowConfirmModal(true)}
            className="w-full sm:w-auto rounded-xl gap-2 text-xs font-semibold shadow-md"
          >
            <span>Submit Test</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Confirmation Modal */}
      <SubmitConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeSubmission}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        bookmarkedCount={bookmarkedIds.length}
        secondsRemaining={secondsRemaining}
        isSubmitting={isSubmitting}
      />

    </div>
  );
}

export default function PracticeTestRoomPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading practice test session...</div>}>
      <PracticeTestRoomContent />
    </React.Suspense>
  );
}
