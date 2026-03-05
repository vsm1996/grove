/**
 * Signal Bus - Type-safe pub/sub for inter-component communication
 *
 * Components emit signals, never directly call each other
 */

import type { Signal, SignalHandler, Unsubscribe, SignalPriority } from "../types"

// ============================================================================
// Signal Bus Class
// ============================================================================

class SignalBusClass {
  private handlers: Map<string, Set<SignalHandler>> = new Map()
  private signalQueue: Signal[] = []
  private processing = false

  /**
   * Emit a signal to all subscribed handlers
   */
  emit<T = unknown>(type: string, payload: T, priority: SignalPriority = "normal", source?: string): void {
    const signal: Signal<T> = {
      type,
      payload,
      timestamp: Date.now(),
      priority,
      source,
    }

    // Add to queue based on priority
    if (priority === "critical") {
      this.signalQueue.unshift(signal)
    } else {
      this.signalQueue.push(signal)
    }

    // Process queue
    this.processQueue()
  }

  /**
   * Subscribe to a specific signal type
   */
  subscribe<T = unknown>(type: string, handler: SignalHandler<T>): Unsubscribe {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }

    const handlers = this.handlers.get(type)!
    handlers.add(handler as SignalHandler)

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as SignalHandler)
      if (handlers.size === 0) {
        this.handlers.delete(type)
      }
    }
  }

  /**
   * Subscribe to multiple signal types with same handler
   */
  subscribeMultiple<T = unknown>(types: string[], handler: SignalHandler<T>): Unsubscribe {
    const unsubscribers = types.map((type) => this.subscribe(type, handler))

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }

  /**
   * Process signal queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.signalQueue.length === 0) {
      return
    }

    this.processing = true

    while (this.signalQueue.length > 0) {
      const signal = this.signalQueue.shift()!
      const handlers = this.handlers.get(signal.type)

      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(signal)
          } catch (error) {
            console.error(`[v0] Signal handler error for "${signal.type}":`, error)
          }
        })
      }
    }

    this.processing = false
  }

  /**
   * Get count of handlers for a signal type
   */
  getHandlerCount(type: string): number {
    return this.handlers.get(type)?.size ?? 0
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear()
    this.signalQueue = []
  }
}

// Singleton instance
export const SignalBus = new SignalBusClass()

// ============================================================================
// Common Signal Types (String Constants)
// ============================================================================

export const SIGNAL_TYPES = {
  // Field changes
  FIELD_ENERGY_CHANGED: "field:energy:changed",
  FIELD_ATTENTION_CHANGED: "field:attention:changed",
  FIELD_VALENCE_CHANGED: "field:valence:changed",

  // User interactions
  USER_INTERACTION_START: "user:interaction:start",
  USER_INTERACTION_END: "user:interaction:end",
  USER_FOCUS_CHANGED: "user:focus:changed",

  // Component lifecycle
  COMPONENT_MOUNTED: "component:mounted",
  COMPONENT_UNMOUNTED: "component:unmounted",

  // Accessibility
  A11Y_ANNOUNCE: "a11y:announce",
  A11Y_FOCUS_TRAP: "a11y:focus:trap",
} as const
