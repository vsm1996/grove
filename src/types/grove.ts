// ─────────────────────────────────────────────
// GROVE — Core Types
// Career intelligence system built on Harmonia
// ─────────────────────────────────────────────

// ── Enums ─────────────────────────────────────

export type OpportunityStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "archived"

export type EnergyType =
  | "expansive"   // Energizes, excites, pulls forward
  | "neutral"     // Neither draining nor energizing
  | "extractive"  // Draining, heavy, transactional

export type SignalStrength =
  | "cold"        // No connection, blind apply
  | "recruiter"   // Inbound recruiter outreach
  | "warm"        // Mutual connection, community tie
  | "referral"    // Direct referral from insider

export type ReflectionSentiment =
  | "expanded"    // Came out energized, excited
  | "neutral"     // Fine, neither good nor bad
  | "drained"     // Left feeling depleted

// ── Scoring Dimensions ────────────────────────

export interface AlignmentScore {
  /** 0–10: Systems influence, autonomy, trajectory, vision fit */
  score: number
  /** Optional narrative: why this role aligns or doesn't */
  notes?: string
}

export interface EnergyScore {
  type: EnergyType
  /** 0–10: Intensity of the energy response */
  intensity: number
}

export interface SignalScore {
  type: SignalStrength
  /** e.g. "Referred by Jamie at Vercel" */
  notes?: string
}

export interface PositioningGap {
  /** The narrative angle to lead with for this role */
  narrativeAngle?: string
  /** What proof artifact is missing or needed */
  proofArtifact?: string
  /** Skill or domain gap to address */
  skillGap?: string
}

// ── Post-Interview Reflection ─────────────────

export interface InterviewReflection {
  id?: string // DB row id — present after save
  sentiment: ReflectionSentiment
  /** Did the interviewer actively listen? */
  theyListened: boolean
  /** Did they challenge you in a meaningful way? */
  meaningfulChallenge: boolean
  /** Did they respect your time and boundaries? */
  respectfulEngagement: boolean
  /** Free-form debrief notes */
  notes?: string
  reflectedAt: string // ISO timestamp
}

// ── Follow-Up ─────────────────────────────────

export interface FollowUp {
  /** What action needs to happen next */
  action: string
  /** ISO date string */
  dueDate?: string
  completed: boolean
}

// ── Core Opportunity ──────────────────────────

export interface Opportunity {
  id: string
  userId: string

  // Identity
  company: string
  role: string
  url?: string
  createdAt: string   // ISO timestamp
  updatedAt: string   // ISO timestamp

  // Status
  status: OpportunityStatus

  // Scoring Dimensions
  alignment: AlignmentScore
  energy: EnergyScore
  signal: SignalScore
  positioning: PositioningGap

  // Application Context
  resumeVersion?: string
  jobDescriptionNotes?: string

  // Reflection (post-interview)
  reflections: InterviewReflection[]

  // Follow-Up
  followUp?: FollowUp
}

// ── Derived / Computed ────────────────────────

/**
 * Composite score for sorting and categorization.
 * Weighted: Alignment 50%, Signal 30%, Energy 20%
 */
export type OpportunityCategory =
  | "pursue"        // High alignment + strong signal
  | "worth_it"      // High alignment, lower signal or extractive energy
  | "mercenary"     // Low alignment, strong signal or $$$
  | "experimental"  // Low alignment, low signal — stretch / wildcard

export interface ScoredOpportunity extends Opportunity {
  compositeScore: number
  category: OpportunityCategory
}

// ── Forms ─────────────────────────────────────

export type NewOpportunityInput = Omit<
  Opportunity,
  "id" | "userId" | "createdAt" | "updatedAt" | "reflections"
>

export type UpdateOpportunityInput = Partial<NewOpportunityInput>

// ── Insights ──────────────────────────────────

export interface InsightPattern {
  label: string
  description: string
  /** Number of opportunities this pattern applies to */
  count: number
  severity: "info" | "warning" | "critical"
}

export interface GroveInsights {
  totalOpportunities: number
  byStatus: Record<OpportunityStatus, number>
  byCategory: Record<OpportunityCategory, number>
  avgAlignmentScore: number
  dominantEnergyType: EnergyType
  patterns: InsightPattern[]
  topPositioningGaps: string[]
}
