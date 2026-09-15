"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Play, 
  RotateCcw, 
  Download, 
  Code2, 
  FileQuestion, 
  CheckSquare, 
  UploadCloud,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PdfUploadDropzone } from "@/components/study/pdf-upload-dropzone";
import { exportStudyGuideToPdf } from "@/lib/pdf/study-guide-exporter";
import { StudyDocument, Question, DifficultyLevel, QuestionType } from "@/types";

function HomeQuestionGeneratorContent() {
  const router = useRouter();

  // Documents state (no mock data)
  const [documents, setDocuments] = React.useState<StudyDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = React.useState<string[]>([]);
  const [showUploadDropzone, setShowUploadDropzone] = React.useState<boolean>(false);
  const [isLoadingDocs, setIsLoadingDocs] = React.useState<boolean>(true);
  
  // Topic Selection State
  const [selectedTopics, setSelectedTopics] = React.useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = React.useState<string>("");
  const [showCustomTopicInput, setShowCustomTopicInput] = React.useState<boolean>(false);
  
  // Configuration State
  const [difficulty, setDifficulty] = React.useState<DifficultyLevel>("intermediate");
  const [questionCount, setQuestionCount] = React.useState<number>(5);
  const [questionTypes, setQuestionTypes] = React.useState<QuestionType[]>(["mcq"]);

  // Generation Progress State
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);
  const [generationStage, setGenerationStage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Generated Results State
  const [generatedQuestions, setGeneratedQuestions] = React.useState<Question[] | null>(null);
  const [revealedAnswerIds, setRevealedAnswerIds] = React.useState<Record<string, boolean>>({});

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
            setSelectedDocIds((prev) => (prev.length > 0 ? prev : [data.documents[0].id]));
          } else {
            setDocuments([]);
            setSelectedDocIds([]);
            setShowUploadDropzone(true);
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

  // Memoized selected documents
  const selectedDocs = React.useMemo(
    () => documents.filter((d) => selectedDocIds.includes(d.id)),
    [documents, selectedDocIds]
  );

  // Compute available topics from selected materials
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
          topicsMap.set(doc.title, { id: `topic-${doc.id}`, name: doc.title, description: `Full content for ${doc.fileName}`, docTitle: doc.title });
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
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    setSelectedDocIds((prev) => [...prev, newDoc.id]);
    setShowUploadDropzone(false);
  };

  // Toggle single material selection
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(docId)) {
        if (prev.length === 1) return prev;
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

  // Delete a document
  const handleDeleteDocument = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    try {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setSelectedDocIds((prev) => prev.filter((id) => id !== docId));
    } catch (err) {
      console.error("Failed to remove document:", err);
    }
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
      setErrorMessage("Please upload and select at least one study PDF.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationProgress(20);
    setGenerationStage("Retrieving study chunks and analyzing topic context...");

    const topicsToGenerate = selectedTopics.length > 0 ? selectedTopics : availableTopics.map((t) => t.name);

    try {
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
          mode: "online",
        }),
      });

      setGenerationProgress(80);
      setGenerationStage("Validating source grounding & structuring answer keys...");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate questions.");
      }

      setGenerationProgress(100);
      setGeneratedQuestions(data.questions);

      // Scroll smoothly to results
      setTimeout(() => {
        const resultsEl = document.getElementById("generated-assessment-section");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth" });
        }
      }, 200);
    } catch (err: any) {
      console.error("Question generation failed:", err);
      setErrorMessage(err.message || "An error occurred while generating questions.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Download PDF Handler (Monochrome Black Text)
  const handleDownloadPdf = () => {
    if (!generatedQuestions || generatedQuestions.length === 0) return;
    const title = selectedDocs.map((d) => d.title).join(" & ") || "Study Material";
    exportStudyGuideToPdf({
      documentTitle: title,
      topics: selectedTopics.length > 0 ? selectedTopics : ["Comprehensive Assessment"],
      difficulty,
      questions: generatedQuestions,
      includeAnswerKey: true,
    });
  };

  // Start Practice Test Handler
  const handleStartPracticeTest = () => {
    if (!generatedQuestions || generatedQuestions.length === 0) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("current_quiz_questions", JSON.stringify(generatedQuestions));
      sessionStorage.setItem(
        "current_quiz_config",
        JSON.stringify({
          title: selectedDocs.map((d) => d.title).join(" & "),
          topic: selectedTopics.join(", "),
          difficulty,
          totalQuestions: generatedQuestions.length,
        })
      );
      router.push("/practice");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Header Introduction */}
      <div className="border-b border-zinc-200 pb-6 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Assessment Studio
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Upload your study PDFs, select target concepts, and generate exam-standard questions strictly grounded in your materials.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {documents.length} Material{documents.length === 1 ? "" : "s"} Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Study Materials Manager (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-700" />
              <span>1. Study Materials</span>
            </h2>
            {documents.length > 1 && (
              <button
                onClick={selectAllDocuments}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:underline"
              >
                Select All ({documents.length})
              </button>
            )}
          </div>

          {/* Upload Dropzone */}
          <PdfUploadDropzone onDocumentUploaded={handleDocumentUploaded} compact={documents.length > 0} />

          {/* Uploaded Documents List */}
          {documents.length > 0 && (
            <div className="space-y-2.5 mt-3">
              {documents.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocumentSelection(doc.id)}
                    className={`notion-card p-3.5 cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected ? "border-zinc-900 bg-zinc-50/50" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div
                        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                          isSelected ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 truncate leading-tight">
                          {doc.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                          {doc.fileName} • {doc.pageCount} Pages • {doc.topics?.length || 1} Topics
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteDocument(e, doc.id)}
                      className="text-zinc-400 hover:text-rose-600 p-1 shrink-0 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Assessment Configuration & Generator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section: Select Target Topics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-700" />
                <span>2. Target Concepts</span>
                <span className="text-xs font-normal normal-case text-zinc-500">
                  ({selectedTopics.length} selected)
                </span>
              </h2>
              {availableTopics.length > 1 && (
                <button
                  onClick={selectAllTopics}
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:underline"
                >
                  Select All Topics
                </button>
              )}
            </div>

            {availableTopics.length === 0 ? (
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-center text-xs text-zinc-500">
                Upload a study material on the left to extract topics.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTopics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.name);
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleTopic(topic.name)}
                      className={`notion-tag text-xs ${isSelected ? "active" : ""}`}
                    >
                      {isSelected && <Check className="h-3 w-3 shrink-0" />}
                      <span>{topic.name}</span>
                      {selectedDocs.length > 1 && (
                        <span className="opacity-60 text-[10px]">({topic.docTitle.slice(0, 12)}...)</span>
                      )}
                    </button>
                  );
                })}

                {/* Inline custom topic addition */}
                {showCustomTopicInput ? (
                  <form onSubmit={handleAddCustomTopic} className="inline-flex items-center gap-1.5">
                    <Input
                      type="text"
                      placeholder="Type custom topic..."
                      value={customTopicInput}
                      onChange={(e) => setCustomTopicInput(e.target.value)}
                      className="h-7 text-xs w-36 px-2 py-0 border-zinc-300 rounded-md"
                      autoFocus
                    />
                    <Button type="submit" size="sm" className="h-7 px-2 text-xs bg-zinc-900 text-white rounded-md">
                      Add
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowCustomTopicInput(false)}
                      className="text-xs text-zinc-400 hover:text-zinc-600 px-1"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomTopicInput(true)}
                    className="notion-tag border-dashed text-zinc-500 hover:text-zinc-900"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Custom</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section: Question Format */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              3. Question Format
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { type: "mcq" as QuestionType, label: "Multiple Choice", desc: "4 options with 1 verified answer" },
                { type: "coding" as QuestionType, label: "Problem Solving", desc: "Code exercises with starter stub" },
                { type: "essay" as QuestionType, label: "Descriptive Essay", desc: "Conceptual answer & rubric" },
              ].map((item) => {
                const isChecked = questionTypes.includes(item.type);
                return (
                  <div
                    key={item.type}
                    onClick={() => toggleQuestionType(item.type)}
                    className={`notion-card p-3 cursor-pointer text-left ${
                      isChecked ? "border-zinc-900 bg-zinc-50/50" : "border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-zinc-900">{item.label}</span>
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          isChecked ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-300"
                        }`}
                      >
                        {isChecked && <Check className="h-2.5 w-2.5" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-tight">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Difficulty & Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Cognitive Difficulty
              </label>
              <div className="segmented-pill w-full justify-between">
                {[
                  { level: "easy" as DifficultyLevel, label: "Easy" },
                  { level: "intermediate" as DifficultyLevel, label: "Medium" },
                  { level: "advanced" as DifficultyLevel, label: "Hard" },
                ].map((d) => (
                  <button
                    key={d.level}
                    type="button"
                    onClick={() => setDifficulty(d.level)}
                    className={`segmented-pill-item flex-1 text-center ${
                      difficulty === d.level ? "active" : ""
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Question Count
              </label>
              <div className="segmented-pill w-full justify-between">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`segmented-pill-item flex-1 text-center font-mono ${
                      questionCount === count ? "active" : ""
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Primary Action CTA */}
          <div className="pt-2">
            <Button
              onClick={handleGenerateQuestions}
              disabled={isGenerating || selectedDocIds.length === 0}
              className="w-full h-11 rounded-xl bg-zinc-900 text-white hover:bg-black font-medium text-sm shadow-xs transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{generationStage || "Generating assessment..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    Generate {questionCount} Questions ({selectedTopics.length} Concept{selectedTopics.length === 1 ? "" : "s"})
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Generated Assessment Section */}
      {generatedQuestions && generatedQuestions.length > 0 && (
        <div id="generated-assessment-section" className="pt-10 border-t border-zinc-200 space-y-6 animate-in fade-in duration-300">
          
          {/* Action Toolbar */}
          <div className="notion-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900">
                  Generated Assessment
                </h2>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                  {generatedQuestions.length} Questions
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Strictly grounded in {selectedDocs.map((d) => d.title).join(", ")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleRevealAll}
                className="h-8 text-xs rounded-lg gap-1.5 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              >
                {generatedQuestions.every((q) => revealedAnswerIds[q.id]) ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide Answers</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Reveal All Answers</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handleDownloadPdf}
                size="sm"
                className="h-8 text-xs rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 gap-1.5 shadow-xs font-medium"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF (Black Text)</span>
              </Button>

              <Button
                onClick={handleStartPracticeTest}
                size="sm"
                variant="outline"
                className="h-8 text-xs rounded-lg border-zinc-300 text-zinc-800 hover:bg-zinc-100 gap-1.5 font-medium"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Practice Mode</span>
              </Button>
            </div>
          </div>

          {/* Questions Cards List */}
          <div className="space-y-4">
            {generatedQuestions.map((q, idx) => {
              const qNum = idx + 1;
              const isRevealed = revealedAnswerIds[q.id];
              const qType = q.type || (q.options && q.options.length > 0 ? "mcq" : "essay");

              return (
                <div key={q.id} className="notion-card p-5 space-y-4 bg-white">
                  
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-zinc-400">
                          {qNum.toString().padStart(2, "0")}
                        </span>
                        <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                          {q.topic || "Core Concept"}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-400">
                          • {q.difficulty?.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-zinc-900 leading-snug">
                        {q.question}
                      </h3>
                    </div>

                    <button
                      onClick={() => toggleRevealAnswer(q.id)}
                      className="text-xs text-zinc-500 hover:text-zinc-900 p-1 shrink-0 font-medium flex items-center gap-1"
                    >
                      <span>{isRevealed ? "Hide Answer" : "Answer Key"}</span>
                      {isRevealed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* MCQ Options */}
                  {qType === "mcq" && q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const isCorrect = isRevealed && q.correctAnswerIds?.includes(opt.id);

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-lg border text-xs flex items-start space-x-2.5 transition-colors ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-medium"
                                : "border-zinc-200 bg-zinc-50/30 text-zinc-800"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded flex items-center justify-center font-mono font-semibold shrink-0 ${
                              isCorrect ? "bg-emerald-600 text-white" : "bg-white border border-zinc-200 text-zinc-600"
                            }`}>
                              {letter}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Coding Starter Code */}
                  {qType === "coding" && q.starterCode && (
                    <div className="pt-1">
                      <p className="text-[11px] font-semibold text-zinc-500 mb-1">Starter Code ({q.language || "Python"}):</p>
                      <pre className="p-3 rounded-lg bg-zinc-900 text-zinc-100 text-xs font-mono overflow-x-auto">
                        <code>{q.starterCode}</code>
                      </pre>
                    </div>
                  )}

                  {/* Expandable Answer & Source Citation */}
                  {isRevealed && (
                    <div className="pt-3 border-t border-zinc-100 space-y-2 text-xs animate-in fade-in duration-150">
                      <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-2">
                        <div>
                          <span className="font-semibold text-zinc-900">Correct Answer: </span>
                          <span className="text-zinc-800">{q.answer}</span>
                        </div>
                        {q.explanation && (
                          <div>
                            <span className="font-semibold text-zinc-900">Explanation: </span>
                            <span className="text-zinc-600 leading-relaxed">{q.explanation}</span>
                          </div>
                        )}
                        {(q.sourceQuote || q.source?.excerpt) && (
                          <div className="pt-1 border-t border-zinc-200 text-[11px] text-zinc-500 italic">
                            <span className="font-semibold not-italic text-zinc-700">Source Quote (Page {q.pageReference || q.source?.page || 1}): </span>
                            &ldquo;{q.sourceQuote || q.source?.excerpt}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500">Loading Assessment Studio...</div>}>
      <HomeQuestionGeneratorContent />
    </React.Suspense>
  );
}
