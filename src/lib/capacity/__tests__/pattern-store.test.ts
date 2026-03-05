import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { PatternStore } from "../prediction/pattern-store"
import type { CapacityField } from "../types"

const SAMPLE_FIELD: CapacityField = {
  cognitive: 0.7,
  temporal: 0.6,
  emotional: 0.8,
  valence: 0.2,
}

describe("PatternStore", () => {
  let store: PatternStore

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    store = new PatternStore()
  })

  describe("constructor", () => {
    it("initializes with empty history when localStorage is empty", () => {
      expect(store.getHistory()).toEqual([])
    })
  })

  describe("recordCapacity", () => {
    it("records a capacity field with a timestamp", () => {
      const before = Date.now()
      store.recordCapacity(SAMPLE_FIELD)
      const history = store.getHistory()

      expect(history).toHaveLength(1)
      expect(history[0].capacity).toEqual(SAMPLE_FIELD)
      expect(history[0].timestamp).toBeGreaterThanOrEqual(before)
    })

    it("appends multiple records", () => {
      store.recordCapacity(SAMPLE_FIELD)
      store.recordCapacity({ ...SAMPLE_FIELD, cognitive: 0.3 })
      expect(store.getHistory()).toHaveLength(2)
    })

    it("maintains max 100 items by evicting oldest", () => {
      for (let i = 0; i < 105; i++) {
        store.recordCapacity({ ...SAMPLE_FIELD, cognitive: i / 105 })
      }
      const history = store.getHistory()
      expect(history).toHaveLength(100)
      // Oldest (first 5) should be gone — newest should remain
      expect(history[history.length - 1].capacity.cognitive).toBeCloseTo(104 / 105, 3)
    })
  })

  describe("getHistory", () => {
    it("returns empty array when no records exist", () => {
      expect(store.getHistory()).toEqual([])
    })

    it("returns persisted data across store instances", () => {
      store.recordCapacity(SAMPLE_FIELD)
      const store2 = new PatternStore()
      expect(store2.getHistory()).toHaveLength(1)
    })
  })

  describe("clearHistory", () => {
    it("removes all records", () => {
      store.recordCapacity(SAMPLE_FIELD)
      store.clearHistory()
      expect(store.getHistory()).toHaveLength(0)
    })

    it("is idempotent on already-empty history", () => {
      expect(() => store.clearHistory()).not.toThrow()
      expect(store.getHistory()).toEqual([])
    })
  })

  describe("deleteItem", () => {
    it("removes item with matching timestamp", () => {
      store.recordCapacity(SAMPLE_FIELD)
      const history = store.getHistory()
      const ts = history[0].timestamp

      store.deleteItem(ts)
      expect(store.getHistory()).toHaveLength(0)
    })

    it("leaves other items intact", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"))
      store.recordCapacity(SAMPLE_FIELD)

      vi.setSystemTime(new Date("2024-01-01T00:00:01.000Z"))
      store.recordCapacity({ ...SAMPLE_FIELD, cognitive: 0.1 })

      const history = store.getHistory()
      const firstTs = history[0].timestamp

      store.deleteItem(firstTs)
      const remaining = store.getHistory()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].capacity.cognitive).toBeCloseTo(0.1, 5)
      vi.useRealTimers()
    })

    it("does nothing when timestamp not found", () => {
      store.recordCapacity(SAMPLE_FIELD)
      store.deleteItem(999999999)
      expect(store.getHistory()).toHaveLength(1)
    })
  })

  describe("updateItem", () => {
    it("updates capacity fields for matching timestamp", () => {
      store.recordCapacity(SAMPLE_FIELD)
      const history = store.getHistory()
      const ts = history[0].timestamp

      store.updateItem(ts, { cognitive: 0.1 })
      const updated = store.getHistory()
      expect(updated[0].capacity.cognitive).toBe(0.1)
      // Other fields should be unchanged
      expect(updated[0].capacity.temporal).toBe(SAMPLE_FIELD.temporal)
    })

    it("does nothing when timestamp not found", () => {
      store.recordCapacity(SAMPLE_FIELD)
      store.updateItem(999999999, { cognitive: 0.0 })
      expect(store.getHistory()[0].capacity.cognitive).toBe(SAMPLE_FIELD.cognitive)
    })
  })

  describe("localStorage error handling", () => {
    afterEach(() => {
      // Restore any spies
      vi.restoreAllMocks()
    })

    it("recordCapacity does not throw when localStorage.setItem throws DOMException", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("QuotaExceededError")
      })
      expect(() => store.recordCapacity(SAMPLE_FIELD)).not.toThrow()
    })

    it("getHistory returns empty array when localStorage.getItem throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage unavailable")
      })
      expect(store.getHistory()).toEqual([])
    })

    it("getHistory returns empty array when stored JSON is corrupt", () => {
      localStorage.setItem("harmonia-capacity-history", "not-valid-json{{{")
      const s = new PatternStore()
      expect(s.getHistory()).toEqual([])
    })

    it("clearHistory does not throw when localStorage.removeItem throws", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("Storage error")
      })
      expect(() => store.clearHistory()).not.toThrow()
    })
  })
})
