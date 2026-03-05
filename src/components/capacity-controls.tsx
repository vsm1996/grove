"use client"

import { useState } from "react"
import {
  useCapacityContext,
  useDerivedMode,
  deriveModeLabel,
  useFeedback,
} from "@/lib/capacity"

const PRESETS = {
  exhausted: { label: "Exhausted", cognitive: 0.1, temporal: 0.1, emotional: 0.1, valence: -0.6, arousal: 0.1 },
  calm: { label: "Calm", cognitive: 0.5, temporal: 0.5, emotional: 0.5, valence: 0.0, arousal: 0.5 },
  focused: { label: "Focused", cognitive: 0.75, temporal: 0.75, emotional: 0.55, valence: 0.1, arousal: 0.6 },
  energized: { label: "Energized", cognitive: 0.9, temporal: 0.85, emotional: 0.85, valence: 0.6, arousal: 0.8 },
} as const

const MODE_BADGE_COLORS: Record<string, string> = {
  Minimal: "badge-error",
  Calm: "badge-info",
  Focused: "badge-success",
  Exploratory: "badge-warning",
}

export function CapacityControls() {
  const [isOpen, setIsOpen] = useState(false)
  const { updateCapacity, updateEmotionalState, isAutoMode, toggleAutoMode } = useCapacityContext()
  const { field: f, mode } = useDerivedMode()
  const modeLabel = deriveModeLabel(f)
  const { fire } = useFeedback()

  const applyPreset = (key: keyof typeof PRESETS) => {
    const p = PRESETS[key]
    updateCapacity({ cognitive: p.cognitive, temporal: p.temporal, emotional: p.emotional })
    updateEmotionalState({ valence: p.valence, arousal: p.arousal })
    fire("tap")
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-sm btn-ghost border border-base-300 bg-base-200 shadow-lg gap-2"
        >
          <span className={`badge badge-sm ${MODE_BADGE_COLORS[modeLabel] || "badge-neutral"}`}>
            {modeLabel}
          </span>
          Capacity
        </button>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="card bg-base-200 border border-base-300 shadow-xl w-72 relative">
            <div className="card-body p-4 gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Capacity</span>
                  <span className={`badge badge-sm ${MODE_BADGE_COLORS[modeLabel] || "badge-neutral"}`}>
                    {modeLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleAutoMode}
                    className={`btn btn-xs ${isAutoMode ? "btn-primary" : "btn-ghost border border-base-300"}`}
                  >
                    {isAutoMode ? "Auto" : "Manual"}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="btn btn-xs btn-ghost"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <p className="text-xs opacity-60">
                {isAutoMode ? "Signals driving values automatically." : "Adjust to see UI adapt."}
              </p>

              <div className="divider my-0" />

              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="btn btn-xs btn-ghost border border-base-300 text-xs"
                  >
                    {PRESETS[key].label}
                  </button>
                ))}
              </div>

              <div className="divider my-0" />

              <div className="space-y-2 text-xs">
                <SliderRow
                  label="Cognitive"
                  value={f.cognitive}
                  onChange={(v) => updateCapacity({ cognitive: v })}
                />
                <SliderRow
                  label="Temporal"
                  value={f.temporal}
                  onChange={(v) => updateCapacity({ temporal: v })}
                />
                <SliderRow
                  label="Emotional"
                  value={f.emotional}
                  onChange={(v) => updateCapacity({ emotional: v })}
                />
              </div>

              <div className="grid grid-cols-3 gap-1 text-xs opacity-60 pt-1">
                <div>density: <strong>{mode.density}</strong></div>
                <div>motion: <strong>{mode.motion}</strong></div>
                <div>focus: <strong>{mode.focus}</strong></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 opacity-70">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="range range-xs range-primary flex-1"
      />
      <span className="w-8 text-right tabular-nums opacity-60">{Math.round(value * 100)}%</span>
    </div>
  )
}
