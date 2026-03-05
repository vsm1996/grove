"use client"

import { alignmentLabel, ENERGY_LABELS, ENERGY_DESCRIPTIONS, SIGNAL_LABELS, SIGNAL_DESCRIPTIONS } from "@/lib/grove/scoring"
import type { EnergyType, SignalStrength } from "@/types/grove"

// ── Alignment Slider ──────────────────────────

interface AlignmentInputProps {
  value: number
  onChange: (v: number) => void
  notes?: string
  onNotesChange?: (v: string) => void
}

export function AlignmentInput({ value, onChange, notes, onNotesChange }: AlignmentInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Alignment score</span>
        <span className="badge badge-neutral text-sm font-mono">{value}/10 — {alignmentLabel(value)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="range range-primary w-full"
      />
      <div className="flex justify-between text-xs opacity-50">
        <span>Misaligned</span>
        <span>Dream role</span>
      </div>
      {onNotesChange !== undefined && (
        <textarea
          className="textarea textarea-bordered w-full text-sm"
          placeholder="Why does this role align (or not)? Optional."
          rows={2}
          value={notes ?? ""}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      )}
    </div>
  )
}

// ── Energy Selector ───────────────────────────

interface EnergyInputProps {
  type?: EnergyType
  intensity: number
  onTypeChange: (t: EnergyType) => void
  onIntensityChange: (v: number) => void
}

export function EnergyInput({ type, intensity, onTypeChange, onIntensityChange }: EnergyInputProps) {
  const types: EnergyType[] = ["expansive", "neutral", "extractive"]
  const COLOR: Record<EnergyType, string> = {
    expansive: "border-success/60 bg-success/10",
    neutral: "border-neutral/60 bg-neutral/10",
    extractive: "border-error/60 bg-error/10",
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            className={`border-2 rounded-lg p-3 text-left transition-colors ${type === t ? COLOR[t] : "border-base-300 hover:border-base-content/30"}`}
          >
            <div className="font-semibold text-sm">{ENERGY_LABELS[t]}</div>
            <div className="text-xs opacity-60 mt-1">{ENERGY_DESCRIPTIONS[t]}</div>
          </button>
        ))}
      </div>
      {type && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="opacity-60">Intensity</span>
            <span className="opacity-60">{intensity}/10</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={intensity}
            onChange={(e) => onIntensityChange(parseInt(e.target.value))}
            className="range range-primary w-full range-sm"
          />
        </div>
      )}
    </div>
  )
}

// ── Signal Selector ───────────────────────────

interface SignalInputProps {
  type?: SignalStrength
  notes?: string
  onTypeChange: (t: SignalStrength) => void
  onNotesChange: (v: string) => void
}

export function SignalInput({ type, notes, onTypeChange, onNotesChange }: SignalInputProps) {
  const types: SignalStrength[] = ["referral", "warm", "recruiter", "cold"]
  const COLOR: Record<SignalStrength, string> = {
    referral: "border-success/60 bg-success/10",
    warm: "border-info/60 bg-info/10",
    recruiter: "border-warning/60 bg-warning/10",
    cold: "border-neutral/60 bg-neutral/10",
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            className={`border-2 rounded-lg p-3 text-left transition-colors ${type === t ? COLOR[t] : "border-base-300 hover:border-base-content/30"}`}
          >
            <div className="font-semibold text-sm">{SIGNAL_LABELS[t]}</div>
            <div className="text-xs opacity-60 mt-1">{SIGNAL_DESCRIPTIONS[t]}</div>
          </button>
        ))}
      </div>
      <input
        type="text"
        className="input input-bordered w-full text-sm"
        placeholder={`e.g. "Referred by Jamie at Vercel" (optional)`}
        value={notes ?? ""}
        onChange={(e) => onNotesChange(e.target.value)}
      />
    </div>
  )
}
