export type DifficultyLevel = 'easy' | 'intermediate' | 'advanced';
export type QuestionType = 'mcq' | 'coding' | 'essay' | 'short_answer';

export interface TopicItem {
  id: string;
  name: string;
  description: string;
  keywords?: string[];
  keyTerms?: string[];
  relevanceScore?: number;
  estimatedQuestions?: number;
  isCustom?: boolean;
}

export interface StudyDocument {
  id: string;
  title: string;
  fileName: string;
  fileSizeFormatted: string;
  pageCount: number;
  wordCount: number;
  uploadedAt: string;
  summary: string;
  topics: TopicItem[];
  tags: string[];
  status: 'ready' | 'processing' | 'error';
  quizzesTaken: number;
  averageScore?: number;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionSource {
  document: string;
  chunkId?: string;
  page?: number;
  excerpt: string;
  reference?: string;
  sectionTitle?: string;
}

export interface Question {
  id: string;
  topic: string;
  difficulty: DifficultyLevel;
  type: QuestionType;
  question: string;
  answer?: string;
  options?: QuestionOption[];
  correctAnswerIds?: string[];
  sampleAnswer?: string;
  starterCode?: string;
  sampleSolution?: string;
  language?: string;
  keyPoints?: string[];
  rubric?: string;
  explanation: string;
  source?: QuestionSource;
  sourceQuote: string;
  conceptTested: string;
  pageReference?: number;
}

export interface QuizConfig {
  documentId: string;
  documentTitle: string;
  selectedTopics: string[];
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes: QuestionType[];
  timeLimitMinutes?: number;
}

export interface UserAnswerRecord {
  questionId: string;
  selectedOptionIds: string[];
  shortAnswerText?: string;
  timeSpentSeconds: number;
  isBookmarked?: boolean;
}

export interface GradedQuestion {
  question: Question;
  userAnswer: UserAnswerRecord;
  isCorrect: boolean;
  score: number; // 0 to 1
  feedback: string;
  misconceptionIdentified?: string;
}

export interface ConceptMasteryScore {
  concept: string;
  totalQuestions: number;
  correctQuestions: number;
  masteryPercentage: number;
  status: 'mastered' | 'developing' | 'needs_review';
  recommendation: string;
}

export interface QuizResultReport {
  id: string;
  quizConfig: QuizConfig;
  completedAt: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  totalTimeSpentSeconds: number;
  conceptMastery: ConceptMasteryScore[];
  gradedQuestions: GradedQuestion[];
  weakTopics: string[];
  hasRemediationAvailable: boolean;
}

export interface WeakConceptItem {
  id: string;
  name: string;
  category: string;
  accuracyPercentage: number;
  questionsAttempted: number;
  status: 'critical' | 'moderate' | 'stable';
  lastPracticed: string;
  recommendedCount: number;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  documentTitle: string;
  topics: string[];
  difficulty: DifficultyLevel;
  score: number;
  totalQuestions: number;
  accuracyPercentage: number;
  completedAt: string;
  durationSeconds: number;
}

export interface DashboardStats {
  totalDocuments: number;
  totalQuestionsGenerated: number;
  totalQuizzesTaken: number;
  averageAccuracy: number;
  totalStudyMinutes: number;
  masteredConceptsCount: number;
  weakConceptsCount: number;
  questionsAttempted: number;
  questionsGoal: number;
}

