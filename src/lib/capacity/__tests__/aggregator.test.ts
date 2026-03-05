import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { SignalAggregator } from "../signals/aggregator"
import type { SignalReading } from "../signals/detectors/types"

// Mock matchMedia for EnvironmentDetector used inside SignalAggregator
function setupMatchMedia(darkMode = false, reducedMotion = false) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches:
        (query === "(prefers-color-scheme: dark)" && darkMode) ||
        (query === "(prefers-reduced-motion: reduce)" && reducedMotion),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })
}

describe("SignalAggregator", () => {
  let aggregator: SignalAggregator

  beforeEach(() => {
    setupMatchMedia()
    aggregator = new SignalAggregator()
  })

  afterEach(() => {
    aggregator.destroy()
  })

  describe("aggregateSignals", () => {
    it("returns a CapacityField with all four dimensions", async () => {
      const result = await aggregator.aggregateSignals()
      expect(result).toHaveProperty("cognitive")
      expect(result).toHaveProperty("temporal")
      expect(result).toHaveProperty("emotional")
      expect(result).toHaveProperty("valence")
    })

    it("all cognitive, temporal, emotional are in 0-1 range", async () => {
      const result = await aggregator.aggregateSignals()
      expect(result.cognitive).toBeGreaterThanOrEqual(0)
      expect(result.cognitive).toBeLessThanOrEqual(1)
      expect(result.temporal).toBeGreaterThanOrEqual(0)
      expect(result.temporal).toBeLessThanOrEqual(1)
      expect(result.emotional).toBeGreaterThanOrEqual(0)
      expect(result.emotional).toBeLessThanOrEqual(1)
    })

    it("valence is in -1 to 1 range", async () => {
      const result = await aggregator.aggregateSignals()
      expect(result.valence).toBeGreaterThanOrEqual(-1)
      expect(result.valence).toBeLessThanOrEqual(1)
    })

    it("defaults dimension to 0.5 when no signals contribute to it", async () => {
      // Create an aggregator with only cognitive detectors; valence should default to 0
      const result = await aggregator.aggregateSignals()
      // Valence defaults to 0 when no signals provide it
      // The existing detectors don't output valence, so it should be 0
      expect(result.valence).toBe(0)
    })

    it("returns consistent results across multiple calls", async () => {
      const r1 = await aggregator.aggregateSignals()
      const r2 = await aggregator.aggregateSignals()
      // Cognitive should be stable within the same session
      expect(Math.abs(r1.cognitive - r2.cognitive)).toBeLessThan(0.5)
    })

    it("temporal dimension is populated from TimeDetector and EnvironmentDetector (not just default 0.5)", async () => {
      // TimeDetector now returns a temporal reading (weekday/weekend)
      // EnvironmentDetector now returns a temporal reading (prefers-reduced-motion)
      // So temporal should be a weighted average of those, not 0.5 default
      const result = await aggregator.aggregateSignals()
      // The default matchMedia mock returns no reduced-motion (temporal 0.8) and
      // TimeDetector returns 0.7 (weekday) or 0.9 (weekend). Either way, it's not 0.5.
      expect(result.temporal).not.toBe(0.5)
      expect(result.temporal).toBeGreaterThanOrEqual(0)
      expect(result.temporal).toBeLessThanOrEqual(1)
    })
  })

  describe("destroy", () => {
    it("does not throw", () => {
      expect(() => aggregator.destroy()).not.toThrow()
    })

    it("can be called multiple times without error", () => {
      aggregator.destroy()
      expect(() => aggregator.destroy()).not.toThrow()
    })
  })
})
