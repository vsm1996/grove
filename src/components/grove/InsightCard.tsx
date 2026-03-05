"use client"

import type { InsightPattern } from "@/types/grove"

const SEVERITY_STYLES: Record<InsightPattern["severity"], { card: string; badge: string }> = {
  info: { card: "border-info/30", badge: "badge-info" },
  warning: { card: "border-warning/30", badge: "badge-warning" },
  critical: { card: "border-error/30", badge: "badge-error" },
}

interface Props {
  pattern: InsightPattern
}

export function InsightCard({ pattern }: Props) {
  const styles = SEVERITY_STYLES[pattern.severity]

  return (
    <div className={`card bg-base-200 border ${styles.card}`}>
      <div className="card-body p-4 gap-2">
        <div className="flex items-center gap-2">
          <span className={`badge badge-sm ${styles.badge}`}>{pattern.severity}</span>
          <span className="font-semibold text-sm">{pattern.label}</span>
          <span className="ml-auto text-xs opacity-50">{pattern.count}</span>
        </div>
        <p className="text-sm opacity-70">{pattern.description}</p>
      </div>
    </div>
  )
}
