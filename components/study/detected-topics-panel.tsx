"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Layers, 
  Plus, 
  Trash2, 
  Tag, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw, 
  X,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StudyDocument, TopicItem } from "@/types";

interface DetectedTopicsPanelProps {
  document: StudyDocument;
  onTopicsUpdated: (updatedTopics: TopicItem[]) => void;
}

export function DetectedTopicsPanel({ document, onTopicsUpdated }: DetectedTopicsPanelProps) {
  const [topics, setTopics] = React.useState<TopicItem[]>(document.topics || []);
  const [selectedTopicId, setSelectedTopicId] = React.useState<string | null>(
    document.topics && document.topics.length > 0 ? document.topics[0].id : null
  );
  const [isAddingTopic, setIsAddingTopic] = React.useState(false);
  const [newTopicName, setNewTopicName] = React.useState("");
  const [newTopicDesc, setNewTopicDesc] = React.useState("");
  const [newTopicKeywords, setNewTopicKeywords] = React.useState("");
  const [isReanalyzing, setIsReanalyzing] = React.useState(false);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // Sync with prop changes
  React.useEffect(() => {
    setTopics(document.topics || []);
    if (document.topics && document.topics.length > 0) {
      setSelectedTopicId(document.topics[0].id);
    }
  }, [document.id, document.topics]);

  // Handle Manual Custom Topic Addition
  const handleAddCustomTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    const keywordsArray = newTopicKeywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const customTopic: TopicItem = {
      id: `topic-custom-${Date.now()}`,
      name: newTopicName.trim(),
      description: newTopicDesc.trim() || `User-specified focus topic for ${newTopicName.trim()}.`,
      keywords: keywordsArray.length > 0 ? keywordsArray : [newTopicName.trim()],
      keyTerms: keywordsArray.length > 0 ? keywordsArray : [newTopicName.trim()],
      estimatedQuestions: 10,
      isCustom: true,
    };

    try {
      const res = await fetch("/api/documents/topics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: document.id,
          newTopic: customTopic,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.topics || [...topics, customTopic];
        setTopics(updated);
        onTopicsUpdated(updated);
        setSelectedTopicId(customTopic.id);
      } else {
        const updated = [...topics, customTopic];
        setTopics(updated);
        onTopicsUpdated(updated);
      }

      setNewTopicName("");
      setNewTopicDesc("");
      setNewTopicKeywords("");
      setIsAddingTopic(false);
      setActionSuccess("Custom topic added successfully!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      const updated = [...topics, customTopic];
      setTopics(updated);
      onTopicsUpdated(updated);
      setIsAddingTopic(false);
    }
  };

  // Handle Topic Removal
  const handleDeleteTopic = (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    const updated = topics.filter((t) => t.id !== topicId);
    setTopics(updated);
    onTopicsUpdated(updated);
    if (selectedTopicId === topicId && updated.length > 0) {
      setSelectedTopicId(updated[0].id);
    }
  };

  // Handle Re-analysis with AI
  const handleReanalyzeTopics = async () => {
    setIsReanalyzing(true);
    try {
      const res = await fetch("/api/documents/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: document.id,
          documentText: document.summary,
          documentTitle: document.title,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.topics && data.topics.length > 0) {
          setTopics(data.topics);
          onTopicsUpdated(data.topics);
          setSelectedTopicId(data.topics[0].id);
          setActionSuccess("Topics re-analyzed & indexed successfully!");
          setTimeout(() => setActionSuccess(null), 3000);
        }
      }
    } catch (err) {
      console.error("Re-analysis failed:", err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-500" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Detected Topics ({topics.length})
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReanalyzeTopics}
            disabled={isReanalyzing}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors disabled:opacity-50"
            title="Re-analyze with AI"
          >
            <RefreshCw className={`h-3 w-3 ${isReanalyzing ? "animate-spin text-primary" : ""}`} />
            <span>Re-analyze</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setIsAddingTopic(!isAddingTopic)}
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            <span>Add Custom</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Manual Topic Entry Form */}
      {isAddingTopic && (
        <form onSubmit={handleAddCustomTopic} className="p-4 rounded-2xl bg-secondary/60 border border-border/80 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-foreground">Add Custom Educational Topic</span>
            <button
              type="button"
              onClick={() => setIsAddingTopic(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Topic Name (e.g. AVL Tree Rotations & Heights)"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              className="h-9 text-xs"
              required
            />
            <Input
              placeholder="Short Description (Optional)"
              value={newTopicDesc}
              onChange={(e) => setNewTopicDesc(e.target.value)}
              className="h-9 text-xs"
            />
            <Input
              placeholder="Keywords / Formulas (Comma separated, e.g. AVL, balance factor, LL rotation)"
              value={newTopicKeywords}
              onChange={(e) => setNewTopicKeywords(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsAddingTopic(false)}
              className="h-7 text-xs rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="glow"
              className="h-7 text-xs rounded-lg font-semibold"
            >
              Add Topic
            </Button>
          </div>
        </form>
      )}

      {/* Clickable Topic Chips List */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {topics.map((topic, index) => {
          const isSelected = topic.id === selectedTopicId;
          const keywordsList = topic.keywords || topic.keyTerms || [];

          return (
            <div
              key={topic.id}
              onClick={() => setSelectedTopicId(topic.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border/70 bg-card hover:border-border hover:bg-muted/40"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-secondary text-[10px] font-bold flex items-center justify-center text-muted-foreground shrink-0">
                      {index + 1}
                    </span>
                    <h5 className="font-bold text-xs text-foreground leading-snug">
                      {topic.name}
                    </h5>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {topic.isCustom && (
                      <Badge variant="purple" className="text-[9px] px-1.5 py-0 h-4">
                        Custom
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTopic(e, topic.id)}
                      className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                      title="Remove topic"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed pl-7">
                  {topic.description}
                </p>

                {/* Keywords Tag Badges */}
                {keywordsList.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-1 pl-7">
                    {keywordsList.map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted-foreground border border-border/70"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Target Action */}
      <div className="pt-2">
        <Link href={`/generate?docId=${document.id}`}>
          <Button variant="glow" className="w-full rounded-2xl gap-2 font-bold text-sm shadow-md">
            <Sparkles className="h-4 w-4" />
            <span>Generate Practice Questions for these Topics</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
