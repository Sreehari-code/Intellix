import * as React from "react";
import Link from "next/link";
import { BrainCircuit, Sparkles, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-card/30 backdrop-blur-md mt-auto py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-glow-sm">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-foreground">Intellix AI</p>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Hackathon Edition
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Zero-Hallucination RAG Assessment & PDF Exporter</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs text-muted-foreground flex-wrap justify-center">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Source Grounded
            </span>
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              Multi-Topic Chunk Extraction
            </span>
          </div>

          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} Intellix Studio • Built for Deep Learning
          </p>
        </div>
      </div>
    </footer>
  );
}
