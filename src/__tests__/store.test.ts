import { describe, it, expect, beforeEach } from "vitest"
import { useGroveStore } from "@/store/grove"
import type { Opportunity, GroveInsights } from "@/types/grove"

// ── Fixtures ──────────────────────────────────

const BASE_OPP: Opportunity = {
  id: "opp-1",
  userId: "user-1",
  company: "Acme",
  role: "Engineer",
  status: "applied",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  alignment: { score: 8 },
  energy: { type: "expansive", intensity: 8 },
  signal: { type: "warm" },
  positioning: {},
  reflections: [],
}

const EMPTY_INSIGHTS: GroveInsights = {
  totalOpportunities: 0,
  byStatus: { saved: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0, archived: 0 },
  byCategory: { pursue: 0, worth_it: 0, mercenary: 0, experimental: 0 },
  avgAlignmentScore: 0,
  dominantEnergyType: "neutral",
  patterns: [],
  topPositioningGaps: [],
}

beforeEach(() => {
  useGroveStore.setState({
    opportunities: [],
    insights: EMPTY_INSIGHTS,
    isLoading: false,
    error: null,
  })
})

// ── Composite Score Formula ───────────────────

describe("composite score formula", () => {
  it("computes correctly: alignment=8, signal=warm(0.75), energy=expansive(1.0)", () => {
    // (8/10 * 0.5 + 0.75 * 0.3 + 1.0 * 0.2) * 100 = (0.4 + 0.225 + 0.2) * 100 = 82.5 → 83
    useGroveStore.getState().setOpportunities([BASE_OPP])
    const [opp] = useGroveStore.getState().opportunities
    expect(opp.compositeScore).toBe(83)
  })

  it("max score: alignment=10, signal=referral(1.0), energy=expansive(1.0)", () => {
    // (1.0 * 0.5 + 1.0 * 0.3 + 1.0 * 0.2) * 100 = 100
    const opp = { ...BASE_OPP, alignment: { score: 10 }, signal: { type: "referral" as const } }
    useGroveStore.getState().setOpportunities([opp])
    expect(useGroveStore.getState().opportunities[0].compositeScore).toBe(100)
  })

  it("min score: alignment=0, signal=cold(0.25), energy=extractive(0.0)", () => {
    // (0 * 0.5 + 0.25 * 0.3 + 0 * 0.2) * 100 = 7.5 → 8
    const opp = {
      ...BASE_OPP,
      alignment: { score: 0 },
      signal: { type: "cold" as const },
      energy: { type: "extractive" as const, intensity: 0 },
    }
    useGroveStore.getState().setOpportunities([opp])
    expect(useGroveStore.getState().opportunities[0].compositeScore).toBe(8)
  })

  it("middle score: alignment=5, signal=recruiter(0.5), energy=neutral(0.5)", () => {
    // (0.5 * 0.5 + 0.5 * 0.3 + 0.5 * 0.2) * 100 = 50
    const opp = {
      ...BASE_OPP,
      alignment: { score: 5 },
      signal: { type: "recruiter" as const },
      energy: { type: "neutral" as const, intensity: 5 },
    }
    useGroveStore.getState().setOpportunities([opp])
    expect(useGroveStore.getState().opportunities[0].compositeScore).toBe(50)
  })
})

// ── Category Derivation ───────────────────────

describe("category derivation", () => {
  it("pursue: alignment >= 7 AND strong signal (referral/warm)", () => {
    const opp = { ...BASE_OPP, alignment: { score: 7 }, signal: { type: "referral" as const } }
    useGroveStore.getState().setOpportunities([opp])
    expect(useGroveStore.getState().opportunities[0].category).toBe("pursue")
  })

  it("pursue: warm signal also qualifies", () => {
    const opp = { ...BASE_OPP, alignment: { score: 8 }, signal: { type: "warm" as const } }
    useGroveStore.getState().setOpportunities([opp])
    expect(useGroveStore.getState().opportunities[0].category).toBe("pursue")
  })

  it("worth_it: alignment >= 7 AND not extractive AND weak signal", () => {
    const opp = {
      ...BASE_OPP,
      alignment: { score: 8 },
      signal: { type: "cold" as const },
      energy: { type: "neutral" as const, intensity: 5 },
    }
    useGroveStore.getState().setOpportunities([opp])
    expect(useGroveStore.getState().opportunities[0].category).toBe("worth_it")
  })

  it("worth_it: alignment >= 7 AND weak signal AND recruiter", () => {
    const opp = {
      ...BASE_OPP,
      alignment: { score: 9 },
      signal: { type: "recruiter" as const },
      energy: { type: "expansive" as const, intensity: 8 },
    }
    useGroveStore.getState().setOpportunities([opp])
    expect(useGroveStore.getState().opportunities[0].category).toBe("worth_it")
  })

  it("mercenary: alignment < 7 AND strong signal", () => {
    const opp = {
      ...BASE_OPP,
      alignment: { score: 4 },
      signal: { type: "referral" as const },
    }
    useGroveStore.getState().setOpportunities([opp])
    expect(useGroveStore.getState().opportunities[0].category).toBe("mercenary")
  })

  it("experimental: low alignment AND weak signal", () => {
    const opp = {
      ...BASE_OPP,
      alignment: { score: 3 },
      signal: { type: "cold" as const },
    }
    useGroveStore.getState().setOpportunities([opp])
    expect(useGroveStore.getState().opportunities[0].category).toBe("experimental")
  })

  it("experimental: high alignment extractive energy with cold signal", () => {
    // alignment >= 7, but extractive = not worth_it; also no strong signal = not pursue
    // → experimental? No — high align + extractive + cold → worth_it is blocked by extractive, strong signal blocked by cold → experimental
    const opp = {
      ...BASE_OPP,
      alignment: { score: 8 },
      signal: { type: "cold" as const },
      energy: { type: "extractive" as const, intensity: 5 },
    }
    useGroveStore.getState().setOpportunities([opp])
    // Not pursue (no strong signal), not worth_it (is extractive), not mercenary (no strong signal)
    // → experimental
    expect(useGroveStore.getState().opportunities[0].category).toBe("experimental")
  })
})

// ── Store Mutations ───────────────────────────

describe("setOpportunities", () => {
  it("scores all opportunities and sets them in order", () => {
    const opps = [
      { ...BASE_OPP, id: "1" },
      { ...BASE_OPP, id: "2" },
    ]
    useGroveStore.getState().setOpportunities(opps)
    const state = useGroveStore.getState()
    expect(state.opportunities).toHaveLength(2)
    expect(state.opportunities[0].compositeScore).toBeGreaterThan(0)
  })

  it("recomputes insights", () => {
    useGroveStore.getState().setOpportunities([BASE_OPP])
    const { insights } = useGroveStore.getState()
    expect(insights.totalOpportunities).toBe(1)
    expect(insights.byStatus.applied).toBe(1)
  })
})

describe("addOpportunity", () => {
  it("prepends the new opportunity", () => {
    const existing = { ...BASE_OPP, id: "1" }
    const incoming = { ...BASE_OPP, id: "2" }
    useGroveStore.getState().setOpportunities([existing])
    useGroveStore.getState().addOpportunity(incoming)
    const { opportunities } = useGroveStore.getState()
    expect(opportunities[0].id).toBe("2")
    expect(opportunities[1].id).toBe("1")
  })

  it("recomputes insights after add", () => {
    useGroveStore.getState().addOpportunity(BASE_OPP)
    expect(useGroveStore.getState().insights.totalOpportunities).toBe(1)
  })
})

describe("updateOpportunity", () => {
  it("replaces the matching opportunity by id", () => {
    useGroveStore.getState().setOpportunities([BASE_OPP])
    const updated = { ...BASE_OPP, company: "NewCorp" }
    useGroveStore.getState().updateOpportunity(updated)
    expect(useGroveStore.getState().opportunities[0].company).toBe("NewCorp")
    expect(useGroveStore.getState().opportunities).toHaveLength(1)
  })

  it("rescores the updated opportunity", () => {
    useGroveStore.getState().setOpportunities([BASE_OPP])
    const updated = {
      ...BASE_OPP,
      alignment: { score: 2 },
      signal: { type: "cold" as const },
      energy: { type: "extractive" as const, intensity: 1 },
    }
    useGroveStore.getState().updateOpportunity(updated)
    const opp = useGroveStore.getState().opportunities[0]
    expect(opp.category).toBe("experimental")
  })
})

describe("removeOpportunity", () => {
  it("removes by id", () => {
    const a = { ...BASE_OPP, id: "a" }
    const b = { ...BASE_OPP, id: "b" }
    useGroveStore.getState().setOpportunities([a, b])
    useGroveStore.getState().removeOpportunity("a")
    const { opportunities } = useGroveStore.getState()
    expect(opportunities).toHaveLength(1)
    expect(opportunities[0].id).toBe("b")
  })

  it("recomputes insights after remove", () => {
    useGroveStore.getState().setOpportunities([BASE_OPP])
    useGroveStore.getState().removeOpportunity("opp-1")
    expect(useGroveStore.getState().insights.totalOpportunities).toBe(0)
  })
})

describe("setLoading / setError", () => {
  it("sets loading state", () => {
    useGroveStore.getState().setLoading(true)
    expect(useGroveStore.getState().isLoading).toBe(true)
    useGroveStore.getState().setLoading(false)
    expect(useGroveStore.getState().isLoading).toBe(false)
  })

  it("sets and clears error", () => {
    useGroveStore.getState().setError("Something broke")
    expect(useGroveStore.getState().error).toBe("Something broke")
    useGroveStore.getState().setError(null)
    expect(useGroveStore.getState().error).toBeNull()
  })
})

// ── Insights Computation ──────────────────────

describe("insights: avgAlignmentScore", () => {
  it("averages alignment across all opportunities", () => {
    const opps = [
      { ...BASE_OPP, id: "1", alignment: { score: 6 } },
      { ...BASE_OPP, id: "2", alignment: { score: 8 } },
      { ...BASE_OPP, id: "3", alignment: { score: 10 } },
    ]
    useGroveStore.getState().setOpportunities(opps)
    expect(useGroveStore.getState().insights.avgAlignmentScore).toBe(8)
  })

  it("is 0 when there are no opportunities", () => {
    expect(useGroveStore.getState().insights.avgAlignmentScore).toBe(0)
  })
})

describe("insights: dominantEnergyType", () => {
  it("is expansive when expansive count is highest", () => {
    const opps = [
      { ...BASE_OPP, id: "1", energy: { type: "expansive" as const, intensity: 8 } },
      { ...BASE_OPP, id: "2", energy: { type: "expansive" as const, intensity: 8 } },
      { ...BASE_OPP, id: "3", energy: { type: "extractive" as const, intensity: 3 } },
    ]
    useGroveStore.getState().setOpportunities(opps)
    expect(useGroveStore.getState().insights.dominantEnergyType).toBe("expansive")
  })

  it("is extractive when extractive count is strictly highest", () => {
    const opps = [
      { ...BASE_OPP, id: "1", energy: { type: "extractive" as const, intensity: 2 } },
      { ...BASE_OPP, id: "2", energy: { type: "extractive" as const, intensity: 2 } },
      { ...BASE_OPP, id: "3", energy: { type: "neutral" as const, intensity: 5 } },
    ]
    useGroveStore.getState().setOpportunities(opps)
    expect(useGroveStore.getState().insights.dominantEnergyType).toBe("extractive")
  })

  it("defaults to neutral when tied or all neutral", () => {
    const opps = [
      { ...BASE_OPP, id: "1", energy: { type: "neutral" as const, intensity: 5 } },
      { ...BASE_OPP, id: "2", energy: { type: "neutral" as const, intensity: 5 } },
    ]
    useGroveStore.getState().setOpportunities(opps)
    expect(useGroveStore.getState().insights.dominantEnergyType).toBe("neutral")
  })
})

describe("insights: topPositioningGaps", () => {
  it("collects unique skill gaps up to 5", () => {
    const opps = [
      { ...BASE_OPP, id: "1", positioning: { skillGap: "Leadership" } },
      { ...BASE_OPP, id: "2", positioning: { skillGap: "TypeScript" } },
      { ...BASE_OPP, id: "3", positioning: { skillGap: "Leadership" } }, // duplicate
    ]
    useGroveStore.getState().setOpportunities(opps)
    const { topPositioningGaps } = useGroveStore.getState().insights
    expect(topPositioningGaps).toEqual(["Leadership", "TypeScript"])
  })
})

describe("insights: patterns", () => {
  it("flags 'High extractive load' when 50%+ of pipeline is extractive (min 3)", () => {
    const extractive = { type: "extractive" as const, intensity: 2 }
    const opps = [
      { ...BASE_OPP, id: "1", energy: extractive },
      { ...BASE_OPP, id: "2", energy: extractive },
      { ...BASE_OPP, id: "3", energy: { type: "expansive" as const, intensity: 8 } },
    ]
    useGroveStore.getState().setOpportunities(opps)
    const { patterns } = useGroveStore.getState().insights
    expect(patterns.some((p) => p.label === "High extractive load")).toBe(true)
    expect(patterns.find((p) => p.label === "High extractive load")?.severity).toBe("critical")
  })

  it("does not flag extractive load with fewer than 3 opportunities", () => {
    const opps = [
      { ...BASE_OPP, id: "1", energy: { type: "extractive" as const, intensity: 2 } },
      { ...BASE_OPP, id: "2", energy: { type: "extractive" as const, intensity: 2 } },
    ]
    useGroveStore.getState().setOpportunities(opps)
    expect(useGroveStore.getState().insights.patterns.some((p) => p.label === "High extractive load")).toBe(false)
  })

  it("flags 'Mostly experimental' when 60%+ are experimental (min 5)", () => {
    const lowAlignCold = {
      alignment: { score: 2 },
      signal: { type: "cold" as const },
      energy: { type: "neutral" as const, intensity: 5 },
    }
    const opps = Array.from({ length: 5 }, (_, i) => ({
      ...BASE_OPP,
      ...lowAlignCold,
      id: String(i),
    }))
    useGroveStore.getState().setOpportunities(opps)
    const { patterns } = useGroveStore.getState().insights
    expect(patterns.some((p) => p.label === "Mostly experimental")).toBe(true)
    expect(patterns.find((p) => p.label === "Mostly experimental")?.severity).toBe("warning")
  })

  it("flags 'Strong pursuit pipeline' when pursue count >= 3", () => {
    const highPursuit = {
      alignment: { score: 8 },
      signal: { type: "referral" as const },
    }
    const opps = Array.from({ length: 3 }, (_, i) => ({
      ...BASE_OPP,
      ...highPursuit,
      id: String(i),
    }))
    useGroveStore.getState().setOpportunities(opps)
    const { patterns } = useGroveStore.getState().insights
    expect(patterns.some((p) => p.label === "Strong pursuit pipeline")).toBe(true)
    expect(patterns.find((p) => p.label === "Strong pursuit pipeline")?.severity).toBe("info")
  })

  it("flags 'High interview volume' when interviewing >= 3", () => {
    const opps = Array.from({ length: 3 }, (_, i) => ({
      ...BASE_OPP,
      id: String(i),
      status: "interviewing" as const,
    }))
    useGroveStore.getState().setOpportunities(opps)
    const { patterns } = useGroveStore.getState().insights
    expect(patterns.some((p) => p.label === "High interview volume")).toBe(true)
    expect(patterns.find((p) => p.label === "High interview volume")?.severity).toBe("warning")
  })

  it("emits no patterns for a healthy, small pipeline", () => {
    useGroveStore.getState().setOpportunities([BASE_OPP])
    expect(useGroveStore.getState().insights.patterns).toHaveLength(0)
  })
})
