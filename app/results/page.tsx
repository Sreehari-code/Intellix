"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  BookOpen, 
  Flame, 
  Clock, 
  RotateCcw, 
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Quote,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/common/page-header";
import { SourceEvidenceViewer } from "@/components/quiz/source-evidence-dialog";
import { mockQuizResult } from "@/lib/mock-data";
import { formatSecondsToTime } from "@/lib/utils";
import { QuizResultReport } from "@/types";

export default function QuizResultsPage() {
  const router = useRouter();
  const [result, setResult] = React.useState<QuizResultReport>(mockQuizResult);
  const [expandedQuestionId, setExpandedQuestionId] = React.useState<string | null>(null);
  const [isClientLoaded, setIsClientLoaded] = React.useState(false);

  // Load dynamically evaluated report from sessionStorage if available
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedReport = sessionStorage.getItem("intellix_latest_test_report");
      if (storedReport) {
        const parsed = JSON.parse(storedReport);
        if (parsed.gradedQuestions && parsed.gradedQuestions.length > 0) {
          setResult(parsed);
          setExpandedQuestionId(parsed.gradedQuestions[0]?.question?.id || null);
        }
      }
    } catch (e) {
      console.warn("Failed to load latest test report:", e);
    }

    setIsClientLoaded(true);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
  };

  const isProficient = result.scorePercentage >= 80;
  const isModerate = result.scorePercentage >= 60 && result.scorePercentage < 80;
  const weakConceptsCount = result.weakTopics?.length || 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Diagnostic Mastery Scorecard"
        description={`Performance breakdown for ${result.quizConfig.documentTitle}. Review weak concepts, explanations, and verbatim evidence citations.`}
        badge="Evaluated Assessment"
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/generate">
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                <span>New Quiz</span>
              </Button>
            </Link>
            <Link href="/practice">
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retake Test</span>
              </Button>
            </Link>
            {weakConceptsCount > 0 && (
              <Link href="/generate">
                <Button variant="glow" size="sm" className="rounded-xl gap-1.5 text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Targeted Remediation</span>
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Main Score Hero Card */}
      <Card className="p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-indigo-500/30 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Big Score Dial */}
          <div className="flex items-center gap-6 md:border-r md:border-slate-800 pr-6">
            <div className={`w-24 h-24 rounded-3xl border-2 flex flex-col items-center justify-center shadow-glow ${
              isProficient
                ? "bg-emerald-600/30 border-emerald-400"
                : isModerate
                ? "bg-indigo-600/30 border-indigo-400"
                : "bg-rose-600/30 border-rose-400"
            }`}>
              <span className="text-3xl font-extrabold text-white">{result.scorePercentage}%</span>
              <span className="text-[10px] uppercase font-bold text-indigo-300">Score</span>
            </div>
            <div className="space-y-1">
              <Badge
                variant={isProficient ? "success" : isModerate ? "secondary" : "destructive"}
                className="text-xs"
              >
                {isProficient ? "Mastery Achieved" : isModerate ? "Developing" : "Needs Review"}
              </Badge>
              <h3 className="text-lg font-bold text-white">
                {result.correctCount} of {result.totalQuestions} Correct
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Completed in {formatSecondsToTime(result.totalTimeSpentSeconds)}</span>
              </p>
            </div>
          </div>

          {/* Remediation & Insights Callout */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {weakConceptsCount > 0 ? "Diagnostic Gap Identified" : "Comprehensive Concept Mastery"}
              </span>
            </div>
            
            <p className="text-sm text-slate-200 leading-relaxed">
              {weakConceptsCount > 0 ? (
                <>
                  You demonstrated solid foundations, but encountered challenges in{" "}
                  <strong className="text-amber-300">{result.weakTopics.slice(0, 2).join(" & ")}</strong>.
                  We recommend taking 3-5 targeted practice questions to solidify these gaps.
                </>
              ) : (
                <>
                  Outstanding performance! You achieved <strong className="text-emerald-300">{result.scorePercentage}% accuracy</strong> across all concepts in <strong className="text-white">{result.quizConfig.documentTitle}</strong>.
                </>
              )}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <Link href="/generate">
                <Button size="sm" variant="glow" className="rounded-xl gap-2 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Follow-Up Questions for Weak Concepts</span>
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </Card>

      {/* Concept Mastery Breakdown */}
      {result.conceptMastery && result.conceptMastery.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Concept Mastery Breakdown</h3>
            <span className="text-xs text-muted-foreground">{result.conceptMastery.length} Concepts Evaluated</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.conceptMastery.map((item, idx) => {
              const isMastered = item.masteryPercentage >= 80;
              return (
                <Card key={idx} className="p-5 space-y-3 border-border/80 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">{item.concept}</h4>
                        {isMastered ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.correctQuestions}/{item.totalQuestions} questions correct
                      </p>
                    </div>

                    <span className={`text-xs font-bold ${isMastered ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {item.masteryPercentage}%
                    </span>
                  </div>

                  <Progress
                    value={item.masteryPercentage}
                    className="h-2"
                    indicatorClassName={isMastered ? "bg-emerald-500" : "bg-amber-500"}
                  />

                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl">
                    💡 <strong className="text-foreground">Recommendation:</strong> {item.recommendation}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Question-by-Question Review with Source Citations */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Question-by-Question Diagnostic Review</h3>
          <span className="text-xs text-muted-foreground">Click to inspect source text citations</span>
        </div>

        <div className="space-y-3">
          {result.gradedQuestions.map((graded, idx) => {
            const isExpanded = expandedQuestionId === graded.question.id;
            const isCorrect = graded.isCorrect;

            return (
              <Card
                key={graded.question.id}
                className={`overflow-hidden transition-all duration-200 border-2 ${
                  isCorrect ? "border-border/80" : "border-amber-500/40 bg-amber-50/5 dark:bg-amber-950/10"
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(graded.question.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCorrect
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          : "bg-rose-500/20 text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground line-clamp-1">
                          {graded.question.question}
                        </span>
                        {isCorrect ? (
                          <Badge variant="success" className="text-[10px]">Correct</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">Incorrect</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{graded.question.conceptTested || graded.question.topic}</p>
                    </div>
                  </div>

                  <button type="button" className="p-1 rounded-lg text-muted-foreground hover:bg-muted shrink-0">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {/* Expanded Detailed Accordion */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-border/60 space-y-4 animate-in fade-in duration-150">
                    
                    {/* Full Question & Options / Solutions */}
                    <div className="space-y-2 pt-3">
                      <p className="font-semibold text-sm text-foreground">{graded.question.question}</p>
                      {graded.question.options && graded.question.options.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {graded.question.options.map((opt) => {
                            const isCorrectOpt = graded.question.correctAnswerIds?.includes(opt.id) || graded.question.answer === opt.text;
                            const isUserSelected = graded.userAnswer.selectedOptionIds.includes(opt.id);

                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                                  isCorrectOpt
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold"
                                    : isUserSelected
                                    ? "border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-200 font-semibold"
                                    : "border-border/60 text-muted-foreground"
                                }`}
                              >
                                <span className="leading-relaxed">{opt.text}</span>
                                {isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />}
                                {isUserSelected && !isCorrectOpt && <XCircle className="h-4 w-4 text-rose-600 shrink-0 ml-2" />}
                              </div>
                            );
                          })}
                        </div>
                      ) : graded.question.type === "coding" ? (
                        <div className="p-3 bg-zinc-950 text-emerald-300 rounded-xl font-mono text-xs overflow-x-auto border border-zinc-800">
                          <pre><code>{graded.question.sampleSolution || graded.question.answer}</code></pre>
                        </div>
                      ) : (
                        <div className="p-3 bg-secondary rounded-xl text-xs text-foreground">
                          <strong>Model Answer:</strong> {graded.question.answer}
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    <div className="p-3.5 rounded-xl bg-secondary/60 space-y-1.5 text-xs">
                      <p className="font-semibold text-foreground">Explanation:</p>
                      <p className="text-muted-foreground leading-relaxed">{graded.question.explanation}</p>
                      {graded.misconceptionIdentified && (
                        <p className="text-amber-600 dark:text-amber-400 pt-1">
                          ⚠️ <span className="font-semibold">Misconception:</span> {graded.misconceptionIdentified}
                        </p>
                      )}
                    </div>

                    {/* Grounded Source Quote Callout */}
                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                          <Quote className="h-3.5 w-3.5" />
                          <span>Source Material Evidence{graded.question.pageReference ? ` (Page ${graded.question.pageReference})` : ""}:</span>
                        </div>
                        <SourceEvidenceViewer
                          source={graded.question.source}
                          documentTitle={result.quizConfig.documentTitle}
                          defaultExcerpt={graded.question.sourceQuote}
                          pageNumber={graded.question.pageReference}
                        />
                      </div>
                      <blockquote className="text-xs italic text-indigo-950 dark:text-indigo-200 pl-3 border-l-2 border-indigo-500 leading-relaxed">
                        "{graded.question.sourceQuote || graded.question.source?.excerpt}"
                      </blockquote>
                    </div>

                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
}
