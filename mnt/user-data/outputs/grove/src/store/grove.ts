// ─────────────────────────────────────────────
// GROVE — Zustand Store
// ─────────────────────────────────────────────

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {
  Opportunity,
  ScoredOpportunity,
  NewOpportunityInput,
  UpdateOpportunityInput,
  OpportunityCategory,
  OpportunityStatus,
  GroveInsights,
  EnergyType,
  InsightPattern,
} from "@/types/grove"

// ── Scoring Logic ─────────────────────────────

const SIGNAL_WEIGHT: Record<string, number> = {
  referral: 1.0,
  warm: 0.75,
  recruiter: 0.5,
  cold: 0.25,
}

const ENERGY_WEIGHT: Record<string, number> = {
  expansive: 1.0,
  neutral: 0.5,
  extractive: 0.0,
}

/**
 * Composite score: Alignment 50%, Signal 30%, Energy 20%
 * Normalized to 0–100
 */
function computeCompositeScore(opportunity: Opportunity): number {
  const alignmentNorm = opportunity.alignment.score / 10
  const signalNorm = SIGNAL_WEIGHT[opportunity.signal.type] ?? 0.25
  const energyNorm = ENERGY_WEIGHT[opportunity.energy.type] ?? 0.5

  return Math.round(
    (alignmentNorm * 0.5 + signalNorm * 0.3 + energyNorm * 0.2) * 100
  )
}

/**
 * Categorize opportunity based on alignment + signal + energy
 */
function deriveCategory(opportunity: Opportunity): OpportunityCategory {
  const { alignment, signal, energy } = opportunity
  const highAlignment = alignment.score >= 7
  const strongSignal =
    signal.type === "referral" || signal.type === "warm"
  const extractive = energy.type === "extractive"

  if (highAlignment && strongSignal) return "pursue"
  if (highAlignment && !extractive) return "worth_it"
  if (!highAlignment && strongSignal) return "mercenary"
  return "experimental"
}

function scoreOpportunity(opportunity: Opportunity): ScoredOpportunity {
  return {
    ...opportunity,
    compositeScore: computeCompositeScore(opportunity),
    category: deriveCategory(opportunity),
  }
}

// ── Insights Derivation ───────────────────────

function deriveInsights(opportunities: ScoredOpportunity[]): GroveInsights {
  const byStatus = opportunities.reduce(
    (acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }),
    {} as Record<OpportunityStatus, number>
  )

  const byCategory = opportunities.reduce(
    (acc, o) => ({ ...acc, [o.category]: (acc[o.category] ?? 0) + 1 }),
    {} as Record<OpportunityCategory, number>
  )

  const avgAlignmentScore =
    opportunities.length > 0
      ? Math.round(
          opportunities.reduce((sum, o) => sum + o.alignment.score, 0) /
            opportunities.length
        )
      : 0

  // Dominant energy type
  const energyCounts = opportunities.reduce(
    (acc, o) => ({ ...acc, [o.energy.type]: (acc[o.energy.type] ?? 0) + 1 }),
    {} as Record<EnergyType, number>
  )
  const dominantEnergyType = (
    Object.entries(energyCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "neutral"
  ) as EnergyType

  // Pattern detection
  const patterns: InsightPattern[] = []

  const extractiveCount = energyCounts["extractive"] ?? 0
  if (extractiveCount > opportunities.length * 0.5) {
    patterns.push({
      label: "High extractive load",
      description:
        "More than half your opportunities feel draining. Consider narrowing to roles that energize you.",
      count: extractiveCount,
      severity: "warning",
    })
  }

  const coldCount = opportunities.filter((o) => o.signal.type === "cold").length
  if (coldCount > opportunities.length * 0.7) {
    patterns.push({
      label: "Heavy cold apply volume",
      description:
        "Most applications are cold. Warm network and referrals convert significantly better.",
      count: coldCount,
      severity: "warning",
    })
  }

  const rejectedCount = byStatus["rejected"] ?? 0
  if (rejectedCount > 5) {
    patterns.push({
      label: "Rejection pattern",
      description:
        "You have several rejections. Review your positioning gaps for recurring themes.",
      count: rejectedCount,
      severity: "critical",
    })
  }

  const lowAlignmentCount = opportunities.filter(
    (o) => o.alignment.score < 5
  ).length
  if (lowAlignmentCount > opportunities.length * 0.4) {
    patterns.push({
      label: "Low alignment pipeline",
      description:
        "A large portion of your pipeline is below your alignment threshold. Quality over quantity.",
      count: lowAlignmentCount,
      severity: "info",
    })
  }

  // Top positioning gaps
  const skillGaps = opportunities
    .map((o) => o.positioning.skillGap)
    .filter(Boolean) as string[]
  const gapCounts = skillGaps.reduce(
    (acc, gap) => ({ ...acc, [gap]: (acc[gap] ?? 0) + 1 }),
    {} as Record<string, number>
  )
  const topPositioningGaps = Object.entries(gapCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([gap]) => gap)

  return {
    totalOpportunities: opportunities.length,
    byStatus,
    byCategory,
    avgAlignmentScore,
    dominantEnergyType,
    patterns,
    topPositioningGaps,
  }
}

// ── Store ─────────────────────────────────────

interface GroveState {
  // Data
  opportunities: ScoredOpportunity[]
  insights: GroveInsights | null

  // UI State
  isLoading: boolean
  error: string | null
  selectedId: string | null

  // Actions
  setOpportunities: (opportunities: Opportunity[]) => void
  addOpportunity: (opportunity: Opportunity) => void
  updateOpportunity: (id: string, updates: UpdateOpportunityInput) => void
  removeOpportunity: (id: string) => void
  setSelectedId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Selectors (derived)
  getById: (id: string) => ScoredOpportunity | undefined
  getByCategory: (category: OpportunityCategory) => ScoredOpportunity[]
  getByStatus: (status: OpportunityStatus) => ScoredOpportunity[]
  getWarmLeads: () => ScoredOpportunity[]
}

export const useGroveStore = create<GroveState>()(
  devtools(
    (set, get) => ({
      opportunities: [],
      insights: null,
      isLoading: false,
      error: null,
      selectedId: null,

      setOpportunities: (raw) => {
        const scored = raw.map(scoreOpportunity)
        set({
          opportunities: scored,
          insights: deriveInsights(scored),
        })
      },

      addOpportunity: (raw) => {
        const scored = scoreOpportunity(raw)
        set((state) => {
          const opportunities = [scored, ...state.opportunities]
          return { opportunities, insights: deriveInsights(opportunities) }
        })
      },

      updateOpportunity: (id, updates) => {
        set((state) => {
          const opportunities = state.opportunities.map((o) => {
            if (o.id !== id) return o
            const merged: Opportunity = { ...o, ...updates, id, userId: o.userId }
            return scoreOpportunity(merged)
          })
          return { opportunities, insights: deriveInsights(opportunities) }
        })
      },

      removeOpportunity: (id) => {
        set((state) => {
          const opportunities = state.opportunities.filter((o) => o.id !== id)
          return { opportunities, insights: deriveInsights(opportunities) }
        })
      },

      setSelectedId: (id) => set({ selectedId: id }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Selectors
      getById: (id) => get().opportunities.find((o) => o.id === id),

      getByCategory: (category) =>
        get()
          .opportunities.filter((o) => o.category === category)
          .sort((a, b) => b.compositeScore - a.compositeScore),

      getByStatus: (status) =>
        get().opportunities.filter((o) => o.status === status),

      getWarmLeads: () =>
        get().opportunities.filter(
          (o) =>
            o.signal.type === "referral" ||
            o.signal.type === "warm" ||
            o.category === "pursue"
        ),
    }),
    { name: "grove-store" }
  )
)
