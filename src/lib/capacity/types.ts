/**
 * Core Types for Capacity-Adaptive UI Framework
 *
 * Type definitions that govern the capacity-adaptive system
 */

// ============================================================================
// Capacity Field - The Canonical Input Model (Phase 1)
// ============================================================================

/**
 * CapacityField - The 4-input model that drives the entire framework
 *
 * This is the FIRST-CLASS input object. Everything else derives from this.
 * - cognitive, temporal, emotional: 0-1 (capacity dimensions)
 * - valence: -1 to +1 (emotional direction)
 *
 * Field → Mode → Tokens → Components is the pipeline.
 */
export interface CapacityField {
  /** Cognitive bandwidth available (0 = overwhelmed, 1 = sharp) */
  cognitive: number

  /** Time/effort budget (0 = rushed, 1 = abundant) */
  temporal: number

  /** Emotional load tolerance (0 = fragile, 1 = resilient) */
  emotional: number

  /** Emotional direction (-1 = negative, 0 = neutral, +1 = positive) */
  valence: number

  /** Energy/activation level (0 = calm, 1 = activated) — Phase 3 */
  arousal?: number
}

// ============================================================================
// Interface Mode - Derived from CapacityField
// ============================================================================

/**
 * Density modes - How much information to show
 */
export type DensityMode = "low" | "medium" | "high"

/**
 * Guidance modes - How much explanation/help to provide
 */
export type GuidanceMode = "low" | "medium" | "high"

/**
 * Motion modes - Animation intensity
 *
 * off:        No decorative motion (protective, exhausted)
 * soothing:   Slow rhythmic motion only (breathe, float, gentle-fade)
 * subtle:     Grounded, low-amplitude (sacred-fade, hover-lift, bloom)
 * expressive: Full animation suite (vortex, spiral, morph, helix, vibrate)
 */
export type MotionMode = "off" | "soothing" | "subtle" | "expressive"

/**
 * Contrast modes - Visual contrast level
 */
export type ContrastMode = "standard" | "boosted"

/**
 * Choice load modes - Number of options/decisions
 */
export type ChoiceLoadMode = "minimal" | "normal"

/**
 * Arousal (pace) modes - Animation pacing from arousal level
 *
 * calm:      Low arousal (< 0.35) — slow, deliberate pacing
 * neutral:   Normal arousal (0.35–0.65) — standard pacing
 * activated: High arousal (> 0.65) — faster, energetic pacing
 */
export type ArousalMode = "calm" | "neutral" | "activated"

/**
 * Focus modes - Attention guidance for important elements
 *
 * default:  No special treatment for important elements
 * gentle:   Soft highlight on important elements (muted glow, border accent)
 *           Activated at medium cognitive capacity (calm users)
 * guided:   Strong attention-drawing animation + contrast boost
 *           Activated at low cognitive capacity (distracted users)
 */
export type FocusMode = "default" | "gentle" | "guided"

/**
 * InterfaceMode - The coherent UI state derived from CapacityField
 *
 * This prevents "sliders controlling random stuff" and instead gives
 * "sliders selecting a coherent state"
 */
export interface InterfaceMode {
  density: DensityMode
  guidance: GuidanceMode
  motion: MotionMode
  contrast: ContrastMode
  choiceLoad: ChoiceLoadMode
  focus: FocusMode
  /** Animation pacing derived from arousal (Phase 3) */
  pace: ArousalMode
}

/**
 * Human-readable mode labels for UI display
 */
export type InterfaceModeLabel = "Calm" | "Focused" | "Exploratory" | "Minimal"

// ============================================================================
// User Capacity Model (Legacy - maps to CapacityField)
// ============================================================================

/**
 * Three-dimensional model of user capacity
 * All values normalized to 0-1 range
 */
export interface UserCapacity {
  /** Cognitive bandwidth available (attention, working memory) */
  cognitive: number

  /** Time pressure inverse (1 = abundant time, 0 = urgent) */
  temporal: number

  /** Emotional regulation capacity (1 = regulated, 0 = dysregulated) */
  emotional: number
}

// ============================================================================
// Emotional State
// ============================================================================

/**
 * Two-dimensional affect model (Russell's Circumplex)
 * Note: Arousal is Phase 2+. Phase 1 uses only valence.
 */
export interface EmotionalState {
  /** Positive/negative affect (-1 to +1) */
  valence: number

  /** Energy/activation level (0 to 1) - Phase 2+ */
  arousal: number
}

// ============================================================================
// Field Values with Temporal Context
// ============================================================================

/**
 * Field value wrapper that tracks change over time
 * Enables anticipatory component responses
 */
export interface FieldValue<T> {
  /** Current value */
  value: T

  /** Timestamp of last change (ms) */
  lastChange: number

  /** Trend direction: 'rising' | 'falling' | 'stable' */
  trend: "rising" | "falling" | "stable"

  /** Rate of change per second (for numeric values) */
  velocity?: number
}

// ============================================================================
// Signals & Events
// ============================================================================

/**
 * Priority levels for signal routing
 */
export type SignalPriority = "critical" | "high" | "normal" | "low"

/**
 * Type-safe signal for inter-component communication
 */
export interface Signal<T = unknown> {
  /** Signal type identifier */
  type: string

  /** Signal payload */
  payload: T

  /** Timestamp of emission */
  timestamp: number

  /** Priority level */
  priority: SignalPriority

  /** Optional source component identifier */
  source?: string
}

/**
 * Signal subscription handler
 */
export type SignalHandler<T = unknown> = (signal: Signal<T>) => void

/**
 * Cleanup function returned by subscriptions
 */
export type Unsubscribe = () => void

// ============================================================================
// Component Response Model
// ============================================================================

/**
 * Multi-modal response specification for components
 * Components declare how they respond across sensory dimensions
 */
export interface ComponentResponse {
  /** Visual adaptations (color, opacity, scale) */
  visual: {
    opacityRange: [number, number]
    scaleRange: [number, number]
    colorShift?: {
      hue?: number
      chroma?: number
      lightness?: number
    }
  }

  /** Spatial adaptations (spacing, density) */
  spatial: {
    densityRange: [number, number] // Information density multiplier
    spacingMultiplier: [number, number] // φ-based spacing adjustment
  }

  /** Sonic adaptations (frequency, amplitude) */
  sonic: {
    enabled: boolean
    frequencyHz?: number // Solfeggio frequency for depth
    amplitude?: number // 0-1, sub-audible + haptic
  }

  /** Semantic adaptations (verbosity, urgency framing) */
  semantic: {
    verbosityLevel: "minimal" | "concise" | "detailed"
    urgencyFraming: "calm" | "neutral" | "urgent"
  }
}

// ============================================================================
// Ambient Field Types
// ============================================================================

/**
 * Energy field - composite of all capacity dimensions
 * Primary driver of animation intensity and complexity
 */
export type EnergyFieldValue = FieldValue<number>

/**
 * Attention field - temporal pressure + focus
 * Influences information density and urgency cues
 */
export type AttentionFieldValue = FieldValue<number>

/**
 * Emotional valence field - affect direction
 * Influences color warmth and message framing
 */
export type EmotionalValenceFieldValue = FieldValue<number>

// ============================================================================
// Field Configuration
// ============================================================================

/**
 * Configuration for field behavior
 */
export interface FieldConfig {
  /** Smoothing factor for field transitions (0-1) */
  smoothing: number

  /** Velocity threshold for trend detection */
  velocityThreshold: number

  /** Debounce time for rapid changes (ms) */
  debounceMs: number
}

// ============================================================================
// Component Ambient Context
// ============================================================================

/**
 * The ambient context every component can read
 * Components subscribe to specific fields, never the whole context
 */
export interface AmbientContext {
  energy: EnergyFieldValue
  attention: AttentionFieldValue
  emotionalValence: EmotionalValenceFieldValue

  /** Raw user capacity (before field derivation) */
  userCapacity: UserCapacity

  /** Raw emotional state (before field derivation) */
  emotionalState: EmotionalState
}

// ============================================================================
// Typography Types
// ============================================================================

/**
 * Typography roles in the UI hierarchy
 * Maps to semantic HTML elements
 */
export type TypographyRole = "h1" | "h2" | "h3" | "h4" | "body" | "caption" | "label"

/**
 * Energy levels derived from EnergyField
 * Influences sizing bias for cognitive adaptation
 */
export type EnergyLevel = "low" | "medium" | "high"

/**
 * Attention levels derived from AttentionField
 * Influences weight and spacing for focus
 */
export type AttentionLevel = "low" | "medium" | "high"
