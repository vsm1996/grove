import { describe, it, expect } from "vitest"
import {
  alignmentLabel,
  energyBadgeColor,
  signalBadgeColor,
  scoreToPercent,
  scoreColor,
  categoriesForMode,
  isWarmLead,
  cardFieldsForDensity,
} from "@/lib/grove/scoring"
import type { ScoredOpportunity } from "@/types/grove"

// ── alignmentLabel ────────────────────────────

describe("alignmentLabel", () => {
  it("returns 'Dream role' at 9–10", () => {
    expect(alignmentLabel(9)).toBe("Dream role")
    expect(alignmentLabel(10)).toBe("Dream role")
  })

  it("returns 'Strong fit' at 7–8", () => {
    expect(alignmentLabel(7)).toBe("Strong fit")
    expect(alignmentLabel(8)).toBe("Strong fit")
  })

  it("returns 'Solid option' at 5–6", () => {
    expect(alignmentLabel(5)).toBe("Solid option")
    expect(alignmentLabel(6)).toBe("Solid option")
  })

  it("returns 'Questionable' at 3–4", () => {
    expect(alignmentLabel(3)).toBe("Questionable")
    expect(alignmentLabel(4)).toBe("Questionable")
  })

  it("returns 'Misaligned' below 3", () => {
    expect(alignmentLabel(0)).toBe("Misaligned")
    expect(alignmentLabel(2)).toBe("Misaligned")
  })
})

// ── energyBadgeColor ──────────────────────────

describe("energyBadgeColor", () => {
  it("returns 'success' for expansive", () => {
    expect(energyBadgeColor("expansive")).toBe("success")
  })

  it("returns 'neutral' for neutral", () => {
    expect(energyBadgeColor("neutral")).toBe("neutral")
  })

  it("returns 'error' for extractive", () => {
    expect(energyBadgeColor("extractive")).toBe("error")
  })
})

// ── signalBadgeColor ──────────────────────────

describe("signalBadgeColor", () => {
  it("returns 'success' for referral", () => {
    expect(signalBadgeColor("referral")).toBe("success")
  })

  it("returns 'info' for warm", () => {
    expect(signalBadgeColor("warm")).toBe("info")
  })

  it("returns 'warning' for recruiter", () => {
    expect(signalBadgeColor("recruiter")).toBe("warning")
  })

  it("returns 'neutral' for cold", () => {
    expect(signalBadgeColor("cold")).toBe("neutral")
  })
})

// ── scoreToPercent ────────────────────────────

describe("scoreToPercent", () => {
  it("passes through values in range", () => {
    expect(scoreToPercent(50)).toBe(50)
    expect(scoreToPercent(0)).toBe(0)
    expect(scoreToPercent(100)).toBe(100)
  })

  it("clamps below 0", () => {
    expect(scoreToPercent(-10)).toBe(0)
  })

  it("clamps above 100", () => {
    expect(scoreToPercent(150)).toBe(100)
  })
})

// ── scoreColor ────────────────────────────────

describe("scoreColor", () => {
  it("returns text-success at 75+", () => {
    expect(scoreColor(75)).toBe("text-success")
    expect(scoreColor(100)).toBe("text-success")
  })

  it("returns text-info at 50–74", () => {
    expect(scoreColor(50)).toBe("text-info")
    expect(scoreColor(74)).toBe("text-info")
  })

  it("returns text-warning at 25–49", () => {
    expect(scoreColor(25)).toBe("text-warning")
    expect(scoreColor(49)).toBe("text-warning")
  })

  it("returns text-error below 25", () => {
    expect(scoreColor(0)).toBe("text-error")
    expect(scoreColor(24)).toBe("text-error")
  })
})

// ── categoriesForMode ─────────────────────────

describe("categoriesForMode", () => {
  it("Minimal → pursue only", () => {
    expect(categoriesForMode("Minimal")).toEqual(["pursue"])
  })

  it("Calm → pursue + worth_it", () => {
    expect(categoriesForMode("Calm")).toEqual(["pursue", "worth_it"])
  })

  it("Focused → all four categories", () => {
    expect(categoriesForMode("Focused")).toEqual([
      "pursue",
      "worth_it",
      "mercenary",
      "experimental",
    ])
  })

  it("Exploratory → all four categories", () => {
    expect(categoriesForMode("Exploratory")).toEqual([
      "pursue",
      "worth_it",
      "mercenary",
      "experimental",
    ])
  })
})

// ── isWarmLead ────────────────────────────────

function makeOpp(signalType: ScoredOpportunity["signal"]["type"]): ScoredOpportunity {
  return {
    id: "1",
    userId: "u1",
    company: "Test",
    role: "Role",
    status: "applied",
    createdAt: "",
    updatedAt: "",
    alignment: { score: 8 },
    energy: { type: "expansive", intensity: 7 },
    signal: { type: signalType },
    positioning: {},
    reflections: [],
    compositeScore: 80,
    category: "pursue",
  }
}

describe("isWarmLead", () => {
  it("returns true for referral", () => {
    expect(isWarmLead(makeOpp("referral"))).toBe(true)
  })

  it("returns true for warm", () => {
    expect(isWarmLead(makeOpp("warm"))).toBe(true)
  })

  it("returns false for recruiter", () => {
    expect(isWarmLead(makeOpp("recruiter"))).toBe(false)
  })

  it("returns false for cold", () => {
    expect(isWarmLead(makeOpp("cold"))).toBe(false)
  })
})

// ── cardFieldsForDensity ──────────────────────

describe("cardFieldsForDensity", () => {
  it("low → status + score only", () => {
    expect(cardFieldsForDensity("low")).toEqual(["status", "score"])
  })

  it("medium → status + energy + signal + score", () => {
    expect(cardFieldsForDensity("medium")).toEqual([
      "status",
      "energy",
      "signal",
      "score",
    ])
  })

  it("high → all six fields", () => {
    expect(cardFieldsForDensity("high")).toEqual([
      "status",
      "energy",
      "signal",
      "score",
      "followup",
      "gap",
    ])
  })
})
