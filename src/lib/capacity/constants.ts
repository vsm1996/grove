/**
 * Capacity-Adaptive UI Constants
 *
 * Structural Principles Layer - Mathematical foundations for proportional design
 */

// ============================================================================
// Proportional Systems (Golden Ratio, Fibonacci)
// ============================================================================

/** Golden ratio φ */
export const PHI = 1.618033988749895

/** Inverse golden ratio (1/φ) */
export const PHI_INVERSE = 0.618033988749895

/** Fibonacci sequence for natural scaling steps */
export const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144] as const

// ============================================================================
// Auditory Feedback Frequencies (Hz) - Phase 3
// ============================================================================

/**
 * Frequency ranges for optional auditory feedback
 * Used for interaction confirmation and depth signaling
 * Note: These are constrained ranges, not healing claims
 */
export const FEEDBACK_FREQUENCIES = {
  low: 396, // Foundation/root elements
  mid: 528, // Primary interactive content
  high: 741, // Dynamic/feedback elements
} as const

// ============================================================================
// Field Defaults
// ============================================================================

/** Default field configuration */
export const DEFAULT_FIELD_CONFIG = {
  smoothing: 0.15, // Exponential smoothing factor
  velocityThreshold: 0.05, // Min velocity to register as trend
  debounceMs: 100, // Debounce rapid changes
} as const

/** Default user capacity (neutral state) */
export const DEFAULT_USER_CAPACITY = {
  cognitive: 0.7,
  temporal: 0.7,
  emotional: 0.7,
} as const

/** Default emotional state (positive to show expressive animations) */
export const DEFAULT_EMOTIONAL_STATE = {
  valence: 0.3, // > 0.15 (with emotional > 0.6) triggers expressive motion mode
  arousal: 0.5,
} as const

/** Default capacity field (neutral state) */
export const DEFAULT_CAPACITY_FIELD = {
  cognitive: 0.5,
  temporal: 0.5,
  emotional: 0.5,
  valence: 0.0,
} as const

// ============================================================================
// Component Response Presets
// ============================================================================

/**
 * Intelligent defaults for component responses
 * 90% of components can use these without override
 */
interface ComponentResponse {
  visual: {
    opacityRange: [number, number]
    scaleRange: [number, number]
  }
  spatial: {
    densityRange: [number, number]
    spacingMultiplier: [number, number]
  }
  sonic: {
    enabled: boolean
  }
  semantic: {
    verbosityLevel: string
    urgencyFraming: string
  }
}

export const DEFAULT_COMPONENT_RESPONSE: ComponentResponse = {
  visual: {
    opacityRange: [0.4, 1.0],
    scaleRange: [0.95, 1.0],
  },
  spatial: {
    densityRange: [0.6, 1.0],
    spacingMultiplier: [1.0, PHI],
  },
  sonic: {
    enabled: false, // Opt-in
  },
  semantic: {
    verbosityLevel: "concise",
    urgencyFraming: "neutral",
  },
} as const

// ============================================================================
// Accessibility Constants
// ============================================================================

/** Minimum contrast ratio (WCAG AA) - invariant across all states */
export const MIN_CONTRAST_RATIO = 4.5

/** Reduced motion media query key */
export const PREFERS_REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

/** Maximum animation duration (ms) for time-sensitive users */
export const MAX_ANIMATION_DURATION_MS = 300

// ============================================================================
// Motion Tokens
// ============================================================================

/**
 * Motion tokens by mode
 * 
 * "off" means no decorative motion, NOT no transitions at all.
 * You still keep: opacity fades, height/visibility transitions, focus transitions.
 * This preserves usability and avoids "broken UI" feelings.
 * 
 * "subtle" = grounded, low-amplitude, slow easing
 * "expressive" = playful, elastic, higher amplitude
 */
export const MOTION_TOKENS = {
  off: {
    durationFast: 0,
    durationBase: 0,
    durationSlow: 0,
    easing: "linear",
    // Essential transitions still allowed (opacity, focus rings)
    essentialDuration: 100,
    essentialEasing: "ease-out",
  },
  soothing: {
    durationFast: 0, // No fast motion -- everything is slow and rhythmic
    durationBase: 800,
    durationSlow: 1200,
    easing: "ease-in-out", // Smooth, no sharp edges
    essentialDuration: 200,
    essentialEasing: "ease-in-out",
  },
  subtle: {
    durationFast: 100,
    durationBase: 200,
    durationSlow: 350,
    easing: "ease-out",
    essentialDuration: 150,
    essentialEasing: "ease-out",
  },
  expressive: {
    durationFast: 200,
    durationBase: 400,
    durationSlow: 700,
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Spring-like overshoot
    essentialDuration: 150,
    essentialEasing: "ease-out",
  },
} as const
