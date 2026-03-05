"use client"

import { useDerivedMode, listItemClass } from "@/lib/capacity"
import { OpportunityCard } from "./OpportunityCard"
import { CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, CATEGORY_COLORS } from "@/lib/grove/scoring"
import type { ScoredOpportunity, OpportunityCategory } from "@/types/grove"

interface Props {
  category: OpportunityCategory
  opportunities: ScoredOpportunity[]
  modeLabel: string
}

const EMPTY_COPY: Record<string, Record<string, string>> = {
  Minimal: {
    pursue: "No warm leads right now. Rest. They'll come.",
  },
  Calm: {
    pursue: "No pursuit candidates yet.",
    worth_it: "Nothing in the worth-it bucket.",
  },
  Focused: {
    pursue: "No pursuit opportunities. Add one.",
    worth_it: "Nothing worth it yet.",
    mercenary: "No mercenary plays.",
    experimental: "No experimental roles.",
  },
  Exploratory: {
    pursue: "Nothing to pursue yet.",
    worth_it: "Nothing worth it.",
    mercenary: "No mercenary plays.",
    experimental: "Nothing experimental.",
  },
}

export function DashboardSection({ category, opportunities, modeLabel }: Props) {
  const { mode } = useDerivedMode()
  const itemAnim = listItemClass(mode.motion)
  const color = CATEGORY_COLORS[category]

  const isEmpty = opportunities.length === 0
  const emptyText =
    EMPTY_COPY[modeLabel]?.[category] ?? `No ${CATEGORY_LABELS[category].toLowerCase()} opportunities.`

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider opacity-70">
          {CATEGORY_LABELS[category]}
        </h2>
        <span className={`badge badge-sm badge-${color}`}>{opportunities.length}</span>
      </div>

      {!isEmpty && (
        <p className="text-xs opacity-50">{CATEGORY_DESCRIPTIONS[category]}</p>
      )}

      {isEmpty ? (
        <div className="text-sm opacity-40 py-4 text-center border border-dashed border-base-300 rounded-lg">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {opportunities.map((opp, i) => (
            <div key={opp.id} className={itemAnim} style={{ animationDelay: `${i * 0.05}s` }}>
              <OpportunityCard opportunity={opp} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
