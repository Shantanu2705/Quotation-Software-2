"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
}

export function StatsCard({ title, value, icon: Icon, trend, trendUp, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="hover-lift border-none premium-shadow bg-card h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="text-3xl font-bold tracking-tight">{value}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon size={24} />
            </div>
          </div>
          {trend && (
            <div className="mt-4 flex items-center text-sm">
              <span
                className={cn(
                  "font-medium",
                  trendUp === true ? "text-emerald-500" : trendUp === false ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {trendUp === true ? "+" : trendUp === false ? "-" : ""}{trend}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
