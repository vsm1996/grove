/**
 * DB layer tests — Supabase client is mocked.
 *
 * For true integration tests against a live Supabase project, set:
 *   TEST_SUPABASE_URL=<test-project-url>
 *   TEST_SUPABASE_ANON_KEY=<test-project-anon-key>
 * and swap the mock below for a real client configured from those env vars.
 */

import { describe, it, expect, beforeEach, vi } from "vitest"

// ── Mock Supabase client ───────────────────────
// vi.hoisted ensures these are available before any imports are resolved.

const { chain, mockFrom, mockGetUser } = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  return { chain, mockFrom, mockGetUser }
})

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}))

// Import AFTER mock is registered
import {
  fetchOpportunities,
  fetchOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  addReflection,
} from "@/lib/grove/db"
import type { NewOpportunityInput } from "@/types/grove"

// ── Fixtures ──────────────────────────────────

const mockRow = {
  id: "opp-1",
  user_id: "user-1",
  company: "Acme Corp",
  role: "Senior Engineer",
  url: "https://example.com/job",
  status: "applied",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  alignment_score: 8,
  alignment_notes: "Great fit",
  energy_type: "expansive",
  energy_intensity: 8,
  signal_type: "warm",
  signal_notes: "Via LinkedIn",
  narrative_angle: undefined,
  proof_artifact: undefined,
  skill_gap: "Leadership",
  resume_version: "v2",
  jd_notes: "Needs systems thinking",
  followup_action: "Send thank you",
  followup_due_date: "2024-01-10",
  followup_completed: false,
  reflections: [],
}

const newInput: NewOpportunityInput = {
  company: "Acme Corp",
  role: "Senior Engineer",
  url: "https://example.com/job",
  status: "applied",
  alignment: { score: 8, notes: "Great fit" },
  energy: { type: "expansive", intensity: 8 },
  signal: { type: "warm", notes: "Via LinkedIn" },
  positioning: { skillGap: "Leadership" },
  resumeVersion: "v2",
  jobDescriptionNotes: "Needs systems thinking",
  followUp: { action: "Send thank you", dueDate: "2024-01-10", completed: false },
}

beforeEach(() => {
  vi.clearAllMocks()
  // Make all chain methods return the chain itself (chainable)
  Object.values(chain).forEach((fn) => fn.mockReturnValue(chain))
  mockFrom.mockReturnValue(chain)
})

// ── fetchOpportunities ────────────────────────

describe("fetchOpportunities", () => {
  it("queries opportunities with reflections, ordered by created_at desc", async () => {
    chain.order.mockResolvedValueOnce({ data: [mockRow], error: null })

    await fetchOpportunities()

    expect(mockFrom).toHaveBeenCalledWith("opportunities")
    expect(chain.select).toHaveBeenCalledWith("*, reflections(*)")
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false })
  })

  it("maps snake_case row to camelCase Opportunity", async () => {
    chain.order.mockResolvedValueOnce({ data: [mockRow], error: null })

    const results = await fetchOpportunities()

    expect(results).toHaveLength(1)
    const opp = results[0]
    expect(opp.id).toBe("opp-1")
    expect(opp.userId).toBe("user-1")
    expect(opp.company).toBe("Acme Corp")
    expect(opp.role).toBe("Senior Engineer")
    expect(opp.createdAt).toBe("2024-01-01T00:00:00Z")
    expect(opp.updatedAt).toBe("2024-01-02T00:00:00Z")
    expect(opp.alignment).toEqual({ score: 8, notes: "Great fit" })
    expect(opp.energy).toEqual({ type: "expansive", intensity: 8 })
    expect(opp.signal).toEqual({ type: "warm", notes: "Via LinkedIn" })
    expect(opp.positioning.skillGap).toBe("Leadership")
    expect(opp.resumeVersion).toBe("v2")
    expect(opp.jobDescriptionNotes).toBe("Needs systems thinking")
    expect(opp.followUp).toEqual({
      action: "Send thank you",
      dueDate: "2024-01-10",
      completed: false,
    })
    expect(opp.reflections).toEqual([])
  })

  it("returns empty array when data is null", async () => {
    chain.order.mockResolvedValueOnce({ data: null, error: null })
    const results = await fetchOpportunities()
    expect(results).toEqual([])
  })

  it("throws on Supabase error", async () => {
    chain.order.mockResolvedValueOnce({ data: null, error: { message: "DB connection failed" } })
    await expect(fetchOpportunities()).rejects.toThrow("DB connection failed")
  })
})

// ── fetchOpportunityById ──────────────────────

describe("fetchOpportunityById", () => {
  it("queries by id and returns single mapped Opportunity", async () => {
    chain.single.mockResolvedValueOnce({ data: mockRow, error: null })

    const result = await fetchOpportunityById("opp-1")

    expect(mockFrom).toHaveBeenCalledWith("opportunities")
    expect(chain.select).toHaveBeenCalledWith("*, reflections(*)")
    expect(chain.eq).toHaveBeenCalledWith("id", "opp-1")
    expect(chain.single).toHaveBeenCalled()
    expect(result.id).toBe("opp-1")
  })

  it("throws on error", async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } })
    await expect(fetchOpportunityById("bad-id")).rejects.toThrow("Not found")
  })
})

// ── createOpportunity ─────────────────────────

describe("createOpportunity", () => {
  it("inserts a mapped row and returns the created Opportunity", async () => {
    chain.single.mockResolvedValueOnce({ data: mockRow, error: null })

    const result = await createOpportunity(newInput)

    expect(mockFrom).toHaveBeenCalledWith("opportunities")
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        company: "Acme Corp",
        role: "Senior Engineer",
        alignment_score: 8,
        alignment_notes: "Great fit",
        energy_type: "expansive",
        energy_intensity: 8,
        signal_type: "warm",
        signal_notes: "Via LinkedIn",
        skill_gap: "Leadership",
        resume_version: "v2",
        jd_notes: "Needs systems thinking",
        followup_action: "Send thank you",
        followup_due_date: "2024-01-10",
        followup_completed: false,
      })
    )
    expect(result.id).toBe("opp-1")
    expect(result.company).toBe("Acme Corp")
  })

  it("throws on insert error", async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: "Insert failed" } })
    await expect(createOpportunity(newInput)).rejects.toThrow("Insert failed")
  })
})

// ── updateOpportunity ─────────────────────────

describe("updateOpportunity", () => {
  it("sends only provided fields", async () => {
    chain.single.mockResolvedValueOnce({ data: mockRow, error: null })

    await updateOpportunity("opp-1", { status: "interviewing" })

    expect(chain.update).toHaveBeenCalledWith({ status: "interviewing" })
    expect(chain.eq).toHaveBeenCalledWith("id", "opp-1")
  })

  it("maps alignment fields when provided", async () => {
    chain.single.mockResolvedValueOnce({ data: mockRow, error: null })

    await updateOpportunity("opp-1", {
      alignment: { score: 9, notes: "Even better fit" },
    })

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        alignment_score: 9,
        alignment_notes: "Even better fit",
      })
    )
  })

  it("maps energy fields when provided", async () => {
    chain.single.mockResolvedValueOnce({ data: mockRow, error: null })

    await updateOpportunity("opp-1", {
      energy: { type: "extractive", intensity: 2 },
    })

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        energy_type: "extractive",
        energy_intensity: 2,
      })
    )
  })

  it("does not send undefined alignment when not provided", async () => {
    chain.single.mockResolvedValueOnce({ data: mockRow, error: null })

    await updateOpportunity("opp-1", { status: "offer" })

    const updateCall = chain.update.mock.calls[0][0] as Record<string, unknown>
    expect(updateCall).not.toHaveProperty("alignment_score")
    expect(updateCall).not.toHaveProperty("alignment_notes")
  })

  it("throws on update error", async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: "Update failed" } })
    await expect(updateOpportunity("opp-1", { status: "rejected" })).rejects.toThrow("Update failed")
  })
})

// ── deleteOpportunity ─────────────────────────

describe("deleteOpportunity", () => {
  it("deletes by id", async () => {
    chain.eq.mockResolvedValueOnce({ data: null, error: null })

    await deleteOpportunity("opp-1")

    expect(mockFrom).toHaveBeenCalledWith("opportunities")
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith("id", "opp-1")
  })

  it("throws on delete error", async () => {
    chain.eq.mockResolvedValueOnce({ data: null, error: { message: "Delete failed" } })
    await expect(deleteOpportunity("opp-1")).rejects.toThrow("Delete failed")
  })
})

// ── addReflection ─────────────────────────────

describe("addReflection", () => {
  const reflectionInput = {
    sentiment: "expanded" as const,
    theyListened: true,
    meaningfulChallenge: true,
    respectfulEngagement: true,
    notes: "Great conversation",
  }

  const reflectionRow = {
    sentiment: "expanded",
    they_listened: true,
    meaningful_challenge: true,
    respectful_engagement: true,
    notes: "Great conversation",
    reflected_at: "2024-01-05T00:00:00Z",
  }

  it("inserts with correct field mapping", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })
    chain.single.mockResolvedValueOnce({ data: reflectionRow, error: null })

    await addReflection("opp-1", reflectionInput)

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        opportunity_id: "opp-1",
        user_id: "user-1",
        sentiment: "expanded",
        they_listened: true,
        meaningful_challenge: true,
        respectful_engagement: true,
        notes: "Great conversation",
      })
    )
  })

  it("maps the returned row to camelCase", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })
    chain.single.mockResolvedValueOnce({ data: reflectionRow, error: null })

    const result = await addReflection("opp-1", reflectionInput)

    expect(result.theyListened).toBe(true)
    expect(result.meaningfulChallenge).toBe(true)
    expect(result.respectfulEngagement).toBe(true)
    expect(result.reflectedAt).toBe("2024-01-05T00:00:00Z")
  })

  it("throws when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(addReflection("opp-1", reflectionInput)).rejects.toThrow("Not authenticated")
  })

  it("throws on insert error", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })
    chain.single.mockResolvedValueOnce({ data: null, error: { message: "Reflection insert failed" } })
    await expect(addReflection("opp-1", reflectionInput)).rejects.toThrow("Reflection insert failed")
  })
})
