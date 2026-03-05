import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { TimeDetector } from "../signals/detectors/time-detector"
import { SessionDetector } from "../signals/detectors/session-detector"
import { ScrollDetector } from "../signals/detectors/scroll-detector"
import { InteractionDetector } from "../signals/detectors/interaction-detector"
import { InputDetector } from "../signals/detectors/input-detector"
import { EnvironmentDetector } from "../signals/detectors/environment-detector"
import type { SignalReading } from "../signals/detectors/types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Assert a single-dimension detector returned exactly one reading and return it. */
function single(readings: SignalReading[]): SignalReading {
  expect(readings).toHaveLength(1)
  return readings[0]
}

/** Find a reading by dimension from a multi-reading array. */
function byDim(readings: SignalReading[], dim: SignalReading["dimension"]): SignalReading {
  const r = readings.find(x => x.dimension === dim)
  expect(r).toBeDefined()
  return r!
}

// ============================================================================
// TimeDetector
// ============================================================================
describe("TimeDetector", () => {
  const detector = new TimeDetector()

  it("has correct name and weight", () => {
    expect(detector.name).toBe("TimeDetector")
    expect(detector.weight).toBeGreaterThan(0)
    expect(detector.weight).toBeLessThanOrEqual(1)
  })

  it("returns two readings (cognitive + temporal)", () => {
    const readings = detector.detect()
    expect(readings).toHaveLength(2)
    expect(readings.map(r => r.dimension).sort()).toEqual(["cognitive", "temporal"])
  })

  it("all readings have correct detectorName and valid fields", () => {
    for (const r of detector.detect()) {
      expect(r.detectorName).toBe("TimeDetector")
      expect(r.value).toBeGreaterThanOrEqual(0)
      expect(r.value).toBeLessThanOrEqual(1)
      expect(r.confidence).toBeGreaterThan(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
      expect(r.timestamp).toBeGreaterThan(0)
    }
  })

  describe("time-based cognitive values", () => {
    afterEach(() => vi.useRealTimers())

    it("morning peak (9am) → cognitive 0.8", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2024, 0, 8, 9, 30)) // 9:30am Monday
      expect(byDim(detector.detect(), "cognitive").value).toBe(0.8)
    })

    it("late night (22:00) → cognitive 0.3", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2024, 0, 8, 22, 0))
      expect(byDim(detector.detect(), "cognitive").value).toBe(0.3)
    })

    it("early morning (3am) → cognitive 0.3", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2024, 0, 8, 3, 0))
      expect(byDim(detector.detect(), "cognitive").value).toBe(0.3)
    })

    it("afternoon (14-17) → cognitive 0.6", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2024, 0, 8, 15, 0))
      expect(byDim(detector.detect(), "cognitive").value).toBe(0.6)
    })

    it("evening (17-20) → cognitive 0.5", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2024, 0, 8, 18, 0))
      expect(byDim(detector.detect(), "cognitive").value).toBe(0.5)
    })
  })

  describe("temporal readings", () => {
    afterEach(() => vi.useRealTimers())

    it("weekday → temporal 0.7", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2024, 0, 8, 10, 0)) // Monday Jan 8 2024
      expect(byDim(detector.detect(), "temporal").value).toBe(0.7)
    })

    it("weekend → temporal 0.9", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2024, 0, 6, 10, 0)) // Saturday Jan 6 2024
      expect(byDim(detector.detect(), "temporal").value).toBe(0.9)
    })

    it("temporal confidence is 0.6", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2024, 0, 8, 10, 0))
      expect(byDim(detector.detect(), "temporal").confidence).toBe(0.6)
    })
  })
})

// ============================================================================
// SessionDetector
// ============================================================================
describe("SessionDetector", () => {
  afterEach(() => vi.useRealTimers())

  it("has correct name and weight", () => {
    const d = new SessionDetector()
    expect(d.name).toBe("SessionDetector")
    expect(d.weight).toBeGreaterThan(0)
  })

  it("returns one reading with temporal dimension", () => {
    vi.useFakeTimers()
    const d = new SessionDetector()
    const r = single(d.detect())
    expect(r.dimension).toBe("temporal")
  })

  it("new session (< 15 min) → high temporal value 0.9", () => {
    vi.useFakeTimers()
    const d = new SessionDetector()
    const r = single(d.detect())
    expect(r.value).toBe(0.9)
    expect(r.confidence).toBe(0.8)
  })

  it("medium session (30 min) → temporal 0.7", () => {
    vi.useFakeTimers()
    const d = new SessionDetector()
    vi.advanceTimersByTime(30 * 60 * 1000)
    expect(single(d.detect()).value).toBe(0.7)
  })

  it("long session (2 hours) → temporal 0.5", () => {
    vi.useFakeTimers()
    const d = new SessionDetector()
    vi.advanceTimersByTime(120 * 60 * 1000)
    expect(single(d.detect()).value).toBe(0.5)
  })

  it("very long session (4 hours) → temporal 0.3", () => {
    vi.useFakeTimers()
    const d = new SessionDetector()
    vi.advanceTimersByTime(240 * 60 * 1000)
    expect(single(d.detect()).value).toBe(0.3)
  })

  it("returns valid confidence in 0-1 range", () => {
    vi.useFakeTimers()
    const d = new SessionDetector()
    const r = single(d.detect())
    expect(r.confidence).toBeGreaterThan(0)
    expect(r.confidence).toBeLessThanOrEqual(1)
  })
})

// ============================================================================
// ScrollDetector
// ============================================================================
describe("ScrollDetector", () => {
  let detector: ScrollDetector

  beforeEach(() => { detector = new ScrollDetector() })
  afterEach(() => { detector.destroy() })

  it("has correct name and weight", () => {
    expect(detector.name).toBe("ScrollDetector")
    expect(detector.weight).toBeGreaterThan(0)
  })

  it("returns one reading with cognitive dimension", () => {
    expect(single(detector.detect()).dimension).toBe("cognitive")
  })

  it("returns 0.5 cognitive when no scroll activity", () => {
    const r = single(detector.detect())
    expect(r.value).toBe(0.5)
    expect(r.confidence).toBe(0.5)
  })

  it("returns a valid reading with timestamp", () => {
    const before = Date.now()
    const r = single(detector.detect())
    expect(r.timestamp).toBeGreaterThanOrEqual(before)
    expect(r.detectorName).toBe("ScrollDetector")
  })

  it("destroy does not throw", () => {
    expect(() => detector.destroy()).not.toThrow()
  })
})

// ============================================================================
// InteractionDetector
// ============================================================================
describe("InteractionDetector", () => {
  let detector: InteractionDetector

  beforeEach(() => {
    vi.useFakeTimers()
    detector = new InteractionDetector()
  })

  afterEach(() => {
    detector.destroy()
    vi.useRealTimers()
  })

  it("has correct name and weight", () => {
    expect(detector.name).toBe("InteractionDetector")
    expect(detector.weight).toBeGreaterThan(0)
  })

  it("returns one reading with cognitive dimension", () => {
    expect(single(detector.detect()).dimension).toBe("cognitive")
  })

  it("returns 0.4 when user is idle (no activity for 15+ seconds)", () => {
    // Idle threshold is now 15 000 ms; advance past it
    vi.advanceTimersByTime(16_000)
    expect(single(detector.detect()).value).toBe(0.4)
  })

  it("does NOT mark as idle before 15-second threshold", () => {
    // 3 s was the old (too-short) threshold; must not trigger idle any more
    vi.advanceTimersByTime(3_000)
    const r = single(detector.detect())
    expect(r.value).not.toBe(0.4) // not idle yet
  })

  it("returns valid confidence in 0-1 range", () => {
    const r = single(detector.detect())
    expect(r.confidence).toBeGreaterThan(0)
    expect(r.confidence).toBeLessThanOrEqual(1)
  })

  it("destroy does not throw", () => {
    expect(() => detector.destroy()).not.toThrow()
  })
})

// ============================================================================
// InputDetector
// ============================================================================
describe("InputDetector", () => {
  let detector: InputDetector

  beforeEach(() => { detector = new InputDetector() })
  afterEach(() => { detector.destroy() })

  it("has correct name and weight", () => {
    expect(detector.name).toBe("InputDetector")
    expect(detector.weight).toBeGreaterThan(0)
  })

  it("returns one reading with cognitive dimension", () => {
    expect(single(detector.detect()).dimension).toBe("cognitive")
  })

  it("returns 0.4 cognitive when no typing occurred (typingSpeedCPM=0 < 20)", () => {
    const r = single(detector.detect())
    // No key presses: typingSpeedCPM=0 → recentErrorCount=0, but CPM < 20 → 0.4
    expect(r.value).toBe(0.4)
    expect(r.confidence).toBe(0.6)
  })

  it("returns valid confidence in 0-1 range", () => {
    const r = single(detector.detect())
    expect(r.confidence).toBeGreaterThan(0)
    expect(r.confidence).toBeLessThanOrEqual(1)
  })

  it("destroy does not throw", () => {
    expect(() => detector.destroy()).not.toThrow()
  })
})

// ============================================================================
// EnvironmentDetector
// ============================================================================
describe("EnvironmentDetector", () => {
  let detector: EnvironmentDetector

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
        dispatchEvent: vi.fn(),
      })),
    })
  }

  beforeEach(() => {
    setupMatchMedia()
    detector = new EnvironmentDetector()
  })

  afterEach(() => {
    detector.destroy()
  })

  it("has correct name and weight", () => {
    expect(detector.name).toBe("EnvironmentDetector")
    expect(detector.weight).toBeGreaterThan(0)
  })

  it("returns two readings: temporal and emotional", () => {
    const readings = detector.detect()
    expect(readings).toHaveLength(2)
    expect(readings.map(r => r.dimension).sort()).toEqual(["emotional", "temporal"])
  })

  it("all readings have high confidence (0.9)", () => {
    for (const r of detector.detect()) {
      expect(r.confidence).toBe(0.9)
    }
  })

  it("returns light-mode emotional value (0.7) when no dark mode", () => {
    expect(byDim(detector.detect(), "emotional").value).toBe(0.7)
  })

  it("returns dark-mode emotional value (0.6) when dark mode enabled", () => {
    setupMatchMedia(true, false)
    const d = new EnvironmentDetector()
    expect(byDim(d.detect(), "emotional").value).toBe(0.6)
    d.destroy()
  })

  it("returns temporal value 0.8 when no prefers-reduced-motion", () => {
    expect(byDim(detector.detect(), "temporal").value).toBe(0.8)
  })

  it("returns temporal value 0.3 when prefers-reduced-motion is set", () => {
    setupMatchMedia(false, true)
    const d = new EnvironmentDetector()
    expect(byDim(d.detect(), "temporal").value).toBe(0.3)
    d.destroy()
  })

  it("destroy calls removeEventListener with the same handler that was registered", () => {
    const handlers: { added: Function[]; removed: Function[] } = { added: [], removed: [] }

    // A single mock MQL object shared across both matchMedia queries
    const mockMql = {
      matches: false,
      addEventListener: vi.fn((_type: string, fn: Function) => handlers.added.push(fn)),
      removeEventListener: vi.fn((_type: string, fn: Function) => handlers.removed.push(fn)),
    }

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn(() => mockMql),
    })

    const d = new EnvironmentDetector()
    d.destroy()

    expect(handlers.added).toHaveLength(2)   // one for each query
    expect(handlers.removed).toHaveLength(2) // both removed on destroy
    // Every handler removed must be one that was actually added
    for (const removedFn of handlers.removed) {
      expect(handlers.added).toContain(removedFn)
    }
  })

  it("destroy does not throw", () => {
    expect(() => detector.destroy()).not.toThrow()
  })
})
