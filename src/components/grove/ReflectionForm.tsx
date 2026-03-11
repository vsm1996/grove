"use client"

import { useState } from "react"
import { useFeedback } from "@/lib/capacity"
import { addReflection, updateReflection } from "@/lib/grove/db"
import type { ReflectionSentiment, InterviewReflection } from "@/types/grove"

interface Props {
  opportunityId: string
  onAdded: (r: InterviewReflection) => void
  onCancel: () => void
  /** When provided, form operates in edit mode */
  reflectionId?: string
  initialValues?: Pick<InterviewReflection, "sentiment" | "theyListened" | "meaningfulChallenge" | "respectfulEngagement" | "notes">
  onUpdated?: (r: InterviewReflection) => void
}

const SENTIMENTS: { value: ReflectionSentiment; label: string; desc: string }[] = [
  { value: "expanded", label: "Expanded", desc: "Came out energized, excited" },
  { value: "neutral", label: "Neutral", desc: "Fine, neither good nor bad" },
  { value: "drained", label: "Drained", desc: "Left feeling depleted" },
]

const SENTIMENT_COLORS: Record<ReflectionSentiment, string> = {
  expanded: "border-success/60 bg-success/10",
  neutral: "border-neutral/60 bg-neutral/10",
  drained: "border-error/60 bg-error/10",
}

export function ReflectionForm({ opportunityId, onAdded, onCancel, reflectionId, initialValues, onUpdated }: Props) {
  const { fire } = useFeedback()
  const isEdit = !!reflectionId

  const [sentiment, setSentiment] = useState<ReflectionSentiment | null>(initialValues?.sentiment ?? null)
  const [theyListened, setTheyListened] = useState(initialValues?.theyListened ?? false)
  const [meaningfulChallenge, setMeaningfulChallenge] = useState(initialValues?.meaningfulChallenge ?? false)
  const [respectfulEngagement, setRespectfulEngagement] = useState(initialValues?.respectfulEngagement ?? false)
  const [notes, setNotes] = useState(initialValues?.notes ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sentiment) return
    setIsSubmitting(true)
    setError(null)
    try {
      const payload = {
        sentiment,
        theyListened,
        meaningfulChallenge,
        respectfulEngagement,
        notes: notes || undefined,
      }
      if (isEdit && reflectionId) {
        const updated = await updateReflection(reflectionId, payload)
        fire("tap")
        onUpdated?.(updated)
      } else {
        const reflection = await addReflection(opportunityId, payload)
        fire("tap")
        onAdded(reflection)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reflection")
      fire("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Sentiment */}
      <div className="space-y-2">
        <label className="text-sm font-medium">How did it feel?</label>
        <div className="grid grid-cols-3 gap-2">
          {SENTIMENTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSentiment(s.value)}
              className={`border-2 rounded-lg p-2 text-left transition-colors ${sentiment === s.value ? SENTIMENT_COLORS[s.value] : "border-base-300 hover:border-base-content/30"}`}
            >
              <div className="font-semibold text-sm">{s.label}</div>
              <div className="text-xs opacity-60">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        {([
          { key: "theyListened", label: "They actively listened", value: theyListened, set: setTheyListened },
          { key: "meaningfulChallenge", label: "Meaningful challenge", value: meaningfulChallenge, set: setMeaningfulChallenge },
          { key: "respectfulEngagement", label: "Respectful engagement", value: respectfulEngagement, set: setRespectfulEngagement },
        ] as const).map((item) => (
          <label key={item.key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={item.value}
              onChange={(e) => item.set(e.target.checked)}
              className="checkbox checkbox-sm checkbox-primary"
            />
            <span className="text-sm">{item.label}</span>
          </label>
        ))}
      </div>

      {/* Notes */}
      <div>
        <textarea
          className="textarea textarea-bordered w-full text-sm"
          placeholder="Debrief notes (optional)"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={!sentiment || isSubmitting}>
          {isSubmitting ? <span className="loading loading-spinner loading-xs" /> : isEdit ? "Save changes" : "Save reflection"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
