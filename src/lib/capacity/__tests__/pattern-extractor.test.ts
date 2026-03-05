import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { PatternStore } from "../prediction/pattern-store"
import { PatternExtractor } from "../prediction/pattern-extractor"
import type { CapacityField } from "../types"

const FIELD: CapacityField = { cognitive: 0.7, temporal: 0.6, emotional: 0.8, valence: 0.2 }

// PATTERN_MIN_SAMPLE_SIZE = 12, PATTERN_FULL_CONFIDENCE_SAMPLE_SIZE = 20
// confidence = min(1, sampleSize / 20)
// At 12 samples → confidence = 0.6 (just meets PATTERN_CONFIDENCE_THRESHOLD)
// At 20 samples → confidence = 1.0

/**
 * Seeds the store with `count` records that share the same hour/dayOfWeek
 * so that a pattern is detectable.
 */
function seedPattern(
  store: PatternStore,
  count: number,
  hour: number,
  day: number,
  field: CapacityField = FIELD,
) {
  for (let i = 0; i < count; i++) {
    vi.setSystemTime(new Date(2024, 0, 7 + day, hour, i))
    store.recordCapacity(field)
  }
}

describe("PatternExtractor", () => {
  let store: PatternStore
  let extractor: PatternExtractor

  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    store = new PatternStore()
    extractor = new PatternExtractor(store)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("extractPatterns", () => {
    it("returns empty array when no history", () => {
      expect(extractor.extractPatterns()).toEqual([])
    })

    it("returns empty array when sample size < 12 (below confidence threshold)", () => {
      seedPattern(store, 11, 9, 1) // 11 samples → confidence 0.55 < 0.6
      expect(extractor.extractPatterns()).toHaveLength(0)
    })

    it("returns a pattern when sample size >= 12 (meets confidence threshold)", () => {
      seedPattern(store, 12, 9, 1) // 12 samples → confidence 0.6 = threshold
      expect(extractor.extractPatterns()).toHaveLength(1)
    })

    it("pattern has correct trigger (timeOfDay, dayOfWeek)", () => {
      seedPattern(store, 12, 10, 2)
      const pattern = extractor.extractPatterns()[0]
      expect(pattern.trigger.timeOfDay).toBe(10)
      expect(pattern.trigger.dayOfWeek).toBe(2)
    })

    it("pattern confidence at sampleSize=12 is exactly 0.6", () => {
      seedPattern(store, 12, 9, 1)
      const pattern = extractor.extractPatterns()[0]
      expect(pattern.confidence).toBeCloseTo(0.6, 5) // min(1, 12/20) = 0.6
    })

    it("pattern confidence at sampleSize=20 is 1.0 (fully confident)", () => {
      seedPattern(store, 20, 9, 1)
      const pattern = extractor.extractPatterns()[0]
      expect(pattern.confidence).toBe(1.0) // min(1, 20/20)
    })

    it("pattern confidence grows with more samples", () => {
      seedPattern(store, 12, 9, 1)
      const c12 = extractor.extractPatterns()[0].confidence
      localStorage.clear()
      store = new PatternStore()
      extractor = new PatternExtractor(store)
      seedPattern(store, 16, 9, 1)
      const c16 = extractor.extractPatterns()[0].confidence
      expect(c16).toBeGreaterThan(c12)
    })

    it("pattern confidence is >= 0.6 (PATTERN_CONFIDENCE_THRESHOLD)", () => {
      seedPattern(store, 12, 9, 1)
      const pattern = extractor.extractPatterns()[0]
      expect(pattern.confidence).toBeGreaterThanOrEqual(0.6)
    })

    it("prediction averages observed capacity fields", () => {
      const field1: CapacityField = { cognitive: 0.8, temporal: 0.8, emotional: 0.8, valence: 0.0 }
      const field2: CapacityField = { cognitive: 0.2, temporal: 0.2, emotional: 0.2, valence: 0.0 }

      // 8 of field1 + 4 of field2 = 12 total (meets threshold)
      for (let i = 0; i < 8; i++) {
        vi.setSystemTime(new Date(2024, 0, 8, 9, i))
        store.recordCapacity(field1)
      }
      for (let i = 8; i < 12; i++) {
        vi.setSystemTime(new Date(2024, 0, 8, 9, i))
        store.recordCapacity(field2)
      }

      const patterns = extractor.extractPatterns()
      expect(patterns).toHaveLength(1)
      // Cognitive avg should be between 0.2 and 0.8
      expect(patterns[0].prediction.cognitive).toBeGreaterThan(0.2)
      expect(patterns[0].prediction.cognitive).toBeLessThan(0.8)
    })

    it("separates patterns by different hours", () => {
      seedPattern(store, 12, 9, 1)
      seedPattern(store, 12, 14, 1)
      const patterns = extractor.extractPatterns()
      expect(patterns).toHaveLength(2)
      const hours = patterns.map((p) => p.trigger.timeOfDay).sort((a, b) => (a ?? 0) - (b ?? 0))
      expect(hours).toEqual([9, 14])
    })

    it("separates patterns by different days", () => {
      seedPattern(store, 12, 9, 1) // Monday
      seedPattern(store, 12, 9, 3) // Wednesday
      expect(extractor.extractPatterns()).toHaveLength(2)
    })

    it("pattern sampleSize matches number of observations", () => {
      seedPattern(store, 15, 9, 1)
      const pattern = extractor.extractPatterns()[0]
      expect(pattern.sampleSize).toBe(15)
    })

    it("pattern timestamp is the most recent observation", () => {
      // Seed 11 records at t1, then 1 at t2 — total 12, t2 is most recent
      for (let i = 0; i < 11; i++) {
        vi.setSystemTime(new Date(2024, 0, 8, 9, i))
        store.recordCapacity(FIELD)
      }
      const t2 = new Date(2024, 0, 8, 9, 30)
      vi.setSystemTime(t2)
      store.recordCapacity(FIELD)

      const pattern = extractor.extractPatterns()[0]
      expect(pattern.timestamp).toBe(t2.getTime())
    })
  })
})
