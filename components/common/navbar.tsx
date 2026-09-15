"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sparkles, 
  BrainCircuit, 
  FileText,
  UploadCloud,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EngineModeToggle } from "@/components/common/engine-mode-toggle";

const navLinks = [
  { href: "/", label: "PDF Question Generator", icon: BrainCircuit, badge: "RAG" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/75 backdrop-blur-xl transition-all shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-glow-sm group-hover:scale-105 transition-transform duration-200">
            <BrainCircuit className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Intellix
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
                RAG Studio
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:inline-block -mt-0.5 font-medium">
              Zero-Hallucination Exam Generator
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative",
                  isActive
                    ? "text-primary font-semibold bg-primary/10 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{link.label}</span>
                {link.badge && (
                  <Badge variant="purple" className="text-[10px] px-1.5 py-0 h-4">
                    {link.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Actions & Engine Mode Switcher */}
        <div className="hidden sm:flex items-center space-x-3">
          <EngineModeToggle compact />
          <Link href="/">
            <Button variant="glow" size="sm" className="rounded-xl gap-2 shadow-sm font-semibold">
              <UploadCloud className="h-4 w-4" />
              <span>Upload PDF</span>
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/">
            <Button variant="glow" size="sm" className="rounded-lg h-8 px-2.5 text-xs gap-1.5">
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload</span>
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-lg px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <Badge variant="purple" className="text-[10px] px-1.5 py-0 h-4">
                      {link.badge}
                    </Badge>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
              </Link>
            );
          })}
          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="glow" className="w-full justify-center gap-2 font-semibold">
                <UploadCloud className="h-4 w-4" />
                <span>Upload PDF</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

