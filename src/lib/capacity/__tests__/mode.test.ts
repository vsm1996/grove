import { describe, it, expect } from "vitest"
import { deriveMode, deriveModeLabel, getModeBadgeColor } from "../mode"
import type { CapacityField } from "../types"

// Preset fields used throughout the tests
const NEUTRAL: CapacityField = { cognitive: 0.5, temporal: 0.5, emotional: 0.5, valence: 0.0 }
const EXHAUSTED: CapacityField = { cognitive: 0.1, temporal: 0.1, emotional: 0.1, valence: -0.5 }
const OVERWHELMED: CapacityField = { cognitive: 0.2, temporal: 0.15, emotional: 0.2, valence: -0.3 }
const DISTRACTED: CapacityField = { cognitive: 0.35, temporal: 0.25, emotional: 0.5, valence: 0.0 }
const FOCUSED: CapacityField = { cognitive: 0.75, temporal: 0.75, emotional: 0.55, valence: 0.0 }
const ENERGIZED: CapacityField = { cognitive: 0.9, temporal: 0.85, emotional: 0.85, valence: 0.4 }
const EXPLORING: CapacityField = { cognitive: 1.0, temporal: 1.0, emotional: 1.0, valence: 0.5 }

describe("deriveMode", () => {
  describe("density", () => {
    it("low cognitive → low density", () => {
      expect(deriveMode({ ...NEUTRAL, cognitive: 0.3 }).density).toBe("low")
    })

    it("high cognitive → high density", () => {
      expect(deriveMode({ ...NEUTRAL, cognitive: 0.8 }).density).toBe("high")
    })

    it("mid cognitive → medium density", () => {
      expect(deriveMode(NEUTRAL).density).toBe("medium")
    })

    it("threshold: cognitive exactly 0.4 is medium (not low)", () => {
      expect(deriveMode({ ...NEUTRAL, cognitive: 0.4 }).density).toBe("medium")
    })

    it("threshold: cognitive exactly 0.7 is medium (not high)", () => {
      expect(deriveMode({ ...NEUTRAL, cognitive: 0.7 }).density).toBe("medium")
    })
  })

  describe("guidance", () => {
    it("low cognitive → high guidance", () => {
      expect(deriveMode({ ...NEUTRAL, cognitive: 0.3 }).guidance).toBe("high")
    })

    it("low temporal (not low cognitive) → medium guidance", () => {
      expect(deriveMode({ ...NEUTRAL, cognitive: 0.6, temporal: 0.3 }).guidance).toBe("medium")
    })

    it("high cognitive and temporal → low guidance", () => {
      expect(deriveMode(FOCUSED).guidance).toBe("low")
    })
  })

  describe("choiceLoad", () => {
    it("low temporal → minimal", () => {
      expect(deriveMode({ ...NEUTRAL, temporal: 0.3 }).choiceLoad).toBe("minimal")
    })

    it("normal temporal → normal", () => {
      expect(deriveMode(NEUTRAL).choiceLoad).toBe("normal")
    })
  })

  describe("motion", () => {
    it("emotional < 0.15 → off", () => {
      expect(deriveMode({ ...NEUTRAL, emotional: 0.1 }).motion).toBe("off")
    })

    it("emotional 0.15-0.4 → soothing", () => {
      expect(deriveMode({ ...NEUTRAL, emotional: 0.3 }).motion).toBe("soothing")
    })

    it("emotional 0.4-0.6 → subtle", () => {
      expect(deriveMode(NEUTRAL).motion).toBe("subtle")
    })

    it("high emotional + positive valence → expressive", () => {
      expect(deriveMode(ENERGIZED).motion).toBe("expressive")
    })

    it("high emotional + negative valence → subtle (not expressive)", () => {
      expect(deriveMode({ ...ENERGIZED, valence: -0.3 }).motion).toBe("subtle")
    })

    it("high emotional + neutral valence → subtle (not expressive)", () => {
      expect(deriveMode({ ...ENERGIZED, valence: 0.0 }).motion).toBe("subtle")
    })
  })

  describe("contrast", () => {
    it("negative valence → boosted", () => {
      expect(deriveMode({ ...NEUTRAL, valence: -0.5 }).contrast).toBe("boosted")
    })

    it("positive valence → standard", () => {
      expect(deriveMode({ ...NEUTRAL, valence: 0.5 }).contrast).toBe("standard")
    })

    it("neutral valence → standard", () => {
      expect(deriveMode(NEUTRAL).contrast).toBe("standard")
    })

    it("valence exactly -0.15 is standard (boundary)", () => {
      expect(deriveMode({ ...NEUTRAL, valence: -0.15 }).contrast).toBe("standard")
    })
  })

  describe("focus", () => {
    it("motion=off → focus is default regardless of cognitive", () => {
      const mode = deriveMode(EXHAUSTED)
      expect(mode.motion).toBe("off")
      expect(mode.focus).toBe("default")
    })

    it("low cognitive + motion available → guided", () => {
      const mode = deriveMode(DISTRACTED)
      expect(mode.focus).toBe("guided")
    })

    it("high cognitive → default", () => {
      const mode = deriveMode(FOCUSED)
      expect(mode.focus).toBe("default")
    })

    it("medium cognitive + motion → gentle", () => {
      const mode = deriveMode(NEUTRAL)
      expect(mode.focus).toBe("gentle")
    })
  })

  describe("preset smoke tests", () => {
    it("exhausted produces minimal, off motion", () => {
      const mode = deriveMode(EXHAUSTED)
      expect(mode.density).toBe("low")
      expect(mode.motion).toBe("off")
      expect(mode.guidance).toBe("high")
    })

    it("energized produces high density, expressive motion", () => {
      const mode = deriveMode(ENERGIZED)
      expect(mode.density).toBe("high")
      expect(mode.motion).toBe("expressive")
    })
  })
})

describe("deriveModeLabel", () => {
  it("exhausted → Minimal", () => {
    expect(deriveModeLabel(EXHAUSTED)).toBe("Minimal")
  })

  it("overwhelmed → Minimal", () => {
    expect(deriveModeLabel(OVERWHELMED)).toBe("Minimal")
  })

  it("distracted → Minimal (cognitive=0.35 < 0.4 AND temporal=0.25 < 0.4)", () => {
    expect(deriveModeLabel(DISTRACTED)).toBe("Minimal")
  })

  it("neutral → Calm", () => {
    expect(deriveModeLabel(NEUTRAL)).toBe("Calm")
  })

  it("focused → Focused", () => {
    expect(deriveModeLabel(FOCUSED)).toBe("Focused")
  })

  it("energized → Exploratory", () => {
    expect(deriveModeLabel(ENERGIZED)).toBe("Exploratory")
  })

  it("exploring → Exploratory", () => {
    expect(deriveModeLabel(EXPLORING)).toBe("Exploratory")
  })
})

describe("getModeBadgeColor", () => {
  it("returns a string for each label", () => {
    const labels = ["Calm", "Focused", "Exploratory", "Minimal"] as const
    for (const label of labels) {
      expect(typeof getModeBadgeColor(label)).toBe("string")
      expect(getModeBadgeColor(label).length).toBeGreaterThan(0)
    }
  })
})
