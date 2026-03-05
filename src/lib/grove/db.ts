// ─────────────────────────────────────────────
// GROVE — Supabase Data Layer
// All DB reads/writes go through here
// ─────────────────────────────────────────────

import { createBrowserClient } from "@supabase/ssr"
import type {
  Opportunity,
  NewOpportunityInput,
  UpdateOpportunityInput,
  InterviewReflection,
} from "@/types/grove"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export { supabase }

// ── Type Mapping ──────────────────────────────
// Supabase returns snake_case; Grove uses camelCase

function rowToOpportunity(row: Record<string, unknown>): Opportunity {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    company: row.company as string,
    role: row.role as string,
    url: row.url as string | undefined,
    status: row.status as Opportunity["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,

    alignment: {
      score: row.alignment_score as number,
      notes: row.alignment_notes as string | undefined,
    },

    energy: {
      type: row.energy_type as Opportunity["energy"]["type"],
      intensity: row.energy_intensity as number,
    },

    signal: {
      type: row.signal_type as Opportunity["signal"]["type"],
      notes: row.signal_notes as string | undefined,
    },

    positioning: {
      narrativeAngle: row.narrative_angle as string | undefined,
      proofArtifact: row.proof_artifact as string | undefined,
      skillGap: row.skill_gap as string | undefined,
    },

    resumeVersion: row.resume_version as string | undefined,
    jobDescriptionNotes: row.jd_notes as string | undefined,

    followUp: row.followup_action
      ? {
        action: row.followup_action as string,
        dueDate: row.followup_due_date as string | undefined,
        completed: row.followup_completed as boolean,
      }
      : undefined,

    // Reflections loaded separately
    reflections: (row.reflections as InterviewReflection[]) ?? [],
  }
}

function opportunityToRow(input: NewOpportunityInput) {
  return {
    company: input.company,
    role: input.role,
    url: input.url,
    status: input.status,

    alignment_score: input.alignment.score,
    alignment_notes: input.alignment.notes,

    energy_type: input.energy.type,
    energy_intensity: input.energy.intensity,

    signal_type: input.signal.type,
    signal_notes: input.signal.notes,

    narrative_angle: input.positioning.narrativeAngle,
    proof_artifact: input.positioning.proofArtifact,
    skill_gap: input.positioning.skillGap,

    resume_version: input.resumeVersion,
    jd_notes: input.jobDescriptionNotes,

    followup_action: input.followUp?.action,
    followup_due_date: input.followUp?.dueDate,
    followup_completed: input.followUp?.completed ?? false,
  }
}

// ── Opportunities ─────────────────────────────

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*, reflections(*)")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToOpportunity)
}

export async function fetchOpportunityById(id: string): Promise<Opportunity> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*, reflections(*)")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return rowToOpportunity(data)
}

export async function createOpportunity(
  input: NewOpportunityInput
): Promise<Opportunity> {
  const { data, error } = await supabase
    .from("opportunities")
    .insert(opportunityToRow(input))
    .select("*, reflections(*)")
    .single()

  if (error) throw new Error(error.message)
  return rowToOpportunity(data)
}

export async function updateOpportunity(
  id: string,
  input: UpdateOpportunityInput
): Promise<Opportunity> {
  const row: Record<string, unknown> = {}

  if (input.company !== undefined) row.company = input.company
  if (input.role !== undefined) row.role = input.role
  if (input.url !== undefined) row.url = input.url
  if (input.status !== undefined) row.status = input.status
  if (input.alignment !== undefined) {
    row.alignment_score = input.alignment.score
    row.alignment_notes = input.alignment.notes
  }
  if (input.energy !== undefined) {
    row.energy_type = input.energy.type
    row.energy_intensity = input.energy.intensity
  }
  if (input.signal !== undefined) {
    row.signal_type = input.signal.type
    row.signal_notes = input.signal.notes
  }
  if (input.positioning !== undefined) {
    row.narrative_angle = input.positioning.narrativeAngle
    row.proof_artifact = input.positioning.proofArtifact
    row.skill_gap = input.positioning.skillGap
  }
  if (input.resumeVersion !== undefined) row.resume_version = input.resumeVersion
  if (input.jobDescriptionNotes !== undefined) row.jd_notes = input.jobDescriptionNotes
  if (input.followUp !== undefined) {
    row.followup_action = input.followUp.action
    row.followup_due_date = input.followUp.dueDate
    row.followup_completed = input.followUp.completed
  }

  const { data, error } = await supabase
    .from("opportunities")
    .update(row)
    .eq("id", id)
    .select("*, reflections(*)")
    .single()

  if (error) throw new Error(error.message)
  return rowToOpportunity(data)
}

export async function deleteOpportunity(id: string): Promise<void> {
  const { error } = await supabase.from("opportunities").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// ── Reflections ───────────────────────────────

export async function addReflection(
  opportunityId: string,
  reflection: Omit<InterviewReflection, "reflectedAt">
): Promise<InterviewReflection> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("reflections")
    .insert({
      opportunity_id: opportunityId,
      user_id: user.id,
      sentiment: reflection.sentiment,
      they_listened: reflection.theyListened,
      meaningful_challenge: reflection.meaningfulChallenge,
      respectful_engagement: reflection.respectfulEngagement,
      notes: reflection.notes,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return {
    sentiment: data.sentiment,
    theyListened: data.they_listened,
    meaningfulChallenge: data.meaningful_challenge,
    respectfulEngagement: data.respectful_engagement,
    notes: data.notes,
    reflectedAt: data.reflected_at,
  }
}

// ── Auth ──────────────────────────────────────

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  return data.session
}
