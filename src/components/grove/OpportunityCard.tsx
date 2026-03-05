"use client"

import { useState } from "react"
import Link from "next/link"
import {
  useDerivedMode,
  useCapacityContext,
  useFeedback,
  entranceClass,
  hoverClass,
  focusBeaconClass,
} from "@/lib/capacity"
import {
  cardFieldsForDensity,
  CATEGORY_COLORS,
  energyBadgeColor,
  signalBadgeColor,
  scoreColor,
  scoreToPercent,
  ENERGY_LABELS,
  SIGNAL_LABELS,
} from "@/lib/grove/scoring"
import { StatusBadge } from "./StatusBadge"
import type { ScoredOpportunity, OpportunityStatus } from "@/types/grove"
import { updateOpportunity } from "@/lib/grove/db"
import { useGroveStore } from "@/store/grove"

interface Props {
  opportunity: ScoredOpportunity
}

export function OpportunityCard({ opportunity }: Props) {
  const [hasPlayed, setHasPlayed] = useState(false)
  const { mode } = useDerivedMode()
  const { context } = useCapacityContext()
  const { fire } = useFeedback()
  const storeUpdate = useGroveStore((s) => s.updateOpportunity)
  const valence = context.emotionalState.valence

  const fields = cardFieldsForDensity(mode.density)
  const entrance = entranceClass(mode.motion, "morph", hasPlayed)
  const hover = hoverClass(mode.motion)
  const beacon = focusBeaconClass(mode.focus)
  const categoryColor = CATEGORY_COLORS[opportunity.category]

  // Tone copy based on valence
  const ctaLabel =
    valence > 0.2
      ? "View & take action →"
      : valence < -0.2
        ? "Review when ready"
        : "View details"

  const handleStatusChange = async (status: OpportunityStatus) => {
    try {
      fire("tap")
      const updated = await updateOpportunity(opportunity.id, { status })
      storeUpdate(updated)
    } catch {
      fire("error")
    }
  }

  const onAnimationEnd = () => setHasPlayed(true)

  return (
    <div
      className={`card bg-base-200 border border-base-300 ${entrance} ${hover} ${beacon}`}
      onAnimationEnd={onAnimationEnd}
    >
      <div className="card-body p-4 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{opportunity.company}</p>
            <p className="text-sm opacity-70 truncate">{opportunity.role}</p>
          </div>
          <span className={`badge badge-sm badge-${categoryColor} shrink-0`}>
            {opportunity.category.replace("_", " ")}
          </span>
        </div>

        {/* Status */}
        {fields.includes("status") && (
          <div className="flex items-center gap-2">
            <StatusBadge status={opportunity.status} />
            <select
              className="select select-xs select-ghost opacity-50 hover:opacity-100 transition-opacity max-w-[120px]"
              value={opportunity.status}
              onChange={(e) => handleStatusChange(e.target.value as OpportunityStatus)}
            >
              {(["saved", "applied", "interviewing", "offer", "rejected", "archived"] as OpportunityStatus[]).map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        )}

        {/* Score bar */}
        {fields.includes("score") && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="opacity-60">Score</span>
              <span className={`font-mono font-semibold ${scoreColor(opportunity.compositeScore)}`}>
                {opportunity.compositeScore}
              </span>
            </div>
            <progress
              className="progress progress-primary w-full h-1.5"
              value={scoreToPercent(opportunity.compositeScore)}
              max={100}
            />
          </div>
        )}

        {/* Energy + Signal */}
        {(fields.includes("energy") || fields.includes("signal")) && (
          <div className="flex flex-wrap gap-1.5">
            {fields.includes("energy") && (
              <span className={`badge badge-sm badge-${energyBadgeColor(opportunity.energy.type)}`}>
                {ENERGY_LABELS[opportunity.energy.type]}
              </span>
            )}
            {fields.includes("signal") && (
              <span className={`badge badge-sm badge-${signalBadgeColor(opportunity.signal.type)}`}>
                {SIGNAL_LABELS[opportunity.signal.type]}
              </span>
            )}
          </div>
        )}

        {/* Follow-up */}
        {fields.includes("followup") && opportunity.followUp && !opportunity.followUp.completed && (
          <div className="text-xs opacity-60 flex items-center gap-1">
            <span>→</span>
            <span className="truncate">{opportunity.followUp.action}</span>
            {opportunity.followUp.dueDate && (
              <span className="shrink-0 opacity-50">
                {new Date(opportunity.followUp.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Positioning gap */}
        {fields.includes("gap") && opportunity.positioning.skillGap && (
          <div className="text-xs opacity-50 flex items-center gap-1">
            <span className="badge badge-xs badge-warning">gap</span>
            <span className="truncate">{opportunity.positioning.skillGap}</span>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="btn btn-sm btn-ghost border border-base-300 w-full mt-1"
          onClick={() => fire("tap")}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}
