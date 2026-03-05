/**
 * Field Manager - Singleton that maintains ambient field state
 *
 * Components subscribe to fields, never write to them
 * Only Phase 1 slider system writes field values
 */

import type { AmbientContext, UserCapacity, EmotionalState, FieldValue, FieldConfig } from "../types"
import { DEFAULT_USER_CAPACITY, DEFAULT_EMOTIONAL_STATE, DEFAULT_FIELD_CONFIG } from "../constants"

// ============================================================================
// Field Derivation Functions
// ============================================================================

/**
 * Derives energy field from user capacity
 * Energy = geometric mean of all capacity dimensions
 */
function deriveEnergyField(capacity: UserCapacity): number {
  const { cognitive, temporal, emotional } = capacity
  return Math.pow(cognitive * temporal * emotional, 1 / 3)
}

/**
 * Derives attention field from temporal pressure
 * Attention inversely related to time availability
 */
function deriveAttentionField(capacity: UserCapacity): number {
  // When temporal capacity is low (time pressure high), attention demand increases
  return 1 - capacity.temporal * 0.5 // Range: 0.5 to 1.0
}

/**
 * Derives emotional valence field from emotional state
 * Direct mapping of valence dimension
 */
function deriveEmotionalValenceField(state: EmotionalState): number {
  return state.valence
}

// ============================================================================
// Field Value Factory
// ============================================================================

/**
 * Creates a field value with temporal tracking
 */
function createFieldValue<T>(value: T, previousValue?: FieldValue<T>): FieldValue<T> {
  const now = Date.now()
  const lastChange = previousValue?.lastChange ?? now
  const timeDelta = (now - lastChange) / 1000 // seconds

  let trend: "rising" | "falling" | "stable" = "stable"
  let velocity: number | undefined

  if (typeof value === "number" && previousValue && typeof previousValue.value === "number") {
    const valueDelta = value - previousValue.value
    velocity = timeDelta > 0 ? valueDelta / timeDelta : 0

    if (Math.abs(velocity) > DEFAULT_FIELD_CONFIG.velocityThreshold) {
      trend = velocity > 0 ? "rising" : "falling"
    }
  }

  return {
    value,
    lastChange: now,
    trend,
    velocity,
  }
}

// ============================================================================
// Field Manager Class
// ============================================================================

type FieldChangeListener = (context: AmbientContext) => void

class FieldManagerClass {
  private context: AmbientContext
  private listeners: Set<FieldChangeListener> = new Set()
  private config: FieldConfig = DEFAULT_FIELD_CONFIG

  constructor() {
    const initialCapacity = DEFAULT_USER_CAPACITY
    const initialState = DEFAULT_EMOTIONAL_STATE

    this.context = {
      energy: createFieldValue(deriveEnergyField(initialCapacity)),
      attention: createFieldValue(deriveAttentionField(initialCapacity)),
      emotionalValence: createFieldValue(deriveEmotionalValenceField(initialState)),
      userCapacity: initialCapacity,
      emotionalState: initialState,
    }
  }

  /**
   * Get current ambient context (read-only)
   */
  getContext(): Readonly<AmbientContext> {
    return this.context
  }

  /**
   * Update user capacity (Phase 1 slider system writes here)
   */
  updateCapacity(capacity: Partial<UserCapacity>): void {
    const newCapacity = { ...this.context.userCapacity, ...capacity }

    this.context = {
      ...this.context,
      userCapacity: newCapacity,
      energy: createFieldValue(deriveEnergyField(newCapacity), this.context.energy),
      attention: createFieldValue(deriveAttentionField(newCapacity), this.context.attention),
    }

    this.notifyListeners()
  }

  /**
   * Update emotional state (Phase 1 slider system writes here)
   */
  updateEmotionalState(state: Partial<EmotionalState>): void {
    const newState = { ...this.context.emotionalState, ...state }

    this.context = {
      ...this.context,
      emotionalState: newState,
      emotionalValence: createFieldValue(deriveEmotionalValenceField(newState), this.context.emotionalValence),
    }

    this.notifyListeners()
  }

  /**
   * Subscribe to field changes
   */
  subscribe(listener: FieldChangeListener): () => void {
    this.listeners.add(listener)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of field changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.context)
      } catch (error) {
        console.error("[v0] Field listener error:", error)
      }
    })
  }

  /**
   * Update field configuration
   */
  updateConfig(config: Partial<FieldConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current field configuration
   */
  getConfig(): Readonly<FieldConfig> {
    return this.config
  }
}

// Singleton instance
export const FieldManager = new FieldManagerClass()
