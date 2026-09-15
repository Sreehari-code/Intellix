import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "purple";
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary/10 text-primary hover:bg-primary/20":
            variant === "default",
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80":
            variant === "secondary",
          "border-border text-foreground":
            variant === "outline",
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400":
            variant === "success",
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400":
            variant === "warning",
          "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400":
            variant === "destructive",
          "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400":
            variant === "purple",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
