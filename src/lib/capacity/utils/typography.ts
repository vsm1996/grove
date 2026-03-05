/**
 * Typography Utilities - Renge (Proportional Form)
 *
 * Font scaling based on golden ratio with subtle randomness
 * and energy-based adjustments for cognitive load adaptation.
 *
 * Philosophy:
 * - Legibility first: minimum sizes and contrast are non-negotiable
 * - φ-based modular scale prevents arbitrary sizing
 * - Small random jitter (±5%) prevents mechanical rigidity
 * - Energy-based bias: low energy = larger (readability), high = smaller (density)
 */

import { PHI, FIBONACCI } from "../constants"
import type { DensityMode } from "../types"

// ============================================================================
// Type Definitions
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

// ============================================================================
// Constants
// ============================================================================

/** Base font size in pixels (browser default) */
const BASE_FONT_SIZE = 16

/** Minimum font size for accessibility (WCAG) */
const MIN_FONT_SIZE = 14

/** Maximum random jitter factor (±5%) */
const JITTER_FACTOR = 0.05

/**
 * Scale steps for each typography role
 * Uses powers of φ for natural growth
 */
const SCALE_STEPS: Record<TypographyRole, number> = {
  h1: 4, // φ^4 ≈ 6.85x base
  h2: 3, // φ^3 ≈ 4.24x base
  h3: 2, // φ^2 ≈ 2.62x base
  h4: 1, // φ^1 ≈ 1.62x base
  body: 0, // φ^0 = 1x base
  label: -0.5, // φ^-0.5 ≈ 0.79x base
  caption: -1, // φ^-1 ≈ 0.62x base
}

/**
 * Energy-based size multipliers
 * Low energy: slightly larger for readability under cognitive load
 * High energy: slightly smaller for information density
 */
const ENERGY_BIAS: Record<EnergyLevel, number> = {
  low: 1.05, // +5% for better readability when tired
  medium: 1.0, // Neutral
  high: 0.95, // -5% for higher density when alert
}

/**
 * Attention-based font weight adjustments
 * Higher attention = bolder to aid focus
 */
const ATTENTION_WEIGHT: Record<AttentionLevel, number> = {
  low: 400, // Regular
  medium: 450, // Medium
  high: 500, // Medium-bold for focus
}

/**
 * Attention-based letter spacing (em units)
 * Tighter when focused, looser when relaxed
 */
const ATTENTION_TRACKING: Record<AttentionLevel, number> = {
  low: 0.02, // Loose tracking for comfortable reading
  medium: 0, // Normal
  high: -0.01, // Tight tracking for focus
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Modular scale function using golden ratio
 *
 * @param step - Power of φ to scale by (can be negative for smaller sizes)
 * @param base - Base size in pixels (default: 16)
 * @returns Scaled size in pixels
 *
 * Example:
 * modularScale(2) → 16 * φ^2 ≈ 41.89px
 * modularScale(-1) → 16 * φ^-1 ≈ 9.89px
 */
export function modularScale(step: number, base: number = BASE_FONT_SIZE): number {
  return base * Math.pow(PHI, step)
}

/**
 * Get font size with φ-based scaling, random jitter, and energy bias
 *
 * @param role - Typography role (h1, h2, body, etc.)
 * @param energy - Energy level from EnergyField (default: medium)
 * @param options - Optional overrides
 * @returns Font size in pixels (clamped to minimum)
 *
 * Design decisions:
 * 1. Uses φ-based modular scale for natural proportions
 * 2. Adds ±5% random jitter to prevent mechanical feel
 * 3. Biases size based on energy: low = larger, high = smaller
 * 4. Always respects minimum font size for accessibility
 */
export function getFontSize(
  role: TypographyRole,
  energy: EnergyLevel = "medium",
  options?: {
    base?: number
    jitter?: boolean
    minSize?: number
  },
): number {
  const { base = BASE_FONT_SIZE, jitter = true, minSize = MIN_FONT_SIZE } = options || {}

  // Calculate base scale from φ ratio
  const step = SCALE_STEPS[role]
  const baseSize = modularScale(step, base)

  // Apply random jitter (±5%) if enabled
  // This prevents the UI from feeling too rigid/mechanical
  const jitterAmount = jitter ? (Math.random() - 0.5) * 2 * JITTER_FACTOR : 0
  const jitteredSize = baseSize * (1 + jitterAmount)

  // Apply energy-based bias for cognitive adaptation
  const energyAdjustedSize = jitteredSize * ENERGY_BIAS[energy]

  // Clamp to minimum for accessibility
  return Math.max(energyAdjustedSize, minSize)
}

/**
 * Get font weight based on attention level
 *
 * @param attention - Attention level from AttentionField
 * @returns Font weight value (400-500)
 *
 * Higher attention = bolder text to help maintain focus
 */
export function getFontWeight(attention: AttentionLevel = "medium"): number {
  return ATTENTION_WEIGHT[attention]
}

/**
 * Get letter spacing based on attention level
 *
 * @param attention - Attention level from AttentionField
 * @returns Letter spacing in em units
 *
 * Tighter tracking when focused, looser when relaxed
 */
export function getLetterSpacing(attention: AttentionLevel = "medium"): number {
  return ATTENTION_TRACKING[attention]
}

/**
 * Get line height based on typography role
 *
 * @param role - Typography role
 * @returns Line height as unitless multiplier
 *
 * Design decisions:
 * - Headings: tighter (1.2-1.3) for visual impact
 * - Body: comfortable reading (1.5-1.6)
 * - Always maintains readability standards
 */
export function getLineHeight(role: TypographyRole): number {
  const lineHeights: Record<TypographyRole, number> = {
    h1: 1.2,
    h2: 1.25,
    h3: 1.3,
    h4: 1.35,
    body: 1.5,
    label: 1.4,
    caption: 1.45,
  }

  return lineHeights[role]
}

// ============================================================================
// Composite Helpers
// ============================================================================

/**
 * Get complete typography styles for a role
 *
 * @param role - Typography role
 * @param energy - Energy level from EnergyField
 * @param attention - Attention level from AttentionField
 * @returns Complete CSS-in-JS typography object
 *
 * Returns all typography properties in one call for convenience
 */
export function getTypographyStyles(
  role: TypographyRole,
  energy: EnergyLevel = "medium",
  attention: AttentionLevel = "medium",
) {
  return {
    fontSize: `${getFontSize(role, energy)}px`,
    fontWeight: getFontWeight(attention),
    lineHeight: getLineHeight(role),
    letterSpacing: `${getLetterSpacing(attention)}em`,
  }
}

/**
 * Get responsive font size with clamp()
 *
 * @param role - Typography role
 * @param energy - Energy level
 * @returns CSS clamp() expression for fluid typography
 *
 * Creates fluid typography that scales between viewport sizes
 * while respecting φ-based proportions
 */
export function getFluidFontSize(role: TypographyRole, energy: EnergyLevel = "medium"): string {
  const minSize = getFontSize(role, energy, { jitter: false })
  const maxSize = minSize * 1.2 // 20% range for fluidity

  // Fluid scaling between 320px and 1920px viewports
  return `clamp(${minSize}px, ${minSize}px + (${maxSize - minSize}) * ((100vw - 320px) / 1600), ${maxSize}px)`
}

// ============================================================================
// Proportional Spacing System (Fibonacci / Golden Ratio) — Phase 3
// ============================================================================

/** Base spacing unit in pixels (4px = 0.25rem grid) */
const SPACING_BASE = 4

/**
 * Fibonacci-based spacing scale.
 * Each step is a Fibonacci number × SPACING_BASE (4px):
 *
 * Step | Fibonacci | px  | rem
 * -----|-----------|-----|-----
 *  0   |     1     |  4  | 0.25
 *  1   |     1     |  4  | 0.25
 *  2   |     2     |  8  | 0.5
 *  3   |     3     | 12  | 0.75
 *  4   |     5     | 20  | 1.25
 *  5   |     8     | 32  | 2
 *  6   |    13     | 52  | 3.25
 *  7   |    21     | 84  | 5.25
 *  8   |    34     | 136 | 8.5
 *  9   |    55     | 220 | 13.75
 */
export const SPACING_SCALE = FIBONACCI.map((f) => f * SPACING_BASE)

/**
 * Get spacing value from Fibonacci scale.
 *
 * @param step - Scale step (0–11, maps to FIBONACCI sequence)
 * @param unit - Return "px" string, "rem" string, or raw number (default: "px")
 * @returns Spacing value
 *
 * @example
 * getSpacing(4)        // "20px"   (Fibonacci[4]=5 × 4)
 * getSpacing(5, "rem") // "2rem"   (Fibonacci[5]=8 × 4 / 16)
 * getSpacing(3, "raw") // 12
 */
export function getSpacing(
  step: number,
  unit: "px" | "rem" | "raw" = "px",
): string | number {
  const clampedStep = Math.max(0, Math.min(step, SPACING_SCALE.length - 1))
  const raw = SPACING_SCALE[clampedStep]

  if (unit === "raw") return raw
  if (unit === "rem") return `${(raw / 16).toFixed(4).replace(/\.?0+$/, "")}rem`
  return `${raw}px`
}

/**
 * Get proportional padding/gap values based on current density mode.
 *
 * Returns CSS-ready spacing strings using the Fibonacci scale,
 * scaled back at low density (less space) and up at high density (more breathing room).
 *
 * @param density - Current density mode from InterfaceMode
 * @returns Object of CSS spacing values for padding, gap, etc.
 */
export function getProportionalSpacing(density: DensityMode): {
  xs: string   // Inline/tight spacing
  sm: string   // Component internal padding
  md: string   // Section/card padding
  lg: string   // Between-section gap
  gap: string  // Grid/flex gap
} {
  // Fibonacci steps shift by density
  const shift = density === "low" ? -1 : density === "high" ? 1 : 0

  return {
    xs: getSpacing(2 + shift) as string,
    sm: getSpacing(3 + shift) as string,
    md: getSpacing(5 + shift) as string,
    lg: getSpacing(7 + shift) as string,
    gap: getSpacing(4 + shift) as string,
  }
}

/**
 * Get a φ-based size ratio for proportional component scaling.
 *
 * @param steps - Number of φ steps (positive = larger, negative = smaller)
 * @returns Unitless multiplier based on powers of φ
 *
 * @example
 * phiRatio(1)  // 1.618 — golden ratio
 * phiRatio(-1) // 0.618 — inverse golden ratio
 * phiRatio(2)  // 2.618 — φ²
 */
export function phiRatio(steps: number): number {
  return Math.pow(PHI, steps)
}
