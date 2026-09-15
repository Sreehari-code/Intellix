import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  description: string;
  badge?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  badge,
  icon: Icon,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/70 relative">
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          {Icon && (
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-indigo-500/5 text-primary border border-primary/20 shadow-glow-sm">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          {badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          {description}
        </p>
      </div>

      {actions && (
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
