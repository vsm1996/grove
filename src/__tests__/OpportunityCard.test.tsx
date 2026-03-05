import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import type { ScoredOpportunity } from "@/types/grove"

// ── Mocks ─────────────────────────────────────

vi.mock("@/lib/capacity", () => ({
  useDerivedMode: vi.fn(),
  useCapacityContext: vi.fn(),
  useFeedback: vi.fn(),
  entranceClass: vi.fn(() => ""),
  hoverClass: vi.fn(() => ""),
  focusBeaconClass: vi.fn(() => ""),
}))

vi.mock("@/lib/grove/db", () => ({
  updateOpportunity: vi.fn(),
}))

vi.mock("@/store/grove", () => ({
  useGroveStore: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: ({ href, children, onClick, className }: {
    href: string
    children: React.ReactNode
    onClick?: () => void
    className?: string
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}))

import { useDerivedMode, useCapacityContext, useFeedback } from "@/lib/capacity"
import { useGroveStore } from "@/store/grove"
import { OpportunityCard } from "@/components/grove/OpportunityCard"

// ── Helpers ───────────────────────────────────

function makeMode(density: "low" | "medium" | "high", focus: "default" | "gentle" | "guided" = "default") {
  return {
    density,
    motion: "off" as const,
    focus,
    contrast: "standard" as const,
    pace: "calm" as const,
  }
}

const mockFire = vi.fn()
const mockStoreUpdate = vi.fn()

const BASE_OPP: ScoredOpportunity = {
  id: "opp-1",
  userId: "user-1",
  company: "Acme Corp",
  role: "Senior Engineer",
  url: "https://example.com",
  status: "applied",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  alignment: { score: 8 },
  energy: { type: "expansive", intensity: 8 },
  signal: { type: "warm" },
  positioning: { skillGap: "Leadership" },
  reflections: [],
  compositeScore: 83,
  category: "pursue",
  followUp: {
    action: "Send thank you email",
    dueDate: "2024-01-10",
    completed: false,
  },
}

beforeEach(() => {
  vi.clearAllMocks()

  vi.mocked(useDerivedMode).mockReturnValue({
    field: {} as never,
    mode: makeMode("medium"),
  })

  vi.mocked(useCapacityContext).mockReturnValue({
    context: { emotionalState: { valence: 0 } },
  } as never)

  vi.mocked(useFeedback).mockReturnValue({ fire: mockFire } as never)

  vi.mocked(useGroveStore).mockImplementation(
    (selector: (s: { updateOpportunity: typeof mockStoreUpdate }) => unknown) =>
      selector({ updateOpportunity: mockStoreUpdate })
  )
})

// ── Card header always renders ─────────────────

describe("OpportunityCard header", () => {
  it("renders company and role", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.getByText("Acme Corp")).toBeInTheDocument()
    expect(screen.getByText("Senior Engineer")).toBeInTheDocument()
  })

  it("renders category badge", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.getByText("pursue")).toBeInTheDocument()
  })

  it("renders link to opportunity detail", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/opportunities/opp-1")
  })
})

// ── Density: low ──────────────────────────────

describe("density: low", () => {
  beforeEach(() => {
    vi.mocked(useDerivedMode).mockReturnValue({
      field: {} as never,
      mode: makeMode("low"),
    })
  })

  it("renders status badge and score bar", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    // Use selector: "span" to target the StatusBadge, not the <select> option
    expect(screen.getByText("Applied", { selector: "span" })).toBeInTheDocument()
    expect(screen.getByText("83")).toBeInTheDocument()
  })

  it("does not render energy badge", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.queryByText("Expansive")).not.toBeInTheDocument()
  })

  it("does not render signal badge", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.queryByText("Warm Network")).not.toBeInTheDocument()
  })

  it("does not render follow-up action", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.queryByText("Send thank you email")).not.toBeInTheDocument()
  })

  it("does not render skill gap", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.queryByText("Leadership")).not.toBeInTheDocument()
  })
})

// ── Density: medium ───────────────────────────

describe("density: medium", () => {
  beforeEach(() => {
    vi.mocked(useDerivedMode).mockReturnValue({
      field: {} as never,
      mode: makeMode("medium"),
    })
  })

  it("renders status, energy, signal, and score", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.getByText("Applied", { selector: "span" })).toBeInTheDocument()
    expect(screen.getByText("Expansive")).toBeInTheDocument()
    expect(screen.getByText("Warm Network")).toBeInTheDocument()
    expect(screen.getByText("83")).toBeInTheDocument()
  })

  it("does not render follow-up action", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.queryByText("Send thank you email")).not.toBeInTheDocument()
  })

  it("does not render skill gap", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    // "gap" badge shouldn't appear
    expect(screen.queryByText("gap")).not.toBeInTheDocument()
  })
})

// ── Density: high ─────────────────────────────

describe("density: high", () => {
  beforeEach(() => {
    vi.mocked(useDerivedMode).mockReturnValue({
      field: {} as never,
      mode: makeMode("high"),
    })
  })

  it("renders all six field types", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.getByText("Applied", { selector: "span" })).toBeInTheDocument()
    expect(screen.getByText("Expansive")).toBeInTheDocument()
    expect(screen.getByText("Warm Network")).toBeInTheDocument()
    expect(screen.getByText("83")).toBeInTheDocument()
    expect(screen.getByText("Send thank you email")).toBeInTheDocument()
    expect(screen.getByText("Leadership")).toBeInTheDocument()
  })

  it("hides follow-up when completed", () => {
    const opp = {
      ...BASE_OPP,
      followUp: { action: "Send follow-up", dueDate: undefined, completed: true },
    }
    render(<OpportunityCard opportunity={opp} />)
    expect(screen.queryByText("Send follow-up")).not.toBeInTheDocument()
  })

  it("hides follow-up section when no followUp set", () => {
    const opp = { ...BASE_OPP, followUp: undefined }
    render(<OpportunityCard opportunity={opp} />)
    expect(screen.queryByText("Send thank you email")).not.toBeInTheDocument()
  })

  it("hides skill gap section when no skillGap set", () => {
    const opp = { ...BASE_OPP, positioning: {} }
    render(<OpportunityCard opportunity={opp} />)
    expect(screen.queryByText("gap")).not.toBeInTheDocument()
  })
})

// ── CTA copy adapts to valence ─────────────────

describe("CTA label based on valence", () => {
  it("shows 'View & take action →' when valence > 0.2", () => {
    vi.mocked(useCapacityContext).mockReturnValue({
      context: { emotionalState: { valence: 0.5 } },
    } as never)
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.getByText("View & take action →")).toBeInTheDocument()
  })

  it("shows 'Review when ready' when valence < -0.2", () => {
    vi.mocked(useCapacityContext).mockReturnValue({
      context: { emotionalState: { valence: -0.5 } },
    } as never)
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.getByText("Review when ready")).toBeInTheDocument()
  })

  it("shows 'View details' when valence is neutral (-0.2 to 0.2)", () => {
    vi.mocked(useCapacityContext).mockReturnValue({
      context: { emotionalState: { valence: 0 } },
    } as never)
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.getByText("View details")).toBeInTheDocument()
  })

  it("shows 'View details' at exact 0.2 boundary", () => {
    vi.mocked(useCapacityContext).mockReturnValue({
      context: { emotionalState: { valence: 0.2 } },
    } as never)
    render(<OpportunityCard opportunity={BASE_OPP} />)
    expect(screen.getByText("View details")).toBeInTheDocument()
  })
})

// ── Score bar ─────────────────────────────────

describe("score progress bar", () => {
  it("renders progress element with composite score as value", () => {
    vi.mocked(useDerivedMode).mockReturnValue({
      field: {} as never,
      mode: makeMode("low"),
    })
    render(<OpportunityCard opportunity={BASE_OPP} />)
    const progress = document.querySelector("progress")
    expect(progress).toBeInTheDocument()
    expect(progress?.getAttribute("value")).toBe("83")
    expect(progress?.getAttribute("max")).toBe("100")
  })
})

// ── Haptic feedback on CTA click ───────────────

describe("haptic feedback", () => {
  it("fires 'tap' when CTA link is clicked", () => {
    render(<OpportunityCard opportunity={BASE_OPP} />)
    fireEvent.click(screen.getByRole("link"))
    expect(mockFire).toHaveBeenCalledWith("tap")
  })
})
