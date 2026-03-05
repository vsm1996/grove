/**
 * Capacity-aware animation class utilities.
 *
 * Centralizes the repeated pattern of selecting CSS animation classes
 * based on the current motion mode (off / subtle / expressive).
 * Each section was independently deriving the same entranceClass / hoverClass /
 * ambientClass -- this module makes it a single source of truth.
 */

import type { MotionMode, FocusMode } from "./types"

// ============================================================================
// Entrance animations (one-shot, runs once when section scrolls into view)
// ============================================================================

/**
 * Map of named entrance animation presets.
 * Each preset maps a MotionMode to a CSS class name from globals.css.
 * "off" always maps to "" (no animation).
 */
const ENTRANCE_PRESETS = {
  /** Liquid organic morph -> gentle scale fade -> soft bloom -> none */
  morph: { expressive: "morph-fade-in", subtle: "sacred-fade", soothing: "bloom", off: "" },
  /** Spinning vortex -> gentle scale fade -> soft bloom -> none */
  vortex: { expressive: "vortex-reveal", subtle: "sacred-fade", soothing: "bloom", off: "" },
  /** Spiral in from corner -> soft bloom -> soft bloom -> none */
  spiral: { expressive: "spiral-in", subtle: "bloom", soothing: "bloom", off: "" },
} as const

type EntrancePreset = keyof typeof ENTRANCE_PRESETS

/**
 * Returns the appropriate entrance animation class for the given motion mode.
 * Returns "" when hasPlayed is true, preventing re-render flicker.
 */
export function entranceClass(
  motion: MotionMode,
  preset: EntrancePreset,
  hasPlayed: boolean,
): string {
  if (hasPlayed) return ""
  return ENTRANCE_PRESETS[preset][motion]
}

// ============================================================================
// Hover animations (applied as a persistent class, triggered by :hover in CSS)
// ============================================================================

/**
 * Returns the appropriate hover animation class.
 * "off" mode disables hover animations entirely.
 */
export function hoverClass(motion: MotionMode): string {
  if (motion === "expressive") return "hover-expand"
  if (motion === "subtle" || motion === "soothing") return "hover-lift"
  return ""
}

// ============================================================================
// Ambient animations (looping, always active while mode is expressive)
// ============================================================================

/**
 * Returns a class for continuous ambient animation (breathing, floating, etc.)
 *
 * - expressive: all ambient types active
 * - soothing: only slow, rhythmic types (breathe, float) -- calms the nervous system
 * - subtle / off: no ambient animation
 */
export function ambientClass(motion: MotionMode, type: "breathe" | "float" | "pulse" | "vibrate"): string {
  if (motion === "expressive") return type
  if (motion === "soothing" && (type === "breathe" || type === "float")) return type
  return ""
}

/**
 * Returns the appropriate animation class for list items (staggered entrance).
 * Expressive: helix-rise, Subtle: sacred-fade, Off: none.
 */
export function listItemClass(motion: MotionMode): string {
  if (motion === "expressive") return "helix-rise"
  if (motion === "subtle" || motion === "soothing") return "sacred-fade"
  return ""
}

// ============================================================================
// Focus / attention-drawing classes (activated by FocusMode "guided" or "gentle")
// ============================================================================

/**
 * Returns attention-beacon class for important container elements (cards, CTAs).
 * - guided: strong warm glow (3s cycle) + border accent
 * - gentle: muted cool glow (5s cycle) + softer border
 * - default: no treatment
 */
export function focusBeaconClass(focus: FocusMode): string {
  if (focus === "guided") return "attention-beacon focus-highlight"
  if (focus === "gentle") return "gentle-beacon gentle-highlight"
  return ""
}

/**
 * Returns attention-text class for important headings / labels.
 * - guided: warm text-shadow pulse (3s)
 * - gentle: cool text-shadow pulse (5s)
 * - default: no treatment
 */
export function focusTextClass(focus: FocusMode): string {
  if (focus === "guided") return "attention-text"
  if (focus === "gentle") return "gentle-text"
  return ""
}
