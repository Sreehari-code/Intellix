"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Zap, 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  Bookmark, 
  Quote, 
  Eye, 
  EyeOff, 
  Check, 
  Plus, 
  Download, 
  Code2, 
  FileQuestion, 
  CheckSquare, 
  UploadCloud 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/page-header";
import { SourceEvidenceViewer } from "@/components/quiz/source-evidence-dialog";
import { EngineModeToggle, EngineMode } from "@/components/common/engine-mode-toggle";
import { PdfUploadDropzone } from "@/components/study/pdf-upload-dropzone";
import { exportStudyGuideToPdf } from "@/lib/pdf/study-guide-exporter";
import { StudyDocument, Question, DifficultyLevel, QuestionType } from "@/types";
import { getDifficultyColor } from "@/lib/utils";

function HomeQuestionGeneratorContent() {
  const router = useRouter();

  // Documents state (no mock data fallback)
  const [documents, setDocuments] = React.useState<StudyDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = React.useState<string[]>([]);
  const [showUploadDropzone, setShowUploadDropzone] = React.useState<boolean>(false);
  const [isLoadingDocs, setIsLoadingDocs] = React.useState<boolean>(true);
  
  // Multi-Topic Selection State
  const [selectedTopics, setSelectedTopics] = React.useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = React.useState<string>("");
  const [showCustomTopicInput, setShowCustomTopicInput] = React.useState<boolean>(false);
  
  // Configuration State
  const [difficulty, setDifficulty] = React.useState<DifficultyLevel>("intermediate");
  const [questionCount, setQuestionCount] = React.useState<number>(5);
  const [questionTypes, setQuestionTypes] = React.useState<QuestionType[]>(["mcq"]);
  const [engineMode, setEngineMode] = React.useState<EngineMode>("online");

  // Generation Progress State
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);
  const [generationStage, setGenerationStage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Generated Results State
  const [generatedQuestions, setGeneratedQuestions] = React.useState<Question[] | null>(null);
  const [revealedAnswerIds, setRevealedAnswerIds] = React.useState<Record<string, boolean>>({});
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  // Load uploaded documents from server
  React.useEffect(() => {
    async function fetchDocs() {
      try {
        setIsLoadingDocs(true);
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            setDocuments(data.documents);
            setSelectedDocIds(prev => prev.length > 0 ? prev : [data.documents[0].id]);
          } else {
            setDocuments([]);
            setSelectedDocIds([]);
            setShowUploadDropzone(true); // Automatically show dropzone if no docs exist
          }
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
      } finally {
        setIsLoadingDocs(false);
      }
    }
    fetchDocs();
  }, []);

  const selectedDocs = React.useMemo(
    () => documents.filter((d) => selectedDocIds.includes(d.id)),
    [documents, selectedDocIds]
  );

  // Compute available topics from all selected materials
  const availableTopics = React.useMemo(() => {
    const topicsMap = new Map<string, { id: string; name: string; description?: string; docTitle: string }>();
    for (const doc of selectedDocs) {
      if (doc.topics && doc.topics.length > 0) {
        for (const t of doc.topics) {
          if (!topicsMap.has(t.name)) {
            topicsMap.set(t.name, { ...t, docTitle: doc.title });
          }
        }
      } else {
        if (!topicsMap.has(doc.title)) {
          topicsMap.set(doc.title, { id: `topic-${doc.id}`, name: doc.title, description: `Full document content for ${doc.fileName}`, docTitle: doc.title });
        }
      }
    }
    return Array.from(topicsMap.values());
  }, [selectedDocs]);

  // Stable key representing current available topic names
  const availableTopicNamesKey = React.useMemo(
    () => availableTopics.map((t) => t.name).sort().join("|||"),
    [availableTopics]
  );

  // Update selected topics only when available topics actually change
  React.useEffect(() => {
    if (availableTopics.length > 0) {
      setSelectedTopics((prev) => {
        const valid = prev.filter((t) => availableTopics.some((at) => at.name === t));
        const next = valid.length > 0 ? valid : [availableTopics[0].name];
        // If identical, return prev to preserve object reference and avoid re-render
        if (prev.length === next.length && prev.every((item, i) => item === next[i])) {
          return prev;
        }
        return next;
      });
    } else {
      setSelectedTopics((prev) => (prev.length === 0 ? prev : []));
    }
  }, [availableTopicNamesKey, availableTopics]);

  // Handle uploaded new document from dropzone
  const handleDocumentUploaded = (newDoc: StudyDocument) => {
    setDocuments((prev) => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);
    setSelectedDocIds((prev) => [...prev, newDoc.id]);
    setShowUploadDropzone(false);
  };

  // Toggle single material selection
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(docId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((id) => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  // Select all materials
  const selectAllDocuments = () => {
    setSelectedDocIds(documents.map((d) => d.id));
  };

  // Toggle single topic selection
  const toggleTopic = (topicName: string) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topicName)) {
        const filtered = prev.filter((t) => t !== topicName);
        return filtered.length > 0 ? filtered : [topicName];
      } else {
        return [...prev, topicName];
      }
    });
  };

  // Select all topics
  const selectAllTopics = () => {
    if (availableTopics.length > 0) {
      setSelectedTopics(availableTopics.map((t) => t.name));
    }
  };

  // Toggle Question Type
  const toggleQuestionType = (qType: QuestionType) => {
    setQuestionTypes((prev) => {
      if (prev.includes(qType)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== qType);
      } else {
        return [...prev, qType];
      }
    });
  };

  // Add custom manual topic
  const handleAddCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicInput.trim()) return;
    const trimmed = customTopicInput.trim();
    if (!selectedTopics.includes(trimmed)) {
      setSelectedTopics((prev) => [...prev, trimmed]);
    }
    setCustomTopicInput("");
    setShowCustomTopicInput(false);
  };

  // Toggle reveal answer for an individual question
  const toggleRevealAnswer = (qId: string) => {
    setRevealedAnswerIds((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Toggle reveal all answers
  const toggleRevealAll = () => {
    if (!generatedQuestions) return;
    const allRevealed = generatedQuestions.every((q) => revealedAnswerIds[q.id]);
    const newState: Record<string, boolean> = {};
    for (const q of generatedQuestions) {
      newState[q.id] = !allRevealed;
    }
    setRevealedAnswerIds(newState);
  };

  // Handle Generate Questions Request
  const handleGenerateQuestions = async () => {
    if (selectedDocIds.length === 0) {
      setErrorMessage("Please select at least one study material.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationProgress(15);
    setGenerationStage("Retrieving study materials & extracting contextual text chunks...");

    const topicsToGenerate = selectedTopics.length > 0 ? selectedTopics : availableTopics.map(t => t.name);

    try {
      const timer1 = setTimeout(() => {
        setGenerationProgress(45);
        setGenerationStage(`Extracting concepts across ${selectedDocs.length} material(s): ${topicsToGenerate.slice(0, 2).join(", ")}...`);
      }, 500);

      const timer2 = setTimeout(() => {
        setGenerationProgress(80);
        setGenerationStage("Enforcing zero-hallucination source grounding & generating answers...");
      }, 1100);

      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: selectedDocIds,
          documentId: selectedDocIds[0],
          topics: topicsToGenerate,
          topic: topicsToGenerate[0],
          difficulty,
          questionCount,
          questionTypes,
          mode: engineMode,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate questions.");
      }

      setGenerationProgress(100);
      setGenerationStage("Questions generated and validated successfully!");
      setGeneratedQuestions(result.questions);
      setRevealedAnswerIds({});
      setSavedSuccess(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred during question generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Export Study Guide PDF (Monochrome: Question, Options, Answer)
  const handleDownloadPdf = () => {
    if (!generatedQuestions || generatedQuestions.length === 0) return;
    const combinedTitle = selectedDocs.map(d => d.title).join(" & ") || "Study Material";
    exportStudyGuideToPdf({
      documentTitle: combinedTitle,
      topics: selectedTopics.length > 0 ? selectedTopics : [combinedTitle],
      difficulty,
      questions: generatedQuestions,
      includeAnswerKey: true,
    });
  };

  // Handle Start Practice Test with generated questions
  const handleStartPracticeTest = () => {
    if (!generatedQuestions) return;
    if (typeof window !== "undefined") {
      const combinedTitle = selectedDocs.map(d => d.title).join(" & ") || "Study Material";
      sessionStorage.setItem("intellix_active_quiz", JSON.stringify({
        documentId: selectedDocIds[0],
        documentIds: selectedDocIds,
        documentTitle: combinedTitle,
        topic: selectedTopics.join(", "),
        difficulty,
        questions: generatedQuestions,
      }));
    }
    router.push("/practice");
  };

  // Handle Save Quiz
  const handleSaveQuiz = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const combinedTitle = selectedDocs.map(d => d.title).join(" & ") || "Uploaded Materials";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hackathon Hero Banner & Header */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 fill-current animate-spin" />
              <span>Zero-Hallucination RAG Assessment Studio</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Turn Any Study PDF Into <span className="gradient-text">Exam-Ready Questions</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Extract topics from your study material, customize cognitive difficulty, and generate high-yield MCQs, coding challenges, and essay rubrics strictly grounded in source chunks.
            </p>
            {/* Feature Pills */}
            <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-1 bg-background/80 px-2.5 py-1 rounded-lg border border-border/80">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                100% Grounded
              </span>
              <span className="flex items-center gap-1 bg-background/80 px-2.5 py-1 rounded-lg border border-border/80">
                <FileText className="h-3.5 w-3.5 text-indigo-500" />
                RAG Chunk Extraction
              </span>
              <span className="flex items-center gap-1 bg-background/80 px-2.5 py-1 rounded-lg border border-border/80">
                <Download className="h-3.5 w-3.5 text-purple-500" />
                A4 Printable PDF Exporter
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Engine Mode Switcher Banner */}
      <EngineModeToggle mode={engineMode} onChange={setEngineMode} />

      {/* Generation Config Studio (Shown when no questions or when editing) */}
      {!generatedQuestions && (
        <div className="space-y-6">
          
          {/* 1. Select / Upload Source Study Material (Multi-Material Support) */}
          <div className="glass-card-premium p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-glow-sm">
                  1
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">Select Study Materials</h3>
                    <Badge variant="purple" className="text-[10px] font-bold">
                      {selectedDocIds.length} of {documents.length} Selected
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Select one or more PDF materials to extract topics and generate cross-material questions</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
                {documents.length > 1 && (
                  <button
                    type="button"
                    onClick={selectAllDocuments}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 transition-colors"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>Select All Materials</span>
                  </button>
                )}
                <Button 
                  size="sm"
                  variant={showUploadDropzone ? "secondary" : "outline"} 
                  onClick={() => setShowUploadDropzone(!showUploadDropzone)}
                  className="text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{showUploadDropzone ? "Hide Upload Dropzone" : "+ Upload New PDF"}</span>
                </Button>
              </div>
            </div>

            {/* Optional Integrated PDF Upload Dropzone */}
            {showUploadDropzone && (
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 animate-in fade-in duration-150">
                <PdfUploadDropzone onDocumentUploaded={handleDocumentUploaded} />
              </div>
            )}

            {/* Document Selection Grid */}
            {isLoadingDocs ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Loading study materials...
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-border/80 text-center space-y-3 bg-secondary/20">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                <h4 className="font-bold text-sm text-foreground">No study materials uploaded yet</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Upload your textbook, syllabus, or lecture notes PDF above to extract key topics and generate exam questions.
                </p>
                {!showUploadDropzone && (
                  <Button 
                    size="sm" 
                    variant="glow" 
                    onClick={() => setShowUploadDropzone(true)}
                    className="gap-2 rounded-xl text-xs font-bold"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Upload Your First PDF</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {documents.map((doc) => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        toggleDocumentSelection(doc.id);
                        setShowCustomTopicInput(false);
                      }}
                      className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden group ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md"
                          : "border-border/80 bg-card/60 hover:bg-muted/40 hover:border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-xl transition-colors ${isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/40 bg-card"
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                      <h4 className="font-bold text-xs text-foreground line-clamp-1 mt-3 group-hover:text-primary transition-colors">{doc.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {doc.pageCount} Pages • {doc.topics?.length || 0} Topics
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Select Multiple Topics across Selected Materials */}
          <div className="glass-card-premium p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-glow-sm">
                  2
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">Select Target Topics</h3>
                    <Badge variant="purple" className="text-[10px] font-bold">
                      {selectedTopics.length} selected
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose one or more topics from {selectedDocs.length > 0 ? selectedDocs.map(d => d.title).join(", ") : "selected materials"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={selectAllTopics}
                  disabled={availableTopics.length === 0}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 transition-colors disabled:opacity-50"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Select All Topics</span>
                </button>
                <span className="text-border">|</span>
                <button
                  type="button"
                  onClick={() => setShowCustomTopicInput(!showCustomTopicInput)}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showCustomTopicInput ? "Close Custom" : "+ Custom Topic"}</span>
                </button>
              </div>
            </div>

            {/* Custom manual topic entry */}
            {showCustomTopicInput && (
              <form onSubmit={handleAddCustomTopic} className="p-4 rounded-2xl bg-secondary/50 border border-border/80 space-y-2 animate-in fade-in duration-150">
                <label className="text-xs font-bold text-foreground">Add Custom Concept / Subtopic:</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Memory Layout & Cache Locality"
                    value={customTopicInput}
                    onChange={(e) => setCustomTopicInput(e.target.value)}
                    className="h-10 text-xs bg-background"
                  />
                  <Button type="submit" size="sm" variant="glow" className="text-xs shrink-0 rounded-xl px-4 font-bold">
                    Add Topic
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The RAG pipeline will isolate chunks in selected materials matching this concept.
                </p>
              </form>
            )}

            {/* Multi-Topic chips grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableTopics.length > 0 ? (
                availableTopics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.name);
                  return (
                    <div
                      key={topic.id || topic.name}
                      onClick={() => toggleTopic(topic.name)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-sm"
                          : "border-border/80 bg-card/50 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-xs text-foreground leading-snug">{topic.name}</h5>
                          {topic.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{topic.description}</p>
                          )}
                          {selectedDocs.length > 1 && topic.docTitle && (
                            <span className="inline-block text-[10px] text-primary/80 font-medium">
                              From: {topic.docTitle}
                            </span>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/40"
                        }`}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-6 text-center text-xs text-muted-foreground border rounded-2xl bg-muted/20">
                  {documents.length === 0 ? "Upload a PDF material above to extract topics." : "Please select at least one study material above."}
                </div>
              )}
            </div>
          </div>

          {/* 3. Question Types Selection */}
          <div className="glass-card-premium p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-glow-sm">
                3
              </span>
              <div>
                <h3 className="font-bold text-base text-foreground">Select Question Types</h3>
                <p className="text-xs text-muted-foreground">Select one or multiple formats for the assessment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { 
                  id: "mcq", 
                  title: "Multiple Choice (MCQ)", 
                  desc: "4 options with 1 verified correct answer and pedagogical explanations.",
                  icon: CheckCircle2,
                  badge: "Standard" 
                },
                { 
                  id: "coding", 
                  title: "Coding / Problem Solving", 
                  desc: "Hands-on algorithm/code problem with starter stub & reference solution.",
                  icon: Code2,
                  badge: "Technical" 
                },
                { 
                  id: "essay", 
                  title: "Descriptive / Essay Type", 
                  desc: "In-depth theoretical prompt with model answer & grading criteria rubric.",
                  icon: FileQuestion,
                  badge: "Conceptual" 
                },
              ].map((t) => {
                const isSelected = questionTypes.includes(t.id as QuestionType);
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleQuestionType(t.id as QuestionType)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md"
                        : "border-border/80 bg-card/50 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-foreground block">{t.title}</span>
                          <span className="text-[10px] text-primary font-semibold">{t.badge}</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/40"
                      }`}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2.5 leading-relaxed">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Select Difficulty & Number of Questions */}
          <div className="glass-card-premium p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-glow-sm">
                4
              </span>
              <div>
                <h3 className="font-bold text-base text-foreground">Difficulty & Number of Questions</h3>
                <p className="text-xs text-muted-foreground">Calibrate cognitive depth and question count</p>
              </div>
            </div>

            {/* Difficulty Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Cognitive Difficulty Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "easy", label: "Easy", desc: "Definitions, direct recall, terminology", badgeColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
                  { id: "intermediate", label: "Intermediate", desc: "Comprehension, scenario analysis, mechanisms", badgeColor: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
                  { id: "advanced", label: "Advanced", desc: "Multi-step synthesis, edge cases, trade-offs", badgeColor: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
                ].map((lvl) => {
                  const isSelected = difficulty === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setDifficulty(lvl.id as DifficultyLevel)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md"
                          : "border-border/80 bg-card/50 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs px-2 py-0.5 rounded-md border ${lvl.badgeColor}`}>{lvl.label}</span>
                        {isSelected && <Zap className="h-4 w-4 text-primary fill-current" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2 leading-tight">{lvl.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number of Questions (5, 10, 15, 20) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Number of Questions: <strong className="text-primary font-bold">{questionCount} Questions</strong>
                </label>
                <span className="text-xs text-muted-foreground font-medium">Est. Practice: ~{questionCount * 2} mins</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                      questionCount === num
                        ? "border-primary bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-glow-sm scale-[1.02]"
                        : "border-border/80 bg-card/60 hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Anti-Hallucination Grounding Notice */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-950 dark:text-emerald-300 leading-relaxed">
                <strong>Grounded Guarantee:</strong> The AI is strictly constrained to use <em>only</em> information explicitly present in <span className="underline font-semibold">{selectedDocs.map(d => d.fileName).join(", ") || "the uploaded materials"}</span>. Every generated question includes a verbatim source quotation anchor.
              </p>
            </div>
          </div>

          {/* Loading / Progress State Banner */}
          {isGenerating && (
            <div className="glass-card-premium p-8 rounded-3xl space-y-5 border-primary/50 bg-gradient-to-br from-indigo-500/10 via-background to-transparent animate-in fade-in duration-200 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-primary text-white shadow-glow animate-spin">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-foreground">Generating Grounded Assessment...</h4>
                  <p className="text-xs text-muted-foreground">{generationStage}</p>
                </div>
              </div>
              <Progress value={generationProgress} className="h-3 rounded-full" />
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
              <Button size="sm" variant="outline" onClick={() => setErrorMessage(null)} className="h-7 text-xs">
                Dismiss
              </Button>
            </div>
          )}

          {/* Prominent Action CTA */}
          <div className="pt-2">
            <Button
              size="lg"
              variant="glow"
              onClick={handleGenerateQuestions}
              disabled={isGenerating || selectedTopics.length === 0 || selectedDocIds.length === 0}
              className="w-full rounded-2xl gap-3 font-extrabold text-base h-16 shadow-xl hover:scale-[1.01] transition-transform"
            >
              <Sparkles className="h-5 w-5 fill-current" />
              <span>Generate {questionCount} Questions ({selectedTopics.length} Topics across {selectedDocIds.length} Material{selectedDocIds.length !== 1 ? "s" : ""})</span>
            </Button>
          </div>

        </div>
      )}

      {/* 5. Generated Results View */}
      {generatedQuestions && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Results Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-card-premium border border-border shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-xl text-foreground">Generated Assessment</h3>
                <Badge variant="purple" className="text-xs font-bold">
                  {generatedQuestions.length} Questions Ready
                </Badge>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border">
                  {difficulty}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Grounded in <strong className="text-foreground">{combinedTitle}</strong> • Topics: <strong className="text-foreground">{selectedTopics.join(", ")}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              
              {/* PDF Material Download Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                className="rounded-xl gap-2 text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 shadow-xs h-10 px-4"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF Material</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleRevealAll}
                className="rounded-xl gap-1.5 text-xs font-semibold h-10 px-3"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Toggle All Answers</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateQuestions}
                className="rounded-xl gap-1.5 text-xs font-semibold h-10 px-3"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Regenerate</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveQuiz}
                className="rounded-xl gap-1.5 text-xs font-semibold h-10 px-3"
              >
                <Bookmark className="h-3.5 w-3.5 text-indigo-500" />
                <span>{savedSuccess ? "Saved!" : "Save"}</span>
              </Button>

              <Button
                variant="glow"
                size="sm"
                onClick={handleStartPracticeTest}
                className="rounded-xl gap-2 text-xs font-bold shadow-glow-sm h-10 px-4"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Interactive Practice</span>
              </Button>
            </div>
          </div>

          {/* Success Banner */}
          {savedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span className="font-semibold">Assessment saved to your active study sessions!</span>
            </div>
          )}

          {/* Question Cards List */}
          <div className="space-y-4">
            {generatedQuestions.map((q, index) => {
              const qNum = (index + 1).toString().padStart(2, "0");
              const isAnswerRevealed = !!revealedAnswerIds[q.id];
              const diffColors = getDifficultyColor(q.difficulty);
              const qType = q.type || (q.options && q.options.length > 0 ? "mcq" : q.starterCode ? "coding" : "essay");

              return (
                <div key={q.id} className="glass-card-premium p-6 sm:p-7 rounded-3xl space-y-5 border-border/80 relative overflow-hidden transition-all hover:border-primary/40">
                  
                  {/* Top Header: Question 01, Type Badge, Difficulty, Topic */}
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-extrabold text-xs uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-xl">
                        Question {qNum}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase rounded-lg">
                        {qType === "coding" ? "Coding" : qType === "essay" ? "Essay" : "MCQ"}
                      </Badge>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border uppercase ${diffColors.bg} ${diffColors.text} ${diffColors.border}`}>
                        {q.difficulty}
                      </span>
                      <Badge variant="secondary" className="text-xs rounded-lg">
                        {q.topic}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <SourceEvidenceViewer
                        source={q.source}
                        documentTitle={combinedTitle}
                        defaultExcerpt={q.sourceQuote}
                        pageNumber={q.pageReference}
                      />

                      <button
                        type="button"
                        onClick={() => toggleRevealAnswer(q.id)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {isAnswerRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                        <span>{isAnswerRevealed ? "Hide Answer" : "Show Answer"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Stem */}
                  <h4 className="font-extrabold text-base sm:text-lg text-foreground leading-relaxed">
                    {q.question}
                  </h4>

                  {/* Question Type Specific Body */}

                  {/* MCQ Type */}
                  {qType === "mcq" && q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isCorrect = q.correctAnswerIds?.includes(opt.id) || q.answer === opt.text;

                        return (
                          <div
                            key={opt.id}
                            className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 transition-colors ${
                              isAnswerRevealed && isCorrect
                                ? "border-emerald-500/50 bg-emerald-500/10 font-semibold text-emerald-950 dark:text-emerald-300 shadow-sm"
                                : "border-border/70 bg-card/60 text-foreground"
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 ${
                              isAnswerRevealed && isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-secondary text-muted-foreground font-mono"
                            }`}>
                              {letter}
                            </span>
                            <span className="flex-1 leading-relaxed">{opt.text}</span>
                            {isAnswerRevealed && isCorrect && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Coding Type (macOS Window Style) */}
                  {qType === "coding" && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-lg">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                          </div>
                          <span className="ml-2 font-bold uppercase text-indigo-400">{q.language || "Python"} Code Template</span>
                        </div>
                        <span className="text-[11px] text-zinc-500">Read & Complete</span>
                      </div>
                      <div className="p-4 text-zinc-100 font-mono text-xs overflow-x-auto leading-relaxed">
                        <pre><code>{q.starterCode || "# Starter Code\ndef solve():\n    pass"}</code></pre>
                      </div>
                    </div>
                  )}

                  {/* Essay Type */}
                  {qType === "essay" && (
                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border/80 space-y-2 text-xs">
                      <span className="font-bold text-foreground uppercase tracking-wider text-[10px] text-primary">
                        Assessment Criteria:
                      </span>
                      <p className="text-muted-foreground leading-relaxed">
                        Provide a structured conceptual answer covering core mechanisms, operational definitions, and constraints extracted from the document.
                      </p>
                    </div>
                  )}

                  {/* Revealed Answer & Explanation Drawer */}
                  {isAnswerRevealed && (
                    <div className="p-5 rounded-2xl bg-secondary/60 border border-border space-y-4 animate-in fade-in duration-150">
                      
                      {/* MCQ Revealed Answer */}
                      {qType === "mcq" && (
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Verified Correct Answer:
                          </span>
                          <p className="font-bold text-sm text-foreground mt-1">
                            {q.options?.find((o) => q.correctAnswerIds?.includes(o.id))?.text || q.answer}
                          </p>
                        </div>
                      )}

                      {/* Coding Revealed Solution */}
                      {qType === "coding" && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Reference Solution Implementation:
                          </span>
                          <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800 text-emerald-300 font-mono text-xs overflow-x-auto">
                            <pre><code>{q.sampleSolution || q.answer}</code></pre>
                          </div>
                        </div>
                      )}

                      {/* Essay Revealed Model Answer */}
                      {qType === "essay" && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Model Answer & Grading Rubric:
                          </span>
                          <p className="font-medium text-xs text-foreground leading-relaxed bg-card p-3.5 rounded-xl border border-border">
                            {q.answer}
                          </p>
                          {q.keyPoints && q.keyPoints.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Key Evaluation Points:</span>
                              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 pl-1">
                                {q.keyPoints.map((kp, kIdx) => (
                                  <li key={kIdx} className="leading-relaxed">{kp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Pedagogical Explanation:
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>

                      {/* Source Evidence Citation */}
                      <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                          <Quote className="h-3.5 w-3.5" />
                          <span>Source Material Evidence{q.pageReference ? ` (Page ${q.pageReference})` : ""}:</span>
                        </div>
                        <blockquote className="text-xs italic text-indigo-950 dark:text-indigo-200 pl-3 border-l-2 border-indigo-500 leading-relaxed">
                          "{q.sourceQuote || q.source?.excerpt}"
                        </blockquote>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setGeneratedQuestions(null)}
              className="rounded-xl text-xs font-bold h-11 px-4"
            >
              ← Configure New Assessment
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto rounded-2xl gap-2 font-bold text-sm h-12 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 shadow-xs px-5"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF Worksheet</span>
              </Button>

              <Button
                size="lg"
                variant="glow"
                onClick={handleStartPracticeTest}
                className="w-full sm:w-auto rounded-2xl gap-2 font-bold text-sm h-12 shadow-xl px-6"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Launch Interactive Practice ({generatedQuestions.length} Qs)</span>
              </Button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default function HomePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading study generator...</div>}>
      <HomeQuestionGeneratorContent />
    </React.Suspense>
  );
}
