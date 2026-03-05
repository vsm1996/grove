import { describe, it, expect } from "vitest"
import {
  PHI,
  PHI_INVERSE,
  FIBONACCI,
  FEEDBACK_FREQUENCIES,
  DEFAULT_FIELD_CONFIG,
  DEFAULT_USER_CAPACITY,
  DEFAULT_EMOTIONAL_STATE,
  DEFAULT_CAPACITY_FIELD,
  DEFAULT_COMPONENT_RESPONSE,
  MIN_CONTRAST_RATIO,
  MAX_ANIMATION_DURATION_MS,
  MOTION_TOKENS,
} from "../constants"

describe("constants", () => {
  describe("PHI", () => {
    it("golden ratio is approximately 1.618", () => {
      expect(PHI).toBeCloseTo(1.618, 3)
    })

    it("PHI_INVERSE is approximately 0.618", () => {
      expect(PHI_INVERSE).toBeCloseTo(0.618, 3)
    })

    it("PHI * PHI_INVERSE equals 1", () => {
      expect(PHI * PHI_INVERSE).toBeCloseTo(1, 10)
    })

    it("PHI_INVERSE equals 1/PHI", () => {
      expect(PHI_INVERSE).toBeCloseTo(1 / PHI, 10)
    })
  })

  describe("FIBONACCI", () => {
    it("contains 12 elements", () => {
      expect(FIBONACCI).toHaveLength(12)
    })

    it("starts with 1, 1, 2, 3, 5", () => {
      expect(FIBONACCI.slice(0, 5)).toEqual([1, 1, 2, 3, 5])
    })

    it("each element (after index 1) is sum of two preceding", () => {
      for (let i = 2; i < FIBONACCI.length; i++) {
        expect(FIBONACCI[i]).toBe(FIBONACCI[i - 1] + FIBONACCI[i - 2])
      }
    })
  })

  describe("FEEDBACK_FREQUENCIES", () => {
    it("has low, mid, high keys", () => {
      expect(FEEDBACK_FREQUENCIES).toHaveProperty("low")
      expect(FEEDBACK_FREQUENCIES).toHaveProperty("mid")
      expect(FEEDBACK_FREQUENCIES).toHaveProperty("high")
    })

    it("frequencies are positive numbers", () => {
      expect(FEEDBACK_FREQUENCIES.low).toBeGreaterThan(0)
      expect(FEEDBACK_FREQUENCIES.mid).toBeGreaterThan(0)
      expect(FEEDBACK_FREQUENCIES.high).toBeGreaterThan(0)
    })

    it("frequencies are in ascending order", () => {
      expect(FEEDBACK_FREQUENCIES.low).toBeLessThan(FEEDBACK_FREQUENCIES.mid)
      expect(FEEDBACK_FREQUENCIES.mid).toBeLessThan(FEEDBACK_FREQUENCIES.high)
    })
  })

  describe("DEFAULT_FIELD_CONFIG", () => {
    it("smoothing is between 0 and 1", () => {
      expect(DEFAULT_FIELD_CONFIG.smoothing).toBeGreaterThan(0)
      expect(DEFAULT_FIELD_CONFIG.smoothing).toBeLessThanOrEqual(1)
    })

    it("velocityThreshold is positive", () => {
      expect(DEFAULT_FIELD_CONFIG.velocityThreshold).toBeGreaterThan(0)
    })

    it("debounceMs is positive", () => {
      expect(DEFAULT_FIELD_CONFIG.debounceMs).toBeGreaterThan(0)
    })
  })

  describe("DEFAULT_USER_CAPACITY", () => {
    it("all dimensions are in 0-1 range", () => {
      const { cognitive, temporal, emotional } = DEFAULT_USER_CAPACITY
      expect(cognitive).toBeGreaterThanOrEqual(0)
      expect(cognitive).toBeLessThanOrEqual(1)
      expect(temporal).toBeGreaterThanOrEqual(0)
      expect(temporal).toBeLessThanOrEqual(1)
      expect(emotional).toBeGreaterThanOrEqual(0)
      expect(emotional).toBeLessThanOrEqual(1)
    })
  })

  describe("DEFAULT_EMOTIONAL_STATE", () => {
    it("valence is in -1 to 1 range", () => {
      expect(DEFAULT_EMOTIONAL_STATE.valence).toBeGreaterThanOrEqual(-1)
      expect(DEFAULT_EMOTIONAL_STATE.valence).toBeLessThanOrEqual(1)
    })

    it("arousal is in 0 to 1 range", () => {
      expect(DEFAULT_EMOTIONAL_STATE.arousal).toBeGreaterThanOrEqual(0)
      expect(DEFAULT_EMOTIONAL_STATE.arousal).toBeLessThanOrEqual(1)
    })
  })

  describe("DEFAULT_CAPACITY_FIELD", () => {
    it("cognitive, temporal, emotional are 0.5 (neutral)", () => {
      expect(DEFAULT_CAPACITY_FIELD.cognitive).toBe(0.5)
      expect(DEFAULT_CAPACITY_FIELD.temporal).toBe(0.5)
      expect(DEFAULT_CAPACITY_FIELD.emotional).toBe(0.5)
    })

    it("valence is 0 (neutral)", () => {
      expect(DEFAULT_CAPACITY_FIELD.valence).toBe(0.0)
    })
  })

  describe("DEFAULT_COMPONENT_RESPONSE", () => {
    it("opacityRange[0] < opacityRange[1]", () => {
      const [min, max] = DEFAULT_COMPONENT_RESPONSE.visual.opacityRange
      expect(min).toBeLessThan(max)
    })

    it("scaleRange[0] < scaleRange[1]", () => {
      const [min, max] = DEFAULT_COMPONENT_RESPONSE.visual.scaleRange
      expect(min).toBeLessThan(max)
    })

    it("sonic is disabled by default", () => {
      expect(DEFAULT_COMPONENT_RESPONSE.sonic.enabled).toBe(false)
    })

    it("spacingMultiplier max equals PHI", () => {
      const [, max] = DEFAULT_COMPONENT_RESPONSE.spatial.spacingMultiplier
      expect(max).toBe(PHI)
    })
  })

  describe("accessibility constants", () => {
    it("MIN_CONTRAST_RATIO meets WCAG AA (4.5)", () => {
      expect(MIN_CONTRAST_RATIO).toBe(4.5)
    })

    it("MAX_ANIMATION_DURATION_MS is 300", () => {
      expect(MAX_ANIMATION_DURATION_MS).toBe(300)
    })
  })

  describe("MOTION_TOKENS", () => {
    it("off mode has zero durations", () => {
      expect(MOTION_TOKENS.off.durationFast).toBe(0)
      expect(MOTION_TOKENS.off.durationBase).toBe(0)
      expect(MOTION_TOKENS.off.durationSlow).toBe(0)
    })

    it("essential duration in off mode is non-zero", () => {
      expect(MOTION_TOKENS.off.essentialDuration).toBeGreaterThan(0)
    })

    it("soothing has no fast motion (durationFast = 0)", () => {
      expect(MOTION_TOKENS.soothing.durationFast).toBe(0)
    })

    it("soothing is slower than subtle", () => {
      expect(MOTION_TOKENS.soothing.durationBase).toBeGreaterThan(MOTION_TOKENS.subtle.durationBase)
    })

    it("expressive is slowest", () => {
      expect(MOTION_TOKENS.expressive.durationBase).toBeGreaterThan(MOTION_TOKENS.subtle.durationBase)
    })

    it("all modes have essential duration", () => {
      for (const mode of ["off", "soothing", "subtle", "expressive"] as const) {
        expect(MOTION_TOKENS[mode].essentialDuration).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
