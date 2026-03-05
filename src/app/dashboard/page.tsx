"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDerivedMode, deriveModeLabel, focusBeaconClass, useCapacityContext } from "@/lib/capacity"
import { categoriesForMode, isWarmLead } from "@/lib/grove/scoring"
import { useGroveStore } from "@/store/grove"
import { fetchOpportunities } from "@/lib/grove/db"
import { DashboardSection } from "@/components/grove/DashboardSection"
import { InsightCard } from "@/components/grove/InsightCard"
import { signOut } from "@/lib/grove/db"

const MODE_BADGE: Record<string, string> = {
  Minimal: "badge-error",
  Calm: "badge-info",
  Focused: "badge-success",
  Exploratory: "badge-warning",
}

export default function DashboardPage() {
  const { field, mode } = useDerivedMode()
  const { isAutoMode, toggleAutoMode } = useCapacityContext()
  const modeLabel = deriveModeLabel(field)
  const beacon = focusBeaconClass(mode.focus)
  const router = useRouter()

  const { opportunities, insights, isLoading, error, setOpportunities, setLoading, setError } = useGroveStore()

  useEffect(() => {
    setLoading(true)
    fetchOpportunities()
      .then((data) => {
        setOpportunities(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [setOpportunities, setLoading, setError])

  const categoriesToShow = categoriesForMode(modeLabel)

  const filteredOpportunities = (cat: typeof categoriesToShow[number]) => {
    const inCat = opportunities.filter((o) => o.category === cat)
    if (modeLabel === "Minimal") return inCat.filter(isWarmLead)
    return inCat
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Top bar */}
      <header className="border-b border-base-300 sticky top-0 z-40 bg-base-100/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg">Grove</h1>
            <span className={`badge ${MODE_BADGE[modeLabel] || "badge-neutral"}`}>{modeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoMode}
              className={`btn btn-xs ${isAutoMode ? "btn-primary" : "btn-ghost border border-base-300"}`}
            >
              {isAutoMode ? "Auto" : "Manual"}
            </button>
            <Link href="/insights" className="btn btn-xs btn-ghost">Insights</Link>
            <button onClick={handleSignOut} className="btn btn-xs btn-ghost opacity-50">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Exploratory mode: inline insights */}
        {modeLabel === "Exploratory" && insights.totalOpportunities > 0 && insights.patterns.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider opacity-70">Patterns</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.patterns.slice(0, 2).map((pattern, i) => (
                <InsightCard key={i} pattern={pattern} />
              ))}
            </div>
          </section>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Category sections */}
        {!isLoading && !error && (
          <div className="space-y-10">
            {categoriesToShow.map((cat) => (
              <DashboardSection
                key={cat}
                category={cat}
                opportunities={filteredOpportunities(cat)}
                modeLabel={modeLabel}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB — Add opportunity */}
      <Link
        href="/opportunities/new"
        className={`fixed bottom-20 right-4 btn btn-primary btn-circle shadow-xl text-xl ${beacon}`}
        title="Add opportunity"
      >
        +
      </Link>
    </div>
  )
}
