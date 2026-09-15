import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconColor = "text-indigo-600 dark:text-indigo-400",
  iconBg = "bg-indigo-50 dark:bg-indigo-950/50",
}: StatCardProps) {
  return (
    <Card className="p-6 relative overflow-hidden transition-all duration-200 hover:shadow-md border-border/80">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-bold tracking-tight text-foreground">{value}</h4>
            {trend && (
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-md",
                  trend.isPositive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground pt-1">{description}</p>
          )}
        </div>

        <div className={cn("p-3 rounded-2xl flex items-center justify-center shadow-xs", iconBg)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
      </div>
    </Card>
  );
}
