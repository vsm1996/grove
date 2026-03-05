/**
 * Multimodal Feedback - Phase 3
 *
 * Opt-in haptic and sonic feedback tied to capacity state.
 * Both channels are disabled by default (see DEFAULT_COMPONENT_RESPONSE.sonic.enabled).
 *
 * Haptic: Web Vibration API — short patterns on interaction
 * Sonic:  Web Audio API — sub-audible tones from FEEDBACK_FREQUENCIES
 *
 * Design constraints:
 * - Opt-in only: never fires without explicit user enablement
 * - Degrades silently on unsupported browsers
 * - Volume capped at 0.08 to keep tones sub-audible (felt, not heard prominently)
 * - Arousal-aware: higher arousal → higher frequency feedback
 */

import type { ArousalMode } from "./types"
import { FEEDBACK_FREQUENCIES } from "./constants"

// ============================================================================
// Haptic Feedback (Web Vibration API)
// ============================================================================

/** Haptic patterns (ms on/off durations) for different interaction types */
export const HAPTIC_PATTERNS = {
  /** Short tap — confirm/select */
  tap: [8],
  /** Two pulses — toggle/switch */
  toggle: [8, 50, 8],
  /** Gentle pulse — ambient/ambient confirmation */
  pulse: [15, 30, 15],
  /** Error/warning — three quick */
  error: [50, 30, 50, 30, 50],
} as const

export type HapticPatternName = keyof typeof HAPTIC_PATTERNS

/**
 * Trigger a haptic vibration pattern.
 * Silently no-ops on unsupported browsers (desktop, iOS Safari).
 */
export function triggerHaptic(pattern: HapticPatternName = "tap"): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(HAPTIC_PATTERNS[pattern])
  }
}

// ============================================================================
// Sonic Feedback (Web Audio API)
// ============================================================================

let _audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    if (!_audioCtx || _audioCtx.state === "closed") {
      _audioCtx = new AudioContext()
    }
    // Resume if suspended (browser autoplay policy)
    if (_audioCtx.state === "suspended") {
      _audioCtx.resume()
    }
    return _audioCtx
  } catch {
    return null
  }
}

/**
 * Play a short sine-wave tone for interaction confirmation.
 *
 * @param frequency - Hz from FEEDBACK_FREQUENCIES (396/528/741)
 * @param duration  - Tone length in ms (default 120)
 * @param volume    - Peak gain, 0–1 (default 0.06 — sub-audible)
 */
export function playSonicFeedback(
  frequency: number,
  duration: number = 120,
  volume: number = 0.06,
): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = "sine"
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

  // Fade in/out envelope to prevent click artifacts
  gainNode.gain.setValueAtTime(0, ctx.currentTime)
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.015)
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration / 1000 + 0.02)
}

/**
 * Select the appropriate frequency for the current arousal level.
 *
 * calm      → 396 Hz (low/root — grounding)
 * neutral   → 528 Hz (mid — balanced)
 * activated → 741 Hz (high — energetic)
 */
export function getFrequencyForPace(pace: ArousalMode): number {
  if (pace === "activated") return FEEDBACK_FREQUENCIES.high
  if (pace === "calm") return FEEDBACK_FREQUENCIES.low
  return FEEDBACK_FREQUENCIES.mid
}

/**
 * Play sonic feedback tuned to the current arousal/pace level.
 * Convenience wrapper over playSonicFeedback + getFrequencyForPace.
 */
export function playPacedSonic(pace: ArousalMode, duration?: number): void {
  playSonicFeedback(getFrequencyForPace(pace), duration)
}
