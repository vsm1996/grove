// ─────────────────────────────────────────────
// GROVE — Zustand Store
// All mutations go through here — never bypass
// ─────────────────────────────────────────────

import { create } from "zustand"
import type {
  Opportunity,
  ScoredOpportunity,
  OpportunityCategory,
  EnergyType,
  SignalStrength,
  OpportunityStatus,
  GroveInsights,
  InsightPattern,
} from "@/types/grove"

// ── Scoring ───────────────────────────────────

const SIGNAL_WEIGHTS: Record<SignalStrength, number> = {
  referral: 1.0,
  warm: 0.75,
  recruiter: 0.5,
  cold: 0.25,
}

const ENERGY_WEIGHTS: Record<EnergyType, number> = {
  expansive: 1.0,
  neutral: 0.5,
  extractive: 0.0,
}

function computeCompositeScore(opp: Opportunity): number {
  const alignmentNorm = opp.alignment.score / 10
  const signalNorm = SIGNAL_WEIGHTS[opp.signal.type]
  const energyNorm = ENERGY_WEIGHTS[opp.energy.type]
  return Math.round((alignmentNorm * 0.5 + signalNorm * 0.3 + energyNorm * 0.2) * 100)
}

function computeCategory(opp: Opportunity): OpportunityCategory {
  const hasStrongSignal = opp.signal.type === "referral" || opp.signal.type === "warm"
  const isExtractive = opp.energy.type === "extractive"
  const highAlignment = opp.alignment.score >= 7

  if (highAlignment && hasStrongSignal) return "pursue"
  if (highAlignment && !isExtractive) return "worth_it"
  if (!highAlignment && hasStrongSignal) return "mercenary"
  return "experimental"
}

function scoreOpportunity(opp: Opportunity): ScoredOpportunity {
  return {
    ...opp,
    compositeScore: computeCompositeScore(opp),
    category: computeCategory(opp),
  }
}

// ── Insights Computation ──────────────────────

function computeInsights(opportunities: ScoredOpportunity[]): GroveInsights {
  const total = opportunities.length

  const byStatus = {} as Record<OpportunityStatus, number>
  const allStatuses: OpportunityStatus[] = ["saved", "applied", "interviewing", "offer", "rejected", "archived"]
  for (const s of allStatuses) byStatus[s] = 0

  const byCategory = {} as Record<OpportunityCategory, number>
  const allCategories: OpportunityCategory[] = ["pursue", "worth_it", "mercenary", "experimental"]
  for (const c of allCategories) byCategory[c] = 0

  let totalAlignment = 0
  const energyCounts: Record<EnergyType, number> = { expansive: 0, neutral: 0, extractive: 0 }
  const positioningGaps: string[] = []

  for (const opp of opportunities) {
    byStatus[opp.status] = (byStatus[opp.status] || 0) + 1
    byCategory[opp.category] = (byCategory[opp.category] || 0) + 1
    totalAlignment += opp.alignment.score
    energyCounts[opp.energy.type]++
    if (opp.positioning.skillGap) positioningGaps.push(opp.positioning.skillGap)
  }

  const avgAlignmentScore = total > 0 ? Math.round((totalAlignment / total) * 10) / 10 : 0

  let dominantEnergyType: EnergyType = "neutral"
  if (energyCounts.expansive >= energyCounts.neutral && energyCounts.expansive >= energyCounts.extractive) {
    dominantEnergyType = "expansive"
  } else if (energyCounts.extractive > energyCounts.expansive && energyCounts.extractive > energyCounts.neutral) {
    dominantEnergyType = "extractive"
  }

  const patterns: InsightPattern[] = []

  if (total >= 3 && energyCounts.extractive / total >= 0.5) {
    patterns.push({
      label: "High extractive load",
      description: "Over half your pipeline feels draining. This compounds job search fatigue.",
      count: energyCounts.extractive,
      severity: "critical",
    })
  }

  if (total >= 5 && byCategory.experimental / total >= 0.6) {
    patterns.push({
      label: "Mostly experimental",
      description: "Most opportunities are low-alignment stretches. Consider narrowing focus.",
      count: byCategory.experimental,
      severity: "warning",
    })
  }

  if (total >= 3 && byCategory.pursue >= 3) {
    patterns.push({
      label: "Strong pursuit pipeline",
      description: "You have multiple high-alignment, warm-signal opportunities. Prioritize these.",
      count: byCategory.pursue,
      severity: "info",
    })
  }

  if (byStatus.interviewing >= 3) {
    patterns.push({
      label: "High interview volume",
      description: "You're in multiple active interview loops. Protect your energy.",
      count: byStatus.interviewing,
      severity: "warning",
    })
  }

  const topPositioningGaps = [...new Set(positioningGaps)].slice(0, 5)

  return {
    totalOpportunities: total,
    byStatus,
    byCategory,
    avgAlignmentScore,
    dominantEnergyType,
    patterns,
    topPositioningGaps,
  }
}

// ── Store ─────────────────────────────────────

interface GroveStore {
  opportunities: ScoredOpportunity[]
  insights: GroveInsights
  isLoading: boolean
  error: string | null

  setOpportunities: (opps: Opportunity[]) => void
  addOpportunity: (opp: Opportunity) => void
  updateOpportunity: (opp: Opportunity) => void
  removeOpportunity: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const DEFAULT_INSIGHTS: GroveInsights = {
  totalOpportunities: 0,
  byStatus: { saved: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0, archived: 0 },
  byCategory: { pursue: 0, worth_it: 0, mercenary: 0, experimental: 0 },
  avgAlignmentScore: 0,
  dominantEnergyType: "neutral",
  patterns: [],
  topPositioningGaps: [],
}

export const useGroveStore = create<GroveStore>((set, get) => ({
  opportunities: [],
  insights: DEFAULT_INSIGHTS,
  isLoading: false,
  error: null,

  setOpportunities: (opps) => {
    const scored = opps.map(scoreOpportunity)
    set({ opportunities: scored, insights: computeInsights(scored) })
  },

  addOpportunity: (opp) => {
    const scored = scoreOpportunity(opp)
    const opportunities = [scored, ...get().opportunities]
    set({ opportunities, insights: computeInsights(opportunities) })
  },

  updateOpportunity: (opp) => {
    const scored = scoreOpportunity(opp)
    const opportunities = get().opportunities.map((o) => (o.id === opp.id ? scored : o))
    set({ opportunities, insights: computeInsights(opportunities) })
  },

  removeOpportunity: (id) => {
    const opportunities = get().opportunities.filter((o) => o.id !== id)
    set({ opportunities, insights: computeInsights(opportunities) })
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
