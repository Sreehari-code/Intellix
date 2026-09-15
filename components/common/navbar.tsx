"use client";

import * as React from "react";
import Link from "next/link";
import { 
  BrainCircuit, 
  FileText,
  UploadCloud,
  Layers,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        
        {/* Minimalist Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-xs group-hover:bg-zinc-800 transition-colors">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-zinc-900">
              Intellix
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              Assessment Studio
            </span>
          </div>
        </Link>

        {/* Right Info & Fast Jump */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center text-xs text-zinc-500 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
            Zero-Hallucination Grounded Engine
          </div>
          <Link href="/">
            <Button size="sm" className="rounded-lg h-8 px-3 text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs gap-1.5">
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload PDF</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
