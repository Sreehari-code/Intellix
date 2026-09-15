import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "glow" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 shadow-indigo-500/10":
              variant === "default",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80":
              variant === "secondary",
            "border border-border bg-background hover:bg-muted/50 hover:text-foreground":
              variant === "outline",
            "hover:bg-muted/60 hover:text-foreground":
              variant === "ghost",
            "text-primary underline-offset-4 hover:underline":
              variant === "link",
            "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-glow hover:shadow-indigo-500/40 hover:brightness-105":
              variant === "glow",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90":
              variant === "destructive",
            "h-10 px-4 py-2": size === "default",
            "h-8 rounded-lg px-3 text-xs": size === "sm",
            "h-12 rounded-xl px-6 text-base font-semibold": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
