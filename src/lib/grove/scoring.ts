// ─────────────────────────────────────────────
// GROVE — Scoring Utilities
// Pure functions for score computation
// ─────────────────────────────────────────────

import type {
  Opportunity,
  ScoredOpportunity,
  OpportunityCategory,
  EnergyType,
  SignalStrength,
} from "@/types/grove"

// ── Label Maps ────────────────────────────────

export const ENERGY_LABELS: Record<EnergyType, string> = {
  expansive: "Expansive",
  neutral: "Neutral",
  extractive: "Extractive",
}

export const ENERGY_DESCRIPTIONS: Record<EnergyType, string> = {
  expansive: "Energizes and excites you — pulls you forward",
  neutral: "Neither draining nor energizing",
  extractive: "Draining, heavy, or purely transactional",
}

export const SIGNAL_LABELS: Record<SignalStrength, string> = {
  referral: "Referral",
  warm: "Warm Network",
  recruiter: "Recruiter Outreach",
  cold: "Cold Apply",
}

export const SIGNAL_DESCRIPTIONS: Record<SignalStrength, string> = {
  referral: "Direct referral from someone inside",
  warm: "Mutual connection or community tie",
  recruiter: "Inbound recruiter reached out first",
  cold: "No connection — blind application",
}

export const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  pursue: "Pursue",
  worth_it: "Worth It",
  mercenary: "Mercenary",
  experimental: "Experimental",
}

export const CATEGORY_DESCRIPTIONS: Record<OpportunityCategory, string> = {
  pursue: "High alignment + strong signal — prioritize these",
  worth_it: "Strong fit, even if the path in is harder",
  mercenary: "Strong signal but low alignment — know why you're here",
  experimental: "Low alignment, low signal — stretch or wildcard",
}

export const CATEGORY_COLORS: Record<OpportunityCategory, string> = {
  pursue: "success",
  worth_it: "info",
  mercenary: "warning",
  experimental: "neutral",
}

// ── Alignment Label ───────────────────────────

export function alignmentLabel(score: number): string {
  if (score >= 9) return "Dream role"
  if (score >= 7) return "Strong fit"
  if (score >= 5) return "Solid option"
  if (score >= 3) return "Questionable"
  return "Misaligned"
}

// ── Energy Color ──────────────────────────────

export function energyBadgeColor(type: EnergyType): string {
  return {
    expansive: "success",
    neutral: "neutral",
    extractive: "error",
  }[type]
}

// ── Signal Badge ──────────────────────────────

export function signalBadgeColor(type: SignalStrength): string {
  return {
    referral: "success",
    warm: "info",
    recruiter: "warning",
    cold: "neutral",
  }[type]
}

// ── Composite Score Bar ───────────────────────

export function scoreToPercent(score: number): number {
  return Math.min(100, Math.max(0, score))
}

export function scoreColor(score: number): string {
  if (score >= 75) return "text-success"
  if (score >= 50) return "text-info"
  if (score >= 25) return "text-warning"
  return "text-error"
}

// ── Harmonia Capacity → Grove Filter ─────────

/**
 * Given a Harmonia mode label, returns which opportunity
 * categories Grove should surface in the dashboard.
 *
 * Minimal   → warm leads + pursue only (protective, low noise)
 * Calm      → pursue + worth_it (gentle, manageable)
 * Focused   → all categories, sorted by composite score
 * Exploratory → everything including experimental + insights inline
 */
export function categoriesForMode(
  modeLabel: "Minimal" | "Calm" | "Focused" | "Exploratory"
): OpportunityCategory[] {
  switch (modeLabel) {
    case "Minimal":
      return ["pursue"]
    case "Calm":
      return ["pursue", "worth_it"]
    case "Focused":
      return ["pursue", "worth_it", "mercenary", "experimental"]
    case "Exploratory":
      return ["pursue", "worth_it", "mercenary", "experimental"]
  }
}

/**
 * In Minimal mode, further filter to warm leads only
 * (referral or warm signal type)
 */
export function isWarmLead(opportunity: ScoredOpportunity): boolean {
  return (
    opportunity.signal.type === "referral" ||
    opportunity.signal.type === "warm"
  )
}

/**
 * Density → how many fields to show on an opportunity card
 */
export function cardFieldsForDensity(
  density: "low" | "medium" | "high"
): ("status" | "energy" | "signal" | "score" | "followup" | "gap")[] {
  switch (density) {
    case "low":
      return ["status", "score"]
    case "medium":
      return ["status", "energy", "signal", "score"]
    case "high":
      return ["status", "energy", "signal", "score", "followup", "gap"]
  }
}
