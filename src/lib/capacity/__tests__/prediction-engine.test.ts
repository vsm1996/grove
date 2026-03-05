import { describe, it, expect, beforeEach, vi } from "vitest"
import { PredictionEngine } from "../prediction/prediction-engine"
import { PatternExtractor } from "../prediction/pattern-extractor"
import type { CapacityPattern } from "../prediction/types"

function makeExtractor(patterns: CapacityPattern[]): PatternExtractor {
  return {
    extractPatterns: () => patterns,
  } as unknown as PatternExtractor
}

const HIGH_CONFIDENCE_PATTERN: CapacityPattern = {
  trigger: { timeOfDay: 9, dayOfWeek: 1 },
  prediction: { cognitive: 0.8, temporal: 0.7, emotional: 0.9, valence: 0.2 },
  confidence: 0.9,
  sampleSize: 10,
  timestamp: Date.now(),
}

const LOW_CONFIDENCE_PATTERN: CapacityPattern = {
  trigger: { timeOfDay: 9, dayOfWeek: 1 },
  prediction: { cognitive: 0.3 },
  confidence: 0.3, // Below threshold of 0.5
  sampleSize: 2,
  timestamp: Date.now(),
}

describe("PredictionEngine", () => {
  describe("predictCapacity", () => {
    it("returns null when no patterns", () => {
      const engine = new PredictionEngine(makeExtractor([]))
      expect(engine.predictCapacity({ timeOfDay: 9, dayOfWeek: 1 })).toBeNull()
    })

    it("returns null when only low-confidence patterns exist", () => {
      const engine = new PredictionEngine(makeExtractor([LOW_CONFIDENCE_PATTERN]))
      expect(engine.predictCapacity({ timeOfDay: 9, dayOfWeek: 1 })).toBeNull()
    })

    it("returns predicted CapacityField for matching high-confidence pattern", () => {
      const engine = new PredictionEngine(makeExtractor([HIGH_CONFIDENCE_PATTERN]))
      const result = engine.predictCapacity({ timeOfDay: 9, dayOfWeek: 1 })

      expect(result).not.toBeNull()
      expect(result!.cognitive).toBe(0.8)
      expect(result!.temporal).toBe(0.7)
      expect(result!.emotional).toBe(0.9)
      expect(result!.valence).toBe(0.2)
    })

    it("fills missing prediction fields with defaults (0.5 / 0.0)", () => {
      const partialPattern: CapacityPattern = {
        trigger: { timeOfDay: 9, dayOfWeek: 1 },
        prediction: { cognitive: 0.7 }, // only cognitive
        confidence: 0.8,
        sampleSize: 8,
        timestamp: Date.now(),
      }
      const engine = new PredictionEngine(makeExtractor([partialPattern]))
      const result = engine.predictCapacity({ timeOfDay: 9, dayOfWeek: 1 })

      expect(result).not.toBeNull()
      expect(result!.cognitive).toBe(0.7)
      expect(result!.temporal).toBe(0.5)   // default
      expect(result!.emotional).toBe(0.5)  // default
      expect(result!.valence).toBe(0.0)    // default
    })

    it("returns null when context does not match any pattern", () => {
      const engine = new PredictionEngine(makeExtractor([HIGH_CONFIDENCE_PATTERN]))
      // Pattern is for hour=9, day=1 but we query hour=14, day=3
      expect(engine.predictCapacity({ timeOfDay: 14, dayOfWeek: 3 })).toBeNull()
    })

    it("selects the highest confidence matching pattern", () => {
      const mid: CapacityPattern = {
        trigger: { timeOfDay: 9, dayOfWeek: 1 },
        prediction: { cognitive: 0.5 },
        confidence: 0.6,
        sampleSize: 6,
        timestamp: Date.now(),
      }
      const high: CapacityPattern = {
        ...HIGH_CONFIDENCE_PATTERN,
        prediction: { cognitive: 0.9 },
        confidence: 0.95,
      }
      const engine = new PredictionEngine(makeExtractor([mid, high]))
      const result = engine.predictCapacity({ timeOfDay: 9, dayOfWeek: 1 })
      expect(result!.cognitive).toBe(0.9)
    })

    it("matches when only timeOfDay is specified in trigger", () => {
      const pattern: CapacityPattern = {
        trigger: { timeOfDay: 9 }, // no dayOfWeek
        prediction: { cognitive: 0.8 },
        confidence: 0.8,
        sampleSize: 5,
        timestamp: Date.now(),
      }
      const engine = new PredictionEngine(makeExtractor([pattern]))
      // Should match any day when context has dayOfWeek but trigger doesn't
      const result = engine.predictCapacity({ timeOfDay: 9, dayOfWeek: 3 })
      expect(result).not.toBeNull()
    })
  })

  describe("loadPatterns", () => {
    it("reloads patterns from extractor", () => {
      let callCount = 0
      const extractor = {
        extractPatterns: () => {
          callCount++
          return callCount === 1 ? [] : [HIGH_CONFIDENCE_PATTERN]
        },
      } as unknown as PatternExtractor

      const engine = new PredictionEngine(extractor)
      expect(engine.predictCapacity({ timeOfDay: 9, dayOfWeek: 1 })).toBeNull()

      engine.loadPatterns()
      expect(engine.predictCapacity({ timeOfDay: 9, dayOfWeek: 1 })).not.toBeNull()
    })
  })

  describe("decayConfidence", () => {
    it("reduces confidence by the correct exponential factor after 1 day", () => {
      vi.useFakeTimers()
      const pattern: CapacityPattern = { ...HIGH_CONFIDENCE_PATTERN, confidence: 0.9, timestamp: Date.now() }
      const engine = new PredictionEngine(makeExtractor([pattern]))
      vi.advanceTimersByTime(1 * 24 * 60 * 60 * 1000)
      engine.decayConfidence()
      // confidence = 0.9 * 0.9^1 = 0.81 — still above 0.5 threshold, prediction intact
      expect(engine.predictCapacity({ timeOfDay: 9, dayOfWeek: 1 })).not.toBeNull()
      vi.useRealTimers()
    })

    it("pattern drops below prediction threshold after sufficient decay", () => {
      vi.useFakeTimers()
      const pattern: CapacityPattern = { ...HIGH_CONFIDENCE_PATTERN, confidence: 0.6, timestamp: Date.now() }
      const engine = new PredictionEngine(makeExtractor([pattern]))
      vi.advanceTimersByTime(2 * 24 * 60 * 60 * 1000)
      engine.decayConfidence()
      // confidence = 0.6 * 0.9^2 = 0.486 — below 0.5 threshold
      expect(engine.predictCapacity({ timeOfDay: 9, dayOfWeek: 1 })).toBeNull()
      vi.useRealTimers()
    })

    it("does not throw when no patterns exist", () => {
      const engine = new PredictionEngine(makeExtractor([]))
      expect(() => engine.decayConfidence()).not.toThrow()
    })
  })
})
