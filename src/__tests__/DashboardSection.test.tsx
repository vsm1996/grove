import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ScoredOpportunity } from "@/types/grove"

// ── Mocks ─────────────────────────────────────

vi.mock("@/lib/capacity", () => ({
  useDerivedMode: vi.fn(),
  useCapacityContext: vi.fn(),
  useFeedback: vi.fn(),
  listItemClass: vi.fn(() => ""),
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
import { DashboardSection } from "@/components/grove/DashboardSection"

const mockFire = vi.fn()
const mockStoreUpdate = vi.fn()

const makeOpp = (id: string, company: string): ScoredOpportunity => ({
  id,
  userId: "user-1",
  company,
  role: "Engineer",
  status: "applied",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  alignment: { score: 8 },
  energy: { type: "expansive", intensity: 7 },
  signal: { type: "warm" },
  positioning: {},
  reflections: [],
  compositeScore: 75,
  category: "pursue",
})

beforeEach(() => {
  vi.clearAllMocks()

  vi.mocked(useDerivedMode).mockReturnValue({
    field: {} as never,
    mode: {
      density: "medium" as const,
      motion: "off" as const,
      focus: "default" as const,
      contrast: "standard" as const,
      pace: "calm" as const,
    },
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

// ── Tests ─────────────────────────────────────

describe("DashboardSection", () => {
  it("renders category heading", () => {
    render(<DashboardSection category="pursue" opportunities={[]} modeLabel="Focused" />)
    expect(screen.getByText("Pursue")).toBeInTheDocument()
  })

  it("renders opportunity count badge", () => {
    const opps = [makeOpp("1", "Acme"), makeOpp("2", "Beta")]
    render(<DashboardSection category="pursue" opportunities={opps} modeLabel="Focused" />)
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("shows 0 count when empty", () => {
    render(<DashboardSection category="pursue" opportunities={[]} modeLabel="Focused" />)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("renders category description when opportunities exist", () => {
    const opps = [makeOpp("1", "Acme")]
    render(<DashboardSection category="pursue" opportunities={opps} modeLabel="Focused" />)
    expect(screen.getByText(/high alignment \+ strong signal/i)).toBeInTheDocument()
  })

  it("hides category description when empty", () => {
    render(<DashboardSection category="pursue" opportunities={[]} modeLabel="Focused" />)
    expect(screen.queryByText(/high alignment \+ strong signal/i)).not.toBeInTheDocument()
  })

  // ── Empty states ────────────────────────────

  describe("empty state copy", () => {
    it("shows Minimal mode copy for pursue", () => {
      render(<DashboardSection category="pursue" opportunities={[]} modeLabel="Minimal" />)
      expect(screen.getByText("No warm leads right now. Rest. They'll come.")).toBeInTheDocument()
    })

    it("shows Calm mode copy for worth_it", () => {
      render(<DashboardSection category="worth_it" opportunities={[]} modeLabel="Calm" />)
      expect(screen.getByText("Nothing in the worth-it bucket.")).toBeInTheDocument()
    })

    it("shows Focused mode copy for mercenary", () => {
      render(<DashboardSection category="mercenary" opportunities={[]} modeLabel="Focused" />)
      expect(screen.getByText("No mercenary plays.")).toBeInTheDocument()
    })

    it("shows fallback copy for unknown mode+category combos", () => {
      render(<DashboardSection category="mercenary" opportunities={[]} modeLabel="Minimal" />)
      expect(screen.getByText("No mercenary opportunities.")).toBeInTheDocument()
    })
  })

  // ── Opportunity cards ─────────────────────────

  it("renders OpportunityCard for each opportunity", () => {
    const opps = [makeOpp("1", "Acme Corp"), makeOpp("2", "Beta Inc")]
    render(<DashboardSection category="pursue" opportunities={opps} modeLabel="Focused" />)
    expect(screen.getByText("Acme Corp")).toBeInTheDocument()
    expect(screen.getByText("Beta Inc")).toBeInTheDocument()
  })

  it("applies staggered animation delay to each card wrapper", () => {
    const opps = [makeOpp("1", "Acme"), makeOpp("2", "Beta"), makeOpp("3", "Gamma")]
    const { container } = render(
      <DashboardSection category="pursue" opportunities={opps} modeLabel="Focused" />
    )
    const grid = container.querySelector(".grid")!
    const items = grid.children
    expect(items[0]).toHaveStyle({ animationDelay: "0s" })
    expect(items[1]).toHaveStyle({ animationDelay: "0.05s" })
    expect(items[2]).toHaveStyle({ animationDelay: "0.1s" })
  })
})
