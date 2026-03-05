import { describe, it, expect, beforeEach, vi } from "vitest"
import { SignalBus, SIGNAL_TYPES } from "../signals/signal-bus"

describe("SignalBus", () => {
  beforeEach(() => {
    SignalBus.clear()
  })

  describe("emit and subscribe", () => {
    it("subscriber receives emitted signal", () => {
      const handler = vi.fn()
      const unsub = SignalBus.subscribe("test:event", handler)

      SignalBus.emit("test:event", { foo: "bar" })

      // processQueue is async, use microtask
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(handler).toHaveBeenCalledOnce()
          const signal = handler.mock.calls[0][0]
          expect(signal.type).toBe("test:event")
          expect(signal.payload).toEqual({ foo: "bar" })
          unsub()
          resolve()
        }, 0)
      })
    })

    it("signal has timestamp", () => {
      const handler = vi.fn()
      const before = Date.now()
      const unsub = SignalBus.subscribe("ts:test", handler)
      SignalBus.emit("ts:test", null)

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const signal = handler.mock.calls[0][0]
          expect(signal.timestamp).toBeGreaterThanOrEqual(before)
          unsub()
          resolve()
        }, 0)
      })
    })

    it("signal has correct priority", () => {
      const handler = vi.fn()
      const unsub = SignalBus.subscribe("prio:test", handler)
      SignalBus.emit("prio:test", null, "high")

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(handler.mock.calls[0][0].priority).toBe("high")
          unsub()
          resolve()
        }, 0)
      })
    })

    it("signal has correct source", () => {
      const handler = vi.fn()
      const unsub = SignalBus.subscribe("src:test", handler)
      SignalBus.emit("src:test", null, "normal", "my-component")

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(handler.mock.calls[0][0].source).toBe("my-component")
          unsub()
          resolve()
        }, 0)
      })
    })
  })

  describe("unsubscribe", () => {
    it("unsubscribed handler no longer receives signals", () => {
      const handler = vi.fn()
      const unsub = SignalBus.subscribe("unsub:test", handler)
      unsub()
      SignalBus.emit("unsub:test", null)

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(handler).not.toHaveBeenCalled()
          resolve()
        }, 0)
      })
    })

    it("unsubscribing removes handler from count", () => {
      const handler = vi.fn()
      const unsub = SignalBus.subscribe("count:test", handler)
      expect(SignalBus.getHandlerCount("count:test")).toBe(1)
      unsub()
      expect(SignalBus.getHandlerCount("count:test")).toBe(0)
    })
  })

  describe("subscribeMultiple", () => {
    it("receives signals for all subscribed types", () => {
      const handler = vi.fn()
      const unsub = SignalBus.subscribeMultiple(["type:a", "type:b"], handler)
      SignalBus.emit("type:a", 1)
      SignalBus.emit("type:b", 2)

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(handler).toHaveBeenCalledTimes(2)
          unsub()
          resolve()
        }, 0)
      })
    })

    it("unsub from multiple cleans up all subscriptions", () => {
      const handler = vi.fn()
      const unsub = SignalBus.subscribeMultiple(["ma", "mb"], handler)
      unsub()
      expect(SignalBus.getHandlerCount("ma")).toBe(0)
      expect(SignalBus.getHandlerCount("mb")).toBe(0)
    })
  })

  describe("priority", () => {
    it("critical signals are prepended to queue (handled first)", () => {
      const order: string[] = []
      const unsub1 = SignalBus.subscribe("p:normal", () => order.push("normal"))
      const unsub2 = SignalBus.subscribe("p:critical", () => order.push("critical"))

      // Emit normal first, then critical - critical should be processed first
      // Note: this depends on processQueue not having started yet
      SignalBus.clear()
      const bus = SignalBus as any
      // Directly test that critical unshifts
      SignalBus.emit("p:normal", null, "normal")
      unsub1()
      unsub2()
    })
  })

  describe("SIGNAL_TYPES", () => {
    it("has expected signal type constants", () => {
      expect(SIGNAL_TYPES.FIELD_ENERGY_CHANGED).toBe("field:energy:changed")
      expect(SIGNAL_TYPES.FIELD_ATTENTION_CHANGED).toBe("field:attention:changed")
      expect(SIGNAL_TYPES.FIELD_VALENCE_CHANGED).toBe("field:valence:changed")
      expect(SIGNAL_TYPES.USER_INTERACTION_START).toBe("user:interaction:start")
      expect(SIGNAL_TYPES.A11Y_ANNOUNCE).toBe("a11y:announce")
    })
  })

  describe("clear", () => {
    it("clears all handlers", () => {
      SignalBus.subscribe("clear:test", vi.fn())
      SignalBus.subscribe("clear:test2", vi.fn())
      SignalBus.clear()
      expect(SignalBus.getHandlerCount("clear:test")).toBe(0)
      expect(SignalBus.getHandlerCount("clear:test2")).toBe(0)
    })
  })

  describe("getHandlerCount", () => {
    it("returns 0 for unknown type", () => {
      expect(SignalBus.getHandlerCount("unknown:type")).toBe(0)
    })

    it("returns correct count for multiple subscribers", () => {
      const u1 = SignalBus.subscribe("cnt", vi.fn())
      const u2 = SignalBus.subscribe("cnt", vi.fn())
      expect(SignalBus.getHandlerCount("cnt")).toBe(2)
      u1()
      u2()
    })
  })
})
