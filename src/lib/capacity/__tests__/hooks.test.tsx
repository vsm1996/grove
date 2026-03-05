import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import type { CapacityField } from "../types"

const mockLoadPatterns = vi.fn()
const mockDecayConfidence = vi.fn()
const mockPredictCapacity = vi.fn<() => CapacityField | null>().mockReturnValue(null)

vi.mock("../prediction/pattern-store", () => ({
  PatternStore: class MockPatternStore {},
}))
vi.mock("../prediction/pattern-extractor", () => ({
  PatternExtractor: class MockPatternExtractor {
    constructor(_store: unknown) {}
  },
}))
vi.mock("../prediction/prediction-engine", () => ({
  PredictionEngine: class MockPredictionEngine {
    loadPatterns = mockLoadPatterns
    decayConfidence = mockDecayConfidence
    predictCapacity = mockPredictCapacity
    constructor(_extractor: unknown) {
      this.loadPatterns = mockLoadPatterns
      this.decayConfidence = mockDecayConfidence
      this.predictCapacity = mockPredictCapacity
    }
  },
}))

import { usePredictedCapacity } from "../prediction/hooks"

const PREDICTION_INTERVAL_MS = 5000

beforeEach(() => {
  vi.useFakeTimers()
  mockLoadPatterns.mockClear()
  mockDecayConfidence.mockClear()
  mockPredictCapacity.mockClear().mockReturnValue(null)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("usePredictedCapacity", () => {
  it("returns null before first interval fires", () => {
    const { result } = renderHook(() => usePredictedCapacity())
    expect(result.current).toBeNull()
  })

  it("returns null when predictCapacity returns null", () => {
    mockPredictCapacity.mockReturnValue(null)
    const { result } = renderHook(() => usePredictedCapacity())
    act(() => {
      vi.advanceTimersByTime(PREDICTION_INTERVAL_MS)
    })
    expect(result.current).toBeNull()
  })

  it("returns predicted field when predictCapacity returns a value", () => {
    const field: CapacityField = { cognitive: 0.8, temporal: 0.7, emotional: 0.9, valence: 0.2 }
    mockPredictCapacity.mockReturnValue(field)
    const { result } = renderHook(() => usePredictedCapacity())
    act(() => {
      vi.advanceTimersByTime(PREDICTION_INTERVAL_MS)
    })
    expect(result.current).toEqual(field)
  })

  it("calls loadPatterns and decayConfidence on each interval", () => {
    renderHook(() => usePredictedCapacity())
    // loadPatterns is called once at mount; clear before counting interval calls
    mockLoadPatterns.mockClear()
    mockDecayConfidence.mockClear()
    act(() => {
      vi.advanceTimersByTime(PREDICTION_INTERVAL_MS * 2)
    })
    expect(mockLoadPatterns).toHaveBeenCalledTimes(2)
    expect(mockDecayConfidence).toHaveBeenCalledTimes(2)
  })

  it("clears interval on unmount", () => {
    const { unmount } = renderHook(() => usePredictedCapacity())
    unmount()
    act(() => {
      vi.advanceTimersByTime(PREDICTION_INTERVAL_MS * 3)
    })
    expect(mockPredictCapacity).not.toHaveBeenCalled()
  })

  it("error in predictCapacity does not propagate", () => {
    mockPredictCapacity.mockImplementation(() => {
      throw new Error("prediction failed")
    })
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { result } = renderHook(() => usePredictedCapacity())
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(PREDICTION_INTERVAL_MS)
      })
    }).not.toThrow()
    expect(result.current).toBeNull()
    consoleWarn.mockRestore()
  })
})
