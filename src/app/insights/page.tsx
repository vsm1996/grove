"use client"

import Link from "next/link"
import { useGroveStore } from "@/store/grove"
import { InsightCard } from "@/components/grove/InsightCard"
import {
  ENERGY_LABELS,
  STATUS_LABELS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  energyBadgeColor,
} from "@/lib/grove/scoring"
import type { OpportunityStatus, OpportunityCategory } from "@/types/grove"

export default function InsightsPage() {
  const { insights, opportunities } = useGroveStore()

  const total = insights.totalOpportunities
  const expansiveCount = opportunities.filter((o) => o.energy.type === "expansive").length
  const neutralCount = opportunities.filter((o) => o.energy.type === "neutral").length
  const extractiveCount = opportunities.filter((o) => o.energy.type === "extractive").length

  return (
    <div className="min-h-screen bg-base-100">
      <header className="border-b border-base-300 sticky top-0 z-40 bg-base-100/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="btn btn-sm btn-ghost">← Dashboard</Link>
          <h1 className="font-semibold">Insights</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {total === 0 ? (
          <div className="text-center py-16 opacity-40">
            <p className="text-lg">No opportunities tracked yet.</p>
            <Link href="/opportunities/new" className="btn btn-sm btn-ghost mt-4">Add your first one →</Link>
          </div>
        ) : (
          <>
            {/* Section 1 — Pipeline Health */}
            <section className="space-y-4">
              <SectionHeading>Pipeline Health</SectionHeading>

              <div className="stats stats-horizontal shadow bg-base-200 w-full overflow-x-auto">
                <div className="stat">
                  <div className="stat-title">Total</div>
                  <div className="stat-value">{total}</div>
                  <div className="stat-desc">opportunities</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Avg Alignment</div>
                  <div className="stat-value text-primary">{insights.avgAlignmentScore}</div>
                  <div className="stat-desc">out of 10</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Interviewing</div>
                  <div className="stat-value text-warning">{insights.byStatus.interviewing}</div>
                  <div className="stat-desc">active loops</div>
                </div>
              </div>

              <div className="card bg-base-200 border border-base-300">
                <div className="card-body p-4 gap-3">
                  <h3 className="text-sm font-medium opacity-70">By status</h3>
                  <div className="space-y-2">
                    {(Object.entries(insights.byStatus) as [OpportunityStatus, number][])
                      .filter(([, count]) => count > 0)
                      .map(([status, count]) => (
                        <div key={status} className="flex items-center gap-2">
                          <span className="w-24 text-sm opacity-70">{STATUS_LABELS[status]}</span>
                          <progress className="progress progress-primary flex-1 h-2" value={count} max={total} />
                          <span className="text-sm tabular-nums opacity-60 w-6 text-right">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="card bg-base-200 border border-base-300">
                <div className="card-body p-4 gap-3">
                  <h3 className="text-sm font-medium opacity-70">By category</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(insights.byCategory) as [OpportunityCategory, number][]).map(([cat, count]) => (
                      <div key={cat} className="flex items-center gap-1.5">
                        <span className={`badge badge-${CATEGORY_COLORS[cat]}`}>{CATEGORY_LABELS[cat]}</span>
                        <span className="text-sm tabular-nums opacity-60">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 — Patterns */}
            {insights.patterns.length > 0 && (
              <section className="space-y-3">
                <SectionHeading>Patterns</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.patterns.map((pattern, i) => (
                    <InsightCard key={i} pattern={pattern} />
                  ))}
                </div>
              </section>
            )}

            {/* Section 3 — Positioning Gaps */}
            {insights.topPositioningGaps.length > 0 && (
              <section className="space-y-3">
                <SectionHeading>Positioning Gaps</SectionHeading>
                <div className="card bg-base-200 border border-base-300">
                  <div className="card-body p-4 gap-2">
                    <p className="text-sm opacity-60">Recurring gaps across your pipeline:</p>
                    <ul className="space-y-1">
                      {insights.topPositioningGaps.map((gap, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="badge badge-xs badge-warning">gap</span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Section 4 — Energy Analysis */}
            <section className="space-y-3">
              <SectionHeading>Energy Analysis</SectionHeading>
              <div className="card bg-base-200 border border-base-300">
                <div className="card-body p-4 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-60">Dominant energy type:</span>
                    <span className={`badge badge-${energyBadgeColor(insights.dominantEnergyType)}`}>
                      {ENERGY_LABELS[insights.dominantEnergyType]}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-success">{expansiveCount} expansive</span>
                    <span className="opacity-50">{neutralCount} neutral</span>
                    <span className="text-error">{extractiveCount} extractive</span>
                  </div>
                  {total > 0 && (
                    <p className="text-sm opacity-60">{energyRecommendation(extractiveCount, expansiveCount, total)}</p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

// ── Helpers ───────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wider opacity-70">{children}</h2>
}

function energyRecommendation(extractive: number, expansive: number, total: number): string {
  if (extractive / total >= 0.5) return "Over half your pipeline is draining. Consider protecting your energy."
  if (expansive / total >= 0.5) return "Mostly expansive — your pipeline is energizing. Keep going."
  return "A balanced mix. Pay attention to how each interview actually feels."
}
