"use client"

import type { OpportunityStatus } from "@/types/grove"

const STATUS_COLORS: Record<OpportunityStatus, string> = {
  saved: "badge-neutral",
  applied: "badge-info",
  interviewing: "badge-warning",
  offer: "badge-success",
  rejected: "badge-error",
  archived: "badge-ghost",
}

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  archived: "Archived",
}

export function StatusBadge({ status }: { status: OpportunityStatus }) {
  return (
    <span className={`badge badge-sm ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
