import { describe, it, expect, beforeEach, vi } from "vitest"

// We re-import a fresh module each test to avoid singleton state pollution
// by isolating using vi.resetModules
describe("FieldManager", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function getFieldManager() {
    const { FieldManager } = await import("../fields/field-manager")
    return FieldManager
  }

  it("initializes with default user capacity", async () => {
    const fm = await getFieldManager()
    const { DEFAULT_USER_CAPACITY } = await import("../constants")
    const ctx = fm.getContext()
    expect(ctx.userCapacity.cognitive).toBe(DEFAULT_USER_CAPACITY.cognitive)
    expect(ctx.userCapacity.temporal).toBe(DEFAULT_USER_CAPACITY.temporal)
    expect(ctx.userCapacity.emotional).toBe(DEFAULT_USER_CAPACITY.emotional)
  })

  it("initializes with default emotional state", async () => {
    const fm = await getFieldManager()
    const { DEFAULT_EMOTIONAL_STATE } = await import("../constants")
    const ctx = fm.getContext()
    expect(ctx.emotionalState.valence).toBe(DEFAULT_EMOTIONAL_STATE.valence)
    expect(ctx.emotionalState.arousal).toBe(DEFAULT_EMOTIONAL_STATE.arousal)
  })

  it("derives energy field from initial capacity as geometric mean", async () => {
    const fm = await getFieldManager()
    const { DEFAULT_USER_CAPACITY } = await import("../constants")
    const { cognitive, temporal, emotional } = DEFAULT_USER_CAPACITY
    const expected = Math.pow(cognitive * temporal * emotional, 1 / 3)
    expect(fm.getContext().energy.value).toBeCloseTo(expected, 5)
  })

  it("derives attention field from initial capacity", async () => {
    const fm = await getFieldManager()
    const { DEFAULT_USER_CAPACITY } = await import("../constants")
    const expected = 1 - DEFAULT_USER_CAPACITY.temporal * 0.5
    expect(fm.getContext().attention.value).toBeCloseTo(expected, 5)
  })

  it("updateCapacity changes energy and attention fields", async () => {
    const fm = await getFieldManager()
    const before = fm.getContext().energy.value
    fm.updateCapacity({ cognitive: 0.9, temporal: 0.9, emotional: 0.9 })
    const after = fm.getContext().energy.value
    expect(after).not.toBe(before)
    expect(after).toBeGreaterThan(0.8)
  })

  it("updateCapacity merges partial updates", async () => {
    const fm = await getFieldManager()
    const originalTemporal = fm.getContext().userCapacity.temporal
    fm.updateCapacity({ cognitive: 0.2 })
    expect(fm.getContext().userCapacity.cognitive).toBe(0.2)
    expect(fm.getContext().userCapacity.temporal).toBe(originalTemporal)
  })

  it("updateEmotionalState updates valence field", async () => {
    const fm = await getFieldManager()
    fm.updateEmotionalState({ valence: -0.8 })
    expect(fm.getContext().emotionalValence.value).toBe(-0.8)
  })

  it("updateEmotionalState merges partial updates", async () => {
    const fm = await getFieldManager()
    const originalArousal = fm.getContext().emotionalState.arousal
    fm.updateEmotionalState({ valence: 0.5 })
    expect(fm.getContext().emotionalState.arousal).toBe(originalArousal)
  })

  it("subscribe notifies listener on capacity update", async () => {
    const fm = await getFieldManager()
    const listener = vi.fn()
    const unsub = fm.subscribe(listener)
    fm.updateCapacity({ cognitive: 0.3 })
    expect(listener).toHaveBeenCalledOnce()
    unsub()
  })

  it("subscribe returns unsubscribe that stops notifications", async () => {
    const fm = await getFieldManager()
    const listener = vi.fn()
    const unsub = fm.subscribe(listener)
    unsub()
    fm.updateCapacity({ cognitive: 0.3 })
    expect(listener).not.toHaveBeenCalled()
  })

  it("multiple listeners are all notified", async () => {
    const fm = await getFieldManager()
    const l1 = vi.fn()
    const l2 = vi.fn()
    const u1 = fm.subscribe(l1)
    const u2 = fm.subscribe(l2)
    fm.updateCapacity({ cognitive: 0.6 })
    expect(l1).toHaveBeenCalledOnce()
    expect(l2).toHaveBeenCalledOnce()
    u1()
    u2()
  })

  it("listener error does not crash other listeners", async () => {
    const fm = await getFieldManager()
    const bad = vi.fn(() => { throw new Error("boom") })
    const good = vi.fn()
    const u1 = fm.subscribe(bad)
    const u2 = fm.subscribe(good)
    expect(() => fm.updateCapacity({ cognitive: 0.5 })).not.toThrow()
    expect(good).toHaveBeenCalledOnce()
    u1()
    u2()
  })

  it("updateConfig merges config", async () => {
    const fm = await getFieldManager()
    fm.updateConfig({ smoothing: 0.99 })
    expect(fm.getConfig().smoothing).toBe(0.99)
  })

  it("energy field trend is 'stable' initially", async () => {
    const fm = await getFieldManager()
    expect(fm.getContext().energy.trend).toBe("stable")
  })

  it("FieldValue has lastChange timestamp", async () => {
    const fm = await getFieldManager()
    expect(fm.getContext().energy.lastChange).toBeGreaterThan(0)
  })
})
