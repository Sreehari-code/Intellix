"use client";

import * as React from "react";
import { Sparkles, Cpu, Globe, Zap, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type EngineMode = "online" | "offline";

interface EngineModeToggleProps {
  mode?: EngineMode;
  onChange?: (mode: EngineMode) => void;
  className?: string;
  compact?: boolean;
}

export function EngineModeToggle({
  mode: propMode,
  onChange,
  className = "",
  compact = false,
}: EngineModeToggleProps) {
  const [currentMode, setCurrentMode] = React.useState<EngineMode>("online");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("intellix_ai_mode") as EngineMode;
      if (saved === "online" || saved === "offline") {
        setCurrentMode(saved);
        onChange?.(saved);
      }
    }
  }, []);

  React.useEffect(() => {
    if (propMode && propMode !== currentMode) {
      setCurrentMode(propMode);
    }
  }, [propMode]);

  const setMode = (newMode: EngineMode) => {
    setCurrentMode(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("intellix_ai_mode", newMode);
      window.dispatchEvent(new CustomEvent("intellix-engine-mode-changed", { detail: newMode }));
    }
    onChange?.(newMode);
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-secondary/80 border border-border/80 text-xs ${className}`}>
        <button
          type="button"
          onClick={() => setMode("online")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
            currentMode === "online"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Online Mode (OpenAI / Gemini LLM)"
        >
          <Globe className="h-3 w-3" />
          <span>Online AI</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("offline")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
            currentMode === "offline"
              ? "bg-amber-500 text-white shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Offline Mode (Local Deterministic Engine)"
        >
          <Zap className="h-3 w-3" />
          <span>Offline</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-foreground">AI Generation Engine</span>
          {currentMode === "online" ? (
            <Badge variant="purple" className="text-[10px] gap-1 py-0 px-2">
              <Sparkles className="h-3 w-3" />
              <span>OpenAI / Gemini LLM Active</span>
            </Badge>
          ) : (
            <Badge variant="warning" className="text-[10px] gap-1 py-0 px-2">
              <Zap className="h-3 w-3" />
              <span>Offline Local Engine Active</span>
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {currentMode === "online"
            ? "Generates dynamic cognitive questions using your OpenAI or Gemini API key."
            : "Zero API calls: runs local deterministic RAG extraction immediately."}
        </p>
      </div>

      <div className="flex items-center p-1 rounded-xl bg-secondary border border-border text-xs shrink-0">
        <button
          type="button"
          onClick={() => setMode("online")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
            currentMode === "online"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>Online LLM</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("offline")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
            currentMode === "offline"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Offline Local</span>
        </button>
      </div>
    </div>
  );
}
