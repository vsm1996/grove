import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, act, renderHook } from "@testing-library/react"
import React from "react"

// Hoist the mock fn so it can be referenced inside vi.mock and also in tests.
const { mockAggregateSignals } = vi.hoisted(() => ({
  mockAggregateSignals: vi.fn<[], Promise<{ cognitive: number; temporal: number; emotional: number; valence: number }>>(),
}))

// Must use class syntax for vi.mock constructor mocks (arrow functions are not constructable)
vi.mock("../signals/aggregator", () => {
  class MockSignalAggregator {
    aggregateSignals() {
      return mockAggregateSignals()
    }
    destroy() {}
  }
  return { SignalAggregator: MockSignalAggregator }
})

function setupMatchMedia(reducedMotion = false) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" && reducedMotion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
}

import {
  CapacityProvider,
  useCapacityContext,
  useEnergyField,
  useAttentionField,
  useEmotionalValenceField,
  useFieldControls,
  usePrefersReducedMotion,
  useDerivedMode,
  useEffectiveMotion,
} from "../provider"
import { MOTION_TOKENS } from "../constants"
import { FieldManager } from "../fields/field-manager"

const DEFAULT_SIGNAL = { cognitive: 0.6, temporal: 0.6, emotional: 0.6, valence: 0.0 }

beforeEach(() => {
  setupMatchMedia()
  mockAggregateSignals.mockResolvedValue(DEFAULT_SIGNAL)
})

afterEach(() => {
  vi.clearAllTimers()
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CapacityProvider>{children}</CapacityProvider>
)

describe("CapacityProvider", () => {
  it("renders children without error", () => {
    const { getByText } = render(
      <CapacityProvider>
        <div>hello</div>
      </CapacityProvider>
    )
    expect(getByText("hello")).toBeTruthy()
  })
})

describe("useCapacityContext", () => {
  it("throws when used outside CapacityProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useCapacityContext())).toThrow(
      "useCapacityContext must be used within CapacityProvider"
    )
    consoleError.mockRestore()
  })

  it("returns context, updateCapacity, updateEmotionalState", () => {
    const { result } = renderHook(() => useCapacityContext(), { wrapper })
    expect(result.current.context).toBeDefined()
    expect(typeof result.current.updateCapacity).toBe("function")
    expect(typeof result.current.updateEmotionalState).toBe("function")
  })

  it("starts in auto mode", () => {
    const { result } = renderHook(() => useCapacityContext(), { wrapper })
    expect(result.current.isAutoMode).toBe(true)
  })

  it("toggleAutoMode switches auto mode", () => {
    const { result } = renderHook(() => useCapacityContext(), { wrapper })
    act(() => {
      result.current.toggleAutoMode()
    })
    expect(result.current.isAutoMode).toBe(false)
  })

  it("updateCapacity switches to manual mode", () => {
    const { result } = renderHook(() => useCapacityContext(), { wrapper })
    act(() => {
      result.current.updateCapacity({ cognitive: 0.3 })
    })
    expect(result.current.isAutoMode).toBe(false)
  })

  it("updateEmotionalState switches to manual mode", () => {
    const { result } = renderHook(() => useCapacityContext(), { wrapper })
    act(() => {
      result.current.updateEmotionalState({ valence: -0.5 })
    })
    expect(result.current.isAutoMode).toBe(false)
  })
})

describe("useEnergyField", () => {
  it("returns energy FieldValue with value, trend, lastChange", () => {
    const { result } = renderHook(() => useEnergyField(), { wrapper })
    expect(result.current.value).toBeGreaterThanOrEqual(0)
    expect(result.current.value).toBeLessThanOrEqual(1)
    expect(["rising", "falling", "stable"]).toContain(result.current.trend)
    expect(result.current.lastChange).toBeGreaterThan(0)
  })
})

describe("useAttentionField", () => {
  it("returns attention FieldValue in 0.5-1.0 range", () => {
    const { result } = renderHook(() => useAttentionField(), { wrapper })
    expect(result.current.value).toBeGreaterThanOrEqual(0.5)
    expect(result.current.value).toBeLessThanOrEqual(1.0)
  })
})

describe("useEmotionalValenceField", () => {
  it("returns valence FieldValue in -1 to 1 range", () => {
    const { result } = renderHook(() => useEmotionalValenceField(), { wrapper })
    expect(result.current.value).toBeGreaterThanOrEqual(-1)
    expect(result.current.value).toBeLessThanOrEqual(1)
  })
})

describe("useFieldControls", () => {
  it("returns all control functions and state", () => {
    const { result } = renderHook(() => useFieldControls(), { wrapper })
    expect(typeof result.current.updateCapacity).toBe("function")
    expect(typeof result.current.updateEmotionalState).toBe("function")
    expect(typeof result.current.toggleAutoMode).toBe("function")
    expect(typeof result.current.updateCapacityField).toBe("function")
    expect(typeof result.current.isAutoMode).toBe("boolean")
  })

  it("updateCapacityField updates both capacity and valence", () => {
    const { result } = renderHook(
      () => ({ ctx: useCapacityContext(), controls: useFieldControls() }),
      { wrapper }
    )
    act(() => {
      result.current.controls.updateCapacityField({
        cognitive: 0.9,
        temporal: 0.8,
        emotional: 0.85,
        valence: 0.4,
      })
    })
    const cap = result.current.ctx.context.userCapacity
    expect(cap.cognitive).toBe(0.9)
    expect(cap.temporal).toBe(0.8)
    expect(cap.emotional).toBe(0.85)
    expect(result.current.ctx.context.emotionalState.valence).toBe(0.4)
  })
})

describe("usePrefersReducedMotion", () => {
  it("returns false when no reduced motion preference", () => {
    setupMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it("returns true when reduced motion is preferred", () => {
    setupMatchMedia(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })
})

describe("useDerivedMode", () => {
  it("returns field and mode", () => {
    const { result } = renderHook(() => useDerivedMode(), { wrapper })
    expect(result.current.field).toBeDefined()
    expect(result.current.mode).toBeDefined()
    expect(result.current.mode.density).toMatch(/^(low|medium|high)$/)
    expect(result.current.mode.motion).toMatch(/^(off|soothing|subtle|expressive)$/)
  })

  it("field reflects current capacity context", () => {
    const { result } = renderHook(
      () => ({ mode: useDerivedMode(), ctx: useCapacityContext() }),
      { wrapper }
    )
    const { field } = result.current.mode
    const { userCapacity, emotionalState } = result.current.ctx.context
    expect(field.cognitive).toBe(userCapacity.cognitive)
    expect(field.temporal).toBe(userCapacity.temporal)
    expect(field.emotional).toBe(userCapacity.emotional)
    expect(field.valence).toBe(emotionalState.valence)
  })
})

describe("useEffectiveMotion", () => {
  it("returns mode, tokens, prefersReducedMotion", () => {
    const { result } = renderHook(() => useEffectiveMotion(), { wrapper })
    expect(result.current.mode).toMatch(/^(off|soothing|subtle|expressive)$/)
    expect(result.current.tokens).toBeDefined()
    expect(typeof result.current.prefersReducedMotion).toBe("boolean")
  })

  it("overrides motion to off when prefers-reduced-motion", () => {
    setupMatchMedia(true)
    const { result } = renderHook(() => useEffectiveMotion(), { wrapper })
    expect(result.current.mode).toBe("off")
    expect(result.current.prefersReducedMotion).toBe(true)
  })

  it("tokens match the effective motion mode", () => {
    const { result } = renderHook(() => useEffectiveMotion(), { wrapper })
    expect(result.current.tokens).toEqual(MOTION_TOKENS[result.current.mode])
  })
})

// ============================================================================
// EMA Smoothing (auto mode)
// ============================================================================
//
// These tests verify that auto-mode signal readings are smoothed with an
// exponential moving average (α = 0.2) before being written to FieldManager,
// so a single noisy poll cannot instantly flip the mode label.
//
// Timeline per test:
//   poll 1 — seeds the EMA baseline, NO write to FieldManager
//   poll 2 — first active write: smoothed = 0.8 × seed + 0.2 × new
//   poll 3 — second active write: smoothed = 0.8 × prev + 0.2 × new
//   …etc.

describe("auto mode EMA smoothing", () => {
  // Reset FieldManager to deterministic defaults so EMA arithmetic is exact.
  const RESET_CAPACITY = { cognitive: 0.5, temporal: 0.5, emotional: 0.5 }
  const RESET_EMOTIONAL = { valence: 0.0 }

  beforeEach(() => {
    vi.useFakeTimers()
    FieldManager.updateCapacity(RESET_CAPACITY)
    FieldManager.updateEmotionalState(RESET_EMOTIONAL)
  })

  afterEach(() => {
    vi.useRealTimers()
    // Restore default so non-EMA tests are unaffected if run after.
    mockAggregateSignals.mockResolvedValue(DEFAULT_SIGNAL)
  })

  it("first poll seeds the EMA baseline without writing to FieldManager", async () => {
    // Even though the poll returns 0.9, the first cycle only seeds smoothedFieldRef.
    // The FieldManager should remain at the reset value of 0.5.
    mockAggregateSignals.mockResolvedValue({ cognitive: 0.9, temporal: 0.5, emotional: 0.5, valence: 0.0 })

    const { result } = renderHook(() => useCapacityContext(), { wrapper })

    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // seed — no write

    expect(result.current.context.userCapacity.cognitive).toBe(0.5)
  })

  it("second poll applies α=0.2 blend (80% seed + 20% new value)", async () => {
    // seed = 0.5, active poll = 1.0
    // Expected: 0.8 × 0.5 + 0.2 × 1.0 = 0.60
    mockAggregateSignals
      .mockResolvedValueOnce({ cognitive: 0.5, temporal: 0.5, emotional: 0.5, valence: 0.0 }) // seed
      .mockResolvedValue({ cognitive: 1.0, temporal: 0.5, emotional: 0.5, valence: 0.0 })     // active polls

    const { result } = renderHook(() => useCapacityContext(), { wrapper })

    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // seed
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // → 0.60

    expect(result.current.context.userCapacity.cognitive).toBeCloseTo(0.60, 5)
  })

  it("EMA smoothing applies to all four dimensions simultaneously", async () => {
    // seed = all 0.5 / valence 0.0, active poll = all 1.0 / valence 0.4
    // Expected cognitive/temporal/emotional: 0.60; valence: 0.08
    mockAggregateSignals
      .mockResolvedValueOnce({ cognitive: 0.5, temporal: 0.5, emotional: 0.5, valence: 0.0 }) // seed
      .mockResolvedValue({ cognitive: 1.0, temporal: 1.0, emotional: 1.0, valence: 0.4 })     // active

    const { result } = renderHook(() => useCapacityContext(), { wrapper })

    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // seed
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // active

    const cap = result.current.context.userCapacity
    expect(cap.cognitive).toBeCloseTo(0.60, 5)
    expect(cap.temporal).toBeCloseTo(0.60, 5)
    expect(cap.emotional).toBeCloseTo(0.60, 5)
    expect(result.current.context.emotionalState.valence).toBeCloseTo(0.08, 5)
  })

  it("three consecutive polls converge toward the target", async () => {
    // seed = 0.5, then three active polls at 1.0:
    //   poll 2: 0.8 × 0.500 + 0.2 × 1.0 = 0.600
    //   poll 3: 0.8 × 0.600 + 0.2 × 1.0 = 0.680
    //   poll 4: 0.8 × 0.680 + 0.2 × 1.0 = 0.744
    mockAggregateSignals
      .mockResolvedValueOnce({ cognitive: 0.5, temporal: 0.5, emotional: 0.5, valence: 0.0 })
      .mockResolvedValue({ cognitive: 1.0, temporal: 0.5, emotional: 0.5, valence: 0.0 })

    const { result } = renderHook(() => useCapacityContext(), { wrapper })

    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // seed
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // → 0.600
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // → 0.680
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // → 0.744

    expect(result.current.context.userCapacity.cognitive).toBeCloseTo(0.744, 5)
  })

  it("a single outlier poll barely moves the smoothed field", async () => {
    // seed = 0.5, spike to 1.0, then returns to 0.5.
    //   after spike:  0.8 × 0.5  + 0.2 × 1.0 = 0.60
    //   after return: 0.8 × 0.60 + 0.2 × 0.5 = 0.58
    // The field recovers quickly — the spike left only a small residual.
    mockAggregateSignals
      .mockResolvedValueOnce({ cognitive: 0.5, temporal: 0.5, emotional: 0.5, valence: 0.0 }) // seed
      .mockResolvedValueOnce({ cognitive: 1.0, temporal: 0.5, emotional: 0.5, valence: 0.0 }) // spike
      .mockResolvedValue({ cognitive: 0.5, temporal: 0.5, emotional: 0.5, valence: 0.0 })     // return

    const { result } = renderHook(() => useCapacityContext(), { wrapper })

    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // seed
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // spike → 0.60
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // return → 0.58

    expect(result.current.context.userCapacity.cognitive).toBeCloseTo(0.58, 5)
    // Confirm it didn't jump anywhere near 1.0
    expect(result.current.context.userCapacity.cognitive).toBeLessThan(0.65)
  })

  it("EMA state resets when re-entering auto mode", async () => {
    // Build up EMA state: seed=0.5, active at 0.9 → smoothed=0.58.
    // Toggle auto off → on (resets EMA baseline).
    // New seed=0.5, new active at 0.7 → fresh EMA: 0.8×0.5 + 0.2×0.7 = 0.54.
    //
    // Without the reset, the stale smoothed value (0.58) would carry forward
    // and the second active poll would give a different result (~0.604).
    mockAggregateSignals
      .mockResolvedValueOnce({ cognitive: 0.5, temporal: 0.5, emotional: 0.5, valence: 0.0 }) // seed 1
      .mockResolvedValueOnce({ cognitive: 0.9, temporal: 0.5, emotional: 0.5, valence: 0.0 }) // active 1 → 0.58
      .mockResolvedValueOnce({ cognitive: 0.5, temporal: 0.5, emotional: 0.5, valence: 0.0 }) // seed 2
      .mockResolvedValue({ cognitive: 0.7, temporal: 0.5, emotional: 0.5, valence: 0.0 })     // active 2 → 0.54

    const { result } = renderHook(() => useCapacityContext(), { wrapper })

    // First auto-mode cycle
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // seed 1
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // active 1 → 0.58
    expect(result.current.context.userCapacity.cognitive).toBeCloseTo(0.58, 5)

    // Re-enter auto mode — this should reset smoothedFieldRef and isFirstAggregationComplete
    act(() => { result.current.toggleAutoMode() }) // → manual (interval stops)
    act(() => { result.current.toggleAutoMode() }) // → auto  (EMA refs reset, new interval)

    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // seed 2 — no write
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) }) // active 2 → 0.8×0.5 + 0.2×0.7 = 0.54

    expect(result.current.context.userCapacity.cognitive).toBeCloseTo(0.54, 5)
  })
})
