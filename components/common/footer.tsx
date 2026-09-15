import * as React from "react";
import { BrainCircuit, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white mt-auto py-6 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 rounded bg-zinc-900 flex items-center justify-center text-white">
              <BrainCircuit className="h-3 w-3" />
            </div>
            <span className="font-semibold text-zinc-900">Intellix</span>
            <span>•</span>
            <span>Zero-Hallucination Grounded Question Engine</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Source Grounded
            </span>
            <span>•</span>
            <span>A4 Printable Monochrome PDF Exporter</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
