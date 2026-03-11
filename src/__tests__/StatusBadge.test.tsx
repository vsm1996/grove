import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatusBadge } from "@/components/grove/StatusBadge"
import type { OpportunityStatus } from "@/types/grove"

describe("StatusBadge", () => {
  const statuses: { status: OpportunityStatus; label: string; colorClass: string }[] = [
    { status: "saved", label: "Saved", colorClass: "badge-neutral" },
    { status: "applied", label: "Applied", colorClass: "badge-info" },
    { status: "interviewing", label: "Interviewing", colorClass: "badge-warning" },
    { status: "offer", label: "Offer", colorClass: "badge-success" },
    { status: "rejected", label: "Rejected", colorClass: "badge-error" },
    { status: "archived", label: "Archived", colorClass: "badge-ghost" },
  ]

  it.each(statuses)("renders '$label' for status '$status'", ({ status, label }) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it.each(statuses)("applies $colorClass for status '$status'", ({ status, colorClass }) => {
    render(<StatusBadge status={status} />)
    const badge = screen.getByText(statuses.find((s) => s.status === status)!.label)
    expect(badge).toHaveClass("badge", "badge-sm", colorClass)
  })
})
