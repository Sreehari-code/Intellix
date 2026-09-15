import { Question, QuizResultReport, GradedQuestion, ConceptMasteryScore } from "@/types";

export interface TestSubmissionInput {
  quizId?: string;
  documentId?: string;
  documentTitle?: string;
  topic?: string;
  difficulty?: string;
  questions: Question[];
  selectedAnswers: Record<string, string[]>;
  timeSpentSeconds: number;
}

/**
 * Evaluates an interactive test submission and computes complete performance diagnostics
 */
export function evaluateTestSubmission({
  quizId = `quiz-${Date.now()}`,
  documentId = "doc-default",
  documentTitle = "Study Material",
  topic = "General Topic",
  difficulty = "intermediate",
  questions,
  selectedAnswers,
  timeSpentSeconds,
}: TestSubmissionInput): QuizResultReport {
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  // Grade each individual question
  const gradedQuestions: GradedQuestion[] = questions.map((q) => {
    const userSelected = selectedAnswers[q.id] || [];
    const isUnanswered = userSelected.length === 0 || (typeof userSelected[0] === "string" && userSelected[0].trim() === "");

    const correctIds = q.correctAnswerIds || (q.options ? [q.options[0]?.id] : []);
    const isCorrect = !isUnanswered && (
      (q.correctAnswerIds && q.correctAnswerIds.some((id) => userSelected.includes(id))) ||
      (q.answer && userSelected.some((ans) => ans.toLowerCase().includes(q.answer!.toLowerCase().slice(0, 20)))) ||
      (q.type === "coding" || q.type === "essay" ? !isUnanswered : false)
    );

    if (isUnanswered) {
      unansweredCount++;
    } else if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    const correctOpt = q.options?.find((o) => correctIds.includes(o.id));
    const userOpt = q.options?.find((o) => userSelected.includes(o.id));

    let misconception: string | undefined = undefined;
    if (!isCorrect && !isUnanswered) {
      misconception = `Review concept: "${correctOpt?.text || q.answer || "documented principle in source"}".`;
    }

    return {
      question: q,
      userAnswer: {
        questionId: q.id,
        selectedOptionIds: userSelected,
        timeSpentSeconds: Math.round(timeSpentSeconds / (questions.length || 1)),
      },
      isCorrect,
      score: isCorrect ? 1 : 0,
      feedback: q.explanation || `The correct answer is "${correctOpt?.text || ""}". Grounded in document evidence.`,
      misconceptionIdentified: misconception,
    };
  });

  const totalQuestions = questions.length;
  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Group performance by concept / topic to calculate mastery breakdown
  const conceptGroups: Record<string, { total: number; correct: number }> = {};

  questions.forEach((q, idx) => {
    const conceptName = q.conceptTested || q.topic || topic;
    if (!conceptGroups[conceptName]) {
      conceptGroups[conceptName] = { total: 0, correct: 0 };
    }
    conceptGroups[conceptName].total++;
    if (gradedQuestions[idx]?.isCorrect) {
      conceptGroups[conceptName].correct++;
    }
  });

  const conceptMastery: ConceptMasteryScore[] = Object.entries(conceptGroups).map(
    ([concept, data]) => {
      const pct = Math.round((data.correct / data.total) * 100);
      let status: "mastered" | "developing" | "needs_review" = "mastered";
      let recommendation = `Excellent mastery demonstrated in ${concept}.`;

      if (pct < 60) {
        status = "needs_review";
        recommendation = `Review core principles of ${concept} in ${documentTitle}.`;
      } else if (pct < 80) {
        status = "developing";
        recommendation = `Reinforce understanding of ${concept} with 3-5 targeted practice questions.`;
      }

      return {
        concept,
        totalQuestions: data.total,
        correctQuestions: data.correct,
        masteryPercentage: pct,
        status,
        recommendation,
      };
    }
  );

  const weakTopics = conceptMastery
    .filter((c) => c.status !== "mastered")
    .map((c) => c.concept);

  return {
    id: quizId,
    quizConfig: {
      documentId,
      documentTitle,
      selectedTopics: [topic],
      difficulty: difficulty as any,
      questionCount: totalQuestions,
      questionTypes: ["mcq"],
    },
    completedAt: new Date().toISOString(),
    totalQuestions,
    correctCount,
    scorePercentage,
    totalTimeSpentSeconds: timeSpentSeconds,
    conceptMastery,
    gradedQuestions,
    weakTopics,
    hasRemediationAvailable: weakTopics.length > 0,
  };
}
