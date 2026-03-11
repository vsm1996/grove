"use client"

import {
  scoreColor,
  scoreToPercent,
  alignmentLabel,
  energyBadgeColor,
  signalBadgeColor,
  ENERGY_LABELS,
  SIGNAL_LABELS,
} from "@/lib/grove/scoring"
import type { ScoredOpportunity } from "@/types/grove"

interface Props {
  opp: ScoredOpportunity
}

export function ScoreBreakdown({ opp }: Props) {
  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-4 gap-4">
        <h2 className="font-semibold">Score breakdown</h2>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Composite score</span>
            <span className={`font-mono font-bold ${scoreColor(opp.compositeScore)}`}>
              {opp.compositeScore}/100
            </span>
          </div>
          <progress
            className="progress progress-primary w-full"
            value={scoreToPercent(opp.compositeScore)}
            max={100}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <ScoreTile label="Alignment">
            <div className="font-bold">{opp.alignment.score}/10</div>
            <div className="text-xs opacity-50">{alignmentLabel(opp.alignment.score)}</div>
          </ScoreTile>

          <ScoreTile label="Energy">
            <span className={`badge badge-sm badge-${energyBadgeColor(opp.energy.type)}`}>
              {ENERGY_LABELS[opp.energy.type]}
            </span>
            <div className="text-xs opacity-50 mt-1">×{opp.energy.intensity}/10</div>
          </ScoreTile>

          <ScoreTile label="Signal">
            <span className={`badge badge-sm badge-${signalBadgeColor(opp.signal.type)}`}>
              {SIGNAL_LABELS[opp.signal.type]}
            </span>
          </ScoreTile>
        </div>

        {opp.alignment.notes && (
          <p className="text-sm opacity-70 italic border-l-2 border-base-300 pl-3">
            {opp.alignment.notes}
          </p>
        )}
      </div>
    </div>
  )
}

function ScoreTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-base-300 rounded-lg p-3">
      <div className="opacity-60 text-xs mb-1">{label}</div>
      {children}
    </div>
  )
}
