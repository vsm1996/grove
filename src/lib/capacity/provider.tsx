/**
 * Capacity Provider - React Context wrapper for ambient fields
 *
 * Wraps application root and exposes field hooks
 */

"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type Dispatch, type SetStateAction } from "react"
import type { AmbientContext, UserCapacity, EmotionalState, MotionMode, CapacityField, InterfaceMode } from "./types"
import { triggerHaptic, playPacedSonic, type HapticPatternName } from "./feedback"
import { FieldManager } from "./fields/field-manager"
import { deriveMode } from "./mode"
import { MOTION_TOKENS, DEFAULT_CAPACITY_FIELD } from "./constants"
import { SignalAggregator } from "./signals/aggregator"

// ============================================================================
// Context Definition
// ============================================================================

interface CapacityContextValue {
  context: AmbientContext
  updateCapacity: (capacity: Partial<UserCapacity>) => void
  updateEmotionalState: (state: Partial<EmotionalState>) => void
  isAutoMode: boolean;
  toggleAutoMode: () => void;
  updateCapacityField: (field: CapacityField) => void;
  hapticEnabled: boolean;
  sonicEnabled: boolean;
  setHapticEnabled: Dispatch<SetStateAction<boolean>>;
  setSonicEnabled: Dispatch<SetStateAction<boolean>>;
}

const CapacityContext = createContext<CapacityContextValue | null>(null)

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Exponential moving average weight for auto-mode signal smoothing.
 *
 * Each new reading contributes this fraction; the previous smoothed value
 * keeps (1 − α). A lower value means more smoothing and a longer "warm-up"
 * before a mode label actually flips — roughly α=0.2 means 4–5 consecutive
 * 2-second polls (~8–10 s) before a step-change lands at ≈ 67 % of its
 * final value, preventing single noisy readings from triggering a switch.
 */
const AUTO_EMA_ALPHA = 0.2;

function applyEMA(prev: CapacityField, next: CapacityField, alpha: number): CapacityField {
  return {
    cognitive: prev.cognitive * (1 - alpha) + next.cognitive * alpha,
    temporal:  prev.temporal  * (1 - alpha) + next.temporal  * alpha,
    emotional: prev.emotional * (1 - alpha) + next.emotional * alpha,
    valence:   prev.valence   * (1 - alpha) + next.valence   * alpha,
  };
}

export function CapacityProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<AmbientContext>(() => FieldManager.getContext());
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true); // Start in auto mode
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(false);
  const [sonicEnabled, setSonicEnabled] = useState<boolean>(false);
  const isFirstAggregationComplete = useRef<boolean>(false); // New ref to control initial aggregator application
  const smoothedFieldRef = useRef<CapacityField | null>(null); // EMA-smoothed field for auto mode
  const aggregatorRef = useRef<SignalAggregator | null>(null);

  useEffect(() => {
    // Initialize aggregator on mount
    aggregatorRef.current = new SignalAggregator();

    const unsubscribe = FieldManager.subscribe((newContext) => {
      setContext(newContext);
    });

    return () => {
      unsubscribe();
      // Clean up aggregator on unmount
      if (aggregatorRef.current) {
        aggregatorRef.current.destroy();
      }
    };
  }, []);

  // Effect to run aggregator in auto mode
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAutoMode && aggregatorRef.current) {
      // Reset smoothing state when (re-)entering auto mode so stale manual
      // slider positions don't bias the EMA baseline.
      isFirstAggregationComplete.current = false;
      smoothedFieldRef.current = null;
      intervalId = setInterval(async () => {
        try {
          const suggestedField = await aggregatorRef.current!.aggregateSignals();

          if (!isFirstAggregationComplete.current) {
            // Skip the very first aggregation — detectors need one cycle to stabilise.
            // Seed the EMA with this reading so the next poll has a sensible baseline.
            isFirstAggregationComplete.current = true;
            smoothedFieldRef.current = suggestedField;
          } else {
            // Apply EMA smoothing: new readings blend in gradually so a single
            // noisy poll can't instantly flip the mode label.
            smoothedFieldRef.current = applyEMA(
              smoothedFieldRef.current ?? suggestedField,
              suggestedField,
              AUTO_EMA_ALPHA,
            );
            const smoothed = smoothedFieldRef.current;
            FieldManager.updateCapacity({
              cognitive: smoothed.cognitive,
              temporal: smoothed.temporal,
              emotional: smoothed.emotional,
            });
            FieldManager.updateEmotionalState({
              valence: smoothed.valence,
            });
          }
        } catch (error) {
          // Log but do not crash — auto mode silently degrades on transient failures
          console.warn('[CapacityProvider] Signal aggregation failed:', error);
        }
      }, 2000); // Aggregate every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoMode]);

  // Memoized update functions
  const updateCapacity = useCallback((capacity: Partial<UserCapacity>) => {
    if (isAutoMode) {
      setIsAutoMode(false); // Switch to manual mode if user manually updates capacity
    }
    FieldManager.updateCapacity(capacity);
  }, [isAutoMode]);

  const updateEmotionalState = useCallback((state: Partial<EmotionalState>) => {
    if (isAutoMode) {
      setIsAutoMode(false); // Switch to manual mode if user manually updates emotional state
    }
    FieldManager.updateEmotionalState(state);
  }, [isAutoMode]);

  const updateCapacityField = useCallback((field: CapacityField) => {
    // This function can be used to set the full capacity field directly, regardless of auto mode.
    // Useful for initial setup or explicit overrides.
    FieldManager.updateCapacity({
      cognitive: field.cognitive,
      temporal: field.temporal,
      emotional: field.emotional,
    });
    FieldManager.updateEmotionalState({
      valence: field.valence,
    });
  }, []);

  const toggleAutoMode = useCallback(() => {
    setIsAutoMode((prev) => !prev);
  }, []);

  return (
    <CapacityContext.Provider value={{
      context, updateCapacity, updateEmotionalState, isAutoMode, toggleAutoMode, updateCapacityField,
      hapticEnabled, sonicEnabled, setHapticEnabled, setSonicEnabled,
    }}>
      {children}
    </CapacityContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access full ambient context
 * Most components should use specific field hooks instead
 */
export function useCapacityContext(): CapacityContextValue {
  const context = useContext(CapacityContext)
  if (!context) {
    throw new Error("useCapacityContext must be used within CapacityProvider")
  }
  return context
}

/**
 * Subscribe to energy field only
 */
export function useEnergyField() {
  const { context } = useCapacityContext()
  return context.energy
}

/**
 * Subscribe to attention field only
 */
export function useAttentionField() {
  const { context } = useCapacityContext()
  return context.attention
}

/**
 * Subscribe to emotional valence field only
 */
export function useEmotionalValenceField() {
  const { context } = useCapacityContext()
  return context.emotionalValence
}

/**
 * Get field update functions (for Phase 1 slider system)
 */
export function useFieldControls() {
  const { updateCapacity, updateEmotionalState, isAutoMode, toggleAutoMode, updateCapacityField } = useCapacityContext()
  return { updateCapacity, updateEmotionalState, isAutoMode, toggleAutoMode, updateCapacityField }
}

/**
 * Detect system prefers-reduced-motion preference
 * Returns true if user has requested reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check initial value
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Derive the full mode from current capacity context.
 * This is the primary hook for section-level components that need
 * the field values AND the derived mode together.
 * 
 * Eliminates the repeated { cognitive: context.userCapacity.cognitive, ... }
 * construction that was duplicated across every section component.
 */
export function useDerivedMode(): {
  field: CapacityField
  mode: InterfaceMode
} {
  const { context } = useCapacityContext()

  const field: CapacityField = {
    cognitive: context.userCapacity.cognitive,
    temporal: context.userCapacity.temporal,
    emotional: context.userCapacity.emotional,
    valence: context.emotionalState.valence,
    arousal: context.emotionalState.arousal,
  }

  const mode = deriveMode(field)

  return { field, mode }
}

/**
 * Get effective motion mode with system preference override
 *
 * System prefers-reduced-motion is a HARD OVERRIDE - non-negotiable on safety.
 * This ensures accessibility compliance regardless of derived mode.
 */
export function useEffectiveMotion(): {
  mode: MotionMode
  tokens: typeof MOTION_TOKENS[keyof typeof MOTION_TOKENS]
  prefersReducedMotion: boolean
} {
  const { field } = useDerivedMode()
  const prefersReducedMotion = usePrefersReducedMotion()

  const derivedMode = deriveMode(field)
  const effectiveMode: MotionMode = prefersReducedMotion ? "off" : derivedMode.motion

  return {
    mode: effectiveMode,
    tokens: MOTION_TOKENS[effectiveMode],
    prefersReducedMotion,
  }
}

/**
 * Access multimodal feedback preferences and fire helper.
 *
 * Reads opt-in flags from context — feedback only fires when the user
 * has explicitly enabled it in the CapacityControls panel.
 * Pace-aware: sonic frequency adapts to current arousal level.
 */
export function useFeedback(): {
  hapticEnabled: boolean
  sonicEnabled: boolean
  setHapticEnabled: Dispatch<SetStateAction<boolean>>
  setSonicEnabled: Dispatch<SetStateAction<boolean>>
  fire: (pattern?: HapticPatternName) => void
} {
  const { hapticEnabled, sonicEnabled, setHapticEnabled, setSonicEnabled } = useCapacityContext()
  const { mode } = useDerivedMode()

  const fire = useCallback((pattern: HapticPatternName = "tap") => {
    if (hapticEnabled) triggerHaptic(pattern)
    if (sonicEnabled) playPacedSonic(mode.pace)
  }, [hapticEnabled, sonicEnabled, mode.pace])

  return { hapticEnabled, sonicEnabled, setHapticEnabled, setSonicEnabled, fire }
}

/**
 * Get motion tokens with arousal-based pacing applied (Phase 3)
 *
 * Arousal independently controls animation speed:
 * - calm (< 0.35): +50% duration — slow, deliberate
 * - neutral (0.35–0.65): standard duration
 * - activated (> 0.65): -35% duration — fast, energetic
 *
 * System prefers-reduced-motion overrides pace to "calm" for safety.
 */
export function usePacedMotionTokens(): {
  mode: MotionMode
  pace: ReturnType<typeof deriveMode>["pace"]
  tokens: {
    durationFast: number
    durationBase: number
    durationSlow: number
    easing: string
    essentialDuration: number
    essentialEasing: string
  }
} {
  const { mode } = useDerivedMode()
  const { mode: effectiveMotion, tokens: baseTokens, prefersReducedMotion } = useEffectiveMotion()

  const effectivePace = prefersReducedMotion ? "calm" : mode.pace
  const multiplier = effectivePace === "calm" ? 1.5 : effectivePace === "activated" ? 0.65 : 1.0

  return {
    mode: effectiveMotion,
    pace: effectivePace,
    tokens: {
      ...baseTokens,
      durationFast: Math.round(baseTokens.durationFast * multiplier),
      durationBase: Math.round(baseTokens.durationBase * multiplier),
      durationSlow: Math.round(baseTokens.durationSlow * multiplier),
    },
  }
}
