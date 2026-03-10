/**
 * Capacity-Adaptive UI Controls - Phase 1 Manual Input System (4 Inputs)
 *
 * STRICT SEPARATION OF CONCERNS:
 * ┌─────────────┬────────────────────────────────────┬─────────────────────────────┐
 * │ Slider      │ Controls                           │ Must NOT Control            │
 * ├─────────────┼────────────────────────────────────┼─────────────────────────────┤
 * │ Cognitive   │ density, hierarchy, concurrency    │ tone, animation speed       │
 * │ Temporal    │ content length, shortcuts, defaults│ color, layout structure     │
 * │ Emotional   │ motion restraint, friction         │ content importance          │
 * │ Valence     │ tone, expressiveness               │ information volume          │
 * └─────────────┴────────────────────────────────────┴─────────────────────────────┘
 *
 * Rules of thumb:
 * - Cognitive: how many things compete for attention at once
 * - Temporal: how much time the UI asks from the user
 * - Emotional: nervous-system-safe UI (no surprises when low)
 * - Valence: emotional color, not information density
 */

"use client"

import { useState, useCallback } from "react"
import {
  useCapacityContext,
  useDerivedMode,
  useEnergyField,
  useAttentionField,
  useEmotionalValenceField,
  useFeedback,
  deriveModeLabel,
  getModeBadgeColor,
} from "@/lib/capacity"

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}

/**
 * Capacity Presets - Quick state configurations for demos
 * Each preset represents a realistic user state
 */
const CAPACITY_PRESETS = {
  exhausted: {
    label: "Exhausted",
    description: "Protective, stripped-back",
    cognitive: 0.1,
    temporal: 0.1,
    emotional: 0.1,
    valence: -0.6,
    arousal: 0.1,
  },
  overwhelmed: {
    label: "Overwhelmed",
    description: "Minimal, high-contrast",
    cognitive: 0.2,
    temporal: 0.15,
    emotional: 0.2,
    valence: -0.5,
    arousal: 0.2,
  },
  distracted: {
    label: "Distracted",
    description: "Guided, fewer items",
    cognitive: 0.35,
    temporal: 0.25,
    emotional: 0.5,
    valence: 0.0,
    arousal: 0.4,
  },
  neutral: {
    label: "Neutral",
    description: "Balanced baseline",
    cognitive: 0.5,
    temporal: 0.5,
    emotional: 0.5,
    valence: 0.0,
    arousal: 0.5,
  },
  focused: {
    label: "Focused",
    description: "Full content, clear hierarchy",
    cognitive: 0.75,
    temporal: 0.75,
    emotional: 0.55,
    valence: 0.1,
    arousal: 0.6,
  },
  energized: {
    label: "Energized",
    description: "Dense, expressive",
    cognitive: 0.9,
    temporal: 0.85,
    emotional: 0.85,
    valence: 0.6,
    arousal: 0.8,
  },
  exploring: {
    label: "Exploring",
    description: "Everything on",
    cognitive: 1.0,
    temporal: 1.0,
    emotional: 1.0,
    valence: 0.8,
    arousal: 0.9,
  },
} as const

type PresetKey = keyof typeof CAPACITY_PRESETS

/**
 * Default "Calm" state values for reset functionality
 * Maps to Calm mode: balanced, gentle, supportive UI
 */
const DEFAULT_CALM_STATE = {
  cognitive: 0.5,
  temporal: 0.5,
  emotional: 0.5,
  valence: 0.0,
  arousal: 0.5,
} as const

export function CapacityControls() {
  const [isOpen, setIsOpen] = useState(false)
  const { updateCapacity, updateEmotionalState, isAutoMode, toggleAutoMode } = useCapacityContext()
  const { hapticEnabled, sonicEnabled, setHapticEnabled, setSonicEnabled, fire: fireFeedback } = useFeedback()
  const { field, mode } = useDerivedMode()
  const energy = useEnergyField()
  const attention = useAttentionField()
  const valence = useEmotionalValenceField()

  const modeLabel = deriveModeLabel(field)
  const modeBadgeColor = getModeBadgeColor(modeLabel)

  /**
   * Reset all sliders to default Calm state
   */
  const handleReset = () => {
    updateCapacity({
      cognitive: DEFAULT_CALM_STATE.cognitive,
      temporal: DEFAULT_CALM_STATE.temporal,
      emotional: DEFAULT_CALM_STATE.emotional,
    })
    updateEmotionalState({
      valence: DEFAULT_CALM_STATE.valence,
      arousal: DEFAULT_CALM_STATE.arousal,
    })
  }

  /**
   * Fire multimodal feedback on significant interactions (opt-in)
   */
  const fireInteractionFeedback = useCallback(() => {
    fireFeedback("tap")
  }, [fireFeedback])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle button with mode badge */}
      {!isOpen && (
        <div className="flex items-center gap-2">
          <span
            className="badge badge-sm shadow-lg text-white"
            style={{ backgroundColor: modeBadgeColor }}
          >
            {modeLabel}
          </span>
          <button
            onClick={() => setIsOpen(true)}
            className="btn btn-sm btn-outline shadow-lg bg-base-100 gap-2"
          >
            <SettingsIcon className="w-4 h-4" />
            Capacity
          </button>
        </div>
      )}

      {/* Backdrop for mobile - tap to close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Control panel */}
      {isOpen && (
        <div className="relative">
          <div className="card bg-base-200 border border-base-300 shadow-xl w-80 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="card-body p-4 pb-3 gap-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Capacity Controls</span>
                  <span
                    className="badge badge-sm text-white"
                    style={{ backgroundColor: modeBadgeColor }}
                  >
                    {modeLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleAutoMode}
                    className={`btn btn-xs h-7 px-2 ${isAutoMode ? "btn-primary" : "btn-outline"}`}
                    aria-label={isAutoMode ? "Switch to manual mode" : "Switch to auto mode"}
                  >
                    {isAutoMode ? "Auto" : "Manual"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsOpen(false)
                    }}
                    className="btn btn-ghost btn-xs btn-square"
                    aria-label="Close capacity controls"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-xs opacity-60 mt-1">
                {isAutoMode
                  ? "Signals are driving values automatically. Move any slider to take manual control."
                  : "Adjust your state to see the UI adapt in real-time."}
              </p>
            </div>

            {/* Content */}
            <div className="card-body p-4 pt-0 gap-6">
              {/* Capacity Presets - Quick state selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Presets</label>
                <select
                  className="select select-bordered w-full"
                  defaultValue=""
                  onChange={(e) => {
                    const key = e.target.value as PresetKey
                    if (!key) return
                    const preset = CAPACITY_PRESETS[key]
                    updateCapacity({
                      cognitive: preset.cognitive,
                      temporal: preset.temporal,
                      emotional: preset.emotional,
                    })
                    updateEmotionalState({ valence: preset.valence, arousal: preset.arousal })
                    fireInteractionFeedback()
                  }}
                >
                  <option value="" disabled>Select a preset...</option>
                  {Object.entries(CAPACITY_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.label} — {preset.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-base-300 pt-4">
                <p className="text-xs opacity-60">Or adjust individually:</p>
                <button
                  onClick={handleReset}
                  className="btn btn-ghost btn-xs gap-1 opacity-60 hover:opacity-100"
                >
                  <ResetIcon className="w-3 h-3" />
                  Reset
                </button>
              </div>

              {/* Cognitive → density, hierarchy, concurrency */}
              <SliderControl
                label="Cognitive Capacity"
                description="Controls: density, hierarchy, concurrency"
                value={field.cognitive}
                onChange={(v) => updateCapacity({ cognitive: v })}
                lowLabel="Fewer items"
                highLabel="More items"
              />

              {/* Temporal → content length, shortcuts, defaults */}
              <SliderControl
                label="Temporal Capacity"
                description="Controls: content length, shortcuts, defaults"
                value={field.temporal}
                onChange={(v) => updateCapacity({ temporal: v })}
                lowLabel="Abbreviated"
                highLabel="Full detail"
              />

              {/* Emotional → motion restraint, friction */}
              <SliderControl
                label="Emotional Capacity"
                description="Controls: motion restraint, friction"
                value={field.emotional}
                onChange={(v) => updateCapacity({ emotional: v })}
                lowLabel="Calm UI"
                highLabel="Expressive"
              />

              {/* Valence → tone, expressiveness (NOT information volume) */}
              <div className="pt-2 border-t border-base-300">
                <ValenceSliderControl
                  label="Emotional Valence"
                  description="Controls: tone, expressiveness (not info volume)"
                  value={field.valence}
                  onChange={(v) => updateEmotionalState({ valence: v })}
                />
              </div>

              {/* Arousal → animation pacing */}
              <SliderControl
                label="Arousal"
                description="Controls: animation pacing (calm → activated)"
                value={field.arousal ?? 0.5}
                onChange={(v) => updateEmotionalState({ arousal: v })}
                lowLabel="Calm"
                highLabel="Activated"
              />

              {/* Multimodal feedback toggles (opt-in) */}
              <div className="pt-2 border-t border-base-300 space-y-2">
                <p className="text-xs font-medium opacity-60">
                  Feedback <span className="font-normal opacity-60">(opt-in)</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHapticEnabled(v => !v)}
                    className={`flex-1 py-1.5 px-2 rounded text-xs border transition-colors ${hapticEnabled ? "bg-primary/10 border-primary/50 text-primary" : "border-base-300 opacity-60 hover:opacity-100"}`}
                    aria-pressed={hapticEnabled}
                  >
                    📳 Haptic
                  </button>
                  <button
                    onClick={() => setSonicEnabled(v => !v)}
                    className={`flex-1 py-1.5 px-2 rounded text-xs border transition-colors ${sonicEnabled ? "bg-primary/10 border-primary/50 text-primary" : "border-base-300 opacity-60 hover:opacity-100"}`}
                    aria-pressed={sonicEnabled}
                  >
                    🔔 Sonic
                  </button>
                </div>
                <p className="text-[10px] opacity-40">
                  Pace: <span className="font-medium">{mode.pace}</span> → {mode.pace === "calm" ? "+50% duration" : mode.pace === "activated" ? "−35% duration" : "standard"}
                </p>
              </div>

              {/* Derived field values display */}
              <div className="pt-4 border-t border-base-300">
                <p className="text-xs font-medium opacity-60 mb-2">
                  Derived Fields
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <FieldDisplay
                    label="Energy"
                    value={energy.value}
                    color="text-success"
                  />
                  <FieldDisplay
                    label="Attention"
                    value={attention.value}
                    color="text-info"
                  />
                  <FieldDisplay
                    label="Valence"
                    value={valence.value}
                    color="text-warning"
                    signed
                  />
                </div>
              </div>

              {/* Interface Mode breakdown */}
              <div className="pt-4 border-t border-base-300">
                <p className="text-xs font-medium opacity-60 mb-2">
                  Interface Mode
                </p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="opacity-60">Density:</span>
                  <span className="font-medium">{mode.density}</span>
                  <span className="opacity-60">Guidance:</span>
                  <span className="font-medium">{mode.guidance}</span>
                  <span className="opacity-60">Motion:</span>
                  <span className="font-medium">{mode.motion}</span>
                  <span className="opacity-60">Contrast:</span>
                  <span className="font-medium">{mode.contrast}</span>
                  <span className="opacity-60">Choices:</span>
                  <span className="font-medium">{mode.choiceLoad}</span>
                  <span className="opacity-60">Focus:</span>
                  <span className="font-medium">{mode.focus}</span>
                  <span className="opacity-60">Pace:</span>
                  <span className="font-medium">{mode.pace}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Reusable slider control with labels
 */
function SliderControl({
  label,
  description,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
  lowLabel: string
  highLabel: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs opacity-60 tabular-nums">
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="range range-xs range-primary w-full"
      />
      <div className="flex justify-between text-xs opacity-60">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}

/**
 * Bipolar slider control for valence (-1 to +1)
 */
function ValenceSliderControl({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
}) {
  // Map -1 to +1 range to 0-1 for slider
  const sliderValue = (value + 1) / 2

  // Display value with sign
  const displayValue = value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2)

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs opacity-60 tabular-nums font-mono">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={sliderValue}
        onChange={(e) => onChange(parseFloat(e.target.value) * 2 - 1)}
        className="range range-xs range-primary w-full"
      />
      <div className="flex justify-between text-xs opacity-60">
        <span>Negative</span>
        <span className="opacity-50">Neutral</span>
        <span>Positive</span>
      </div>
    </div>
  )
}

/**
 * Field value display chip
 */
function FieldDisplay({
  label,
  value,
  color,
  signed = false,
}: {
  label: string
  value: number
  color: string
  signed?: boolean
}) {
  const displayValue = signed
    ? (value >= 0 ? "+" : "") + value.toFixed(2)
    : value.toFixed(2)

  return (
    <div className="bg-base-300/50 rounded-md p-2">
      <p className="text-xs opacity-60">{label}</p>
      <p className={`text-sm font-mono font-bold ${color}`}>{displayValue}</p>
    </div>
  )
}
