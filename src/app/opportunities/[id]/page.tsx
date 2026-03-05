"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useFeedback } from "@/lib/capacity"
import {
  fetchOpportunityById,
  updateOpportunity,
  deleteOpportunity,
} from "@/lib/grove/db"
import { useGroveStore } from "@/store/grove"
import { StatusBadge } from "@/components/grove/StatusBadge"
import { ReflectionForm } from "@/components/grove/ReflectionForm"
import {
  scoreColor,
  scoreToPercent,
  alignmentLabel,
  ENERGY_LABELS,
  SIGNAL_LABELS,
  energyBadgeColor,
  signalBadgeColor,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "@/lib/grove/scoring"
import type { ScoredOpportunity, OpportunityStatus, InterviewReflection } from "@/types/grove"

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { fire } = useFeedback()
  const storeUpdate = useGroveStore((s) => s.updateOpportunity)
  const storeRemove = useGroveStore((s) => s.removeOpportunity)

  const [opp, setOpp] = useState<ScoredOpportunity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReflectionForm, setShowReflectionForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingFollowUp, setTogglingFollowUp] = useState(false)

  // Get scored version from store (has compositeScore + category)
  const storeOpp = useGroveStore((s) => s.opportunities.find((o) => o.id === id))

  useEffect(() => {
    setIsLoading(true)
    fetchOpportunityById(id)
      .then((data) => {
        // Merge with store for scored fields
        if (storeOpp) {
          setOpp({ ...data, compositeScore: storeOpp.compositeScore, category: storeOpp.category })
        } else {
          setOpp({ ...data, compositeScore: 0, category: "experimental" })
        }
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [id, storeOpp])

  const handleStatusChange = async (status: OpportunityStatus) => {
    if (!opp) return
    try {
      fire("tap")
      const updated = await updateOpportunity(opp.id, { status })
      const scored = storeOpp
        ? { ...updated, compositeScore: storeOpp.compositeScore, category: storeOpp.category }
        : { ...updated, compositeScore: 0, category: "experimental" as const }
      setOpp(scored)
      storeUpdate(updated)
    } catch {
      fire("error")
    }
  }

  const handleToggleFollowUp = async () => {
    if (!opp?.followUp) return
    setTogglingFollowUp(true)
    try {
      fire("tap")
      const updated = await updateOpportunity(opp.id, {
        followUp: { ...opp.followUp, completed: !opp.followUp.completed },
      })
      const scored = storeOpp
        ? { ...updated, compositeScore: storeOpp.compositeScore, category: storeOpp.category }
        : { ...updated, compositeScore: 0, category: "experimental" as const }
      setOpp(scored)
      storeUpdate(updated)
    } catch {
      fire("error")
    } finally {
      setTogglingFollowUp(false)
    }
  }

  const handleDelete = async () => {
    if (!opp) return
    setIsDeleting(true)
    try {
      await deleteOpportunity(opp.id)
      storeRemove(opp.id)
      fire("tap")
      router.push("/dashboard")
    } catch {
      fire("error")
      setIsDeleting(false)
    }
  }

  const handleReflectionAdded = (reflection: InterviewReflection) => {
    if (!opp) return
    setOpp({ ...opp, reflections: [...opp.reflections, reflection] })
    setShowReflectionForm(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (error || !opp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error max-w-sm">
          <span>{error ?? "Opportunity not found"}</span>
        </div>
      </div>
    )
  }

  const categoryColor = CATEGORY_COLORS[opp.category]

  return (
    <div className="min-h-screen bg-base-100">
      <header className="border-b border-base-300 sticky top-0 z-40 bg-base-100/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="btn btn-sm btn-ghost">← Back</Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-semibold truncate">{opp.company}</span>
            <span className="opacity-50 hidden sm:block">—</span>
            <span className="opacity-70 truncate hidden sm:block">{opp.role}</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header card */}
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-4 gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold">{opp.company}</h1>
                <p className="text-base-content/70">{opp.role}</p>
              </div>
              <span className={`badge badge-${categoryColor} shrink-0`}>
                {CATEGORY_LABELS[opp.category]}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={opp.status} />
              <select
                className="select select-xs select-ghost opacity-60 hover:opacity-100"
                value={opp.status}
                onChange={(e) => handleStatusChange(e.target.value as OpportunityStatus)}
              >
                {(["saved", "applied", "interviewing", "offer", "rejected", "archived"] as OpportunityStatus[]).map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {opp.url && (
              <a href={opp.url} target="_blank" rel="noopener noreferrer" className="link link-info text-sm">
                View job posting →
              </a>
            )}
          </div>
        </div>

        {/* Score breakdown */}
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
              <div className="bg-base-300 rounded-lg p-3">
                <div className="opacity-60 text-xs mb-1">Alignment</div>
                <div className="font-bold">{opp.alignment.score}/10</div>
                <div className="text-xs opacity-50">{alignmentLabel(opp.alignment.score)}</div>
              </div>
              <div className="bg-base-300 rounded-lg p-3">
                <div className="opacity-60 text-xs mb-1">Energy</div>
                <span className={`badge badge-sm badge-${energyBadgeColor(opp.energy.type)}`}>
                  {ENERGY_LABELS[opp.energy.type]}
                </span>
                <div className="text-xs opacity-50 mt-1">×{opp.energy.intensity}/10</div>
              </div>
              <div className="bg-base-300 rounded-lg p-3">
                <div className="opacity-60 text-xs mb-1">Signal</div>
                <span className={`badge badge-sm badge-${signalBadgeColor(opp.signal.type)}`}>
                  {SIGNAL_LABELS[opp.signal.type]}
                </span>
              </div>
            </div>

            {opp.alignment.notes && (
              <p className="text-sm opacity-70 italic border-l-2 border-base-300 pl-3">
                {opp.alignment.notes}
              </p>
            )}
          </div>
        </div>

        {/* Positioning */}
        {(opp.positioning.narrativeAngle || opp.positioning.proofArtifact || opp.positioning.skillGap) && (
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body p-4 gap-2">
              <h2 className="font-semibold">Positioning</h2>
              {opp.positioning.narrativeAngle && (
                <div className="text-sm">
                  <span className="opacity-60">Narrative: </span>
                  {opp.positioning.narrativeAngle}
                </div>
              )}
              {opp.positioning.proofArtifact && (
                <div className="text-sm">
                  <span className="opacity-60">Proof needed: </span>
                  {opp.positioning.proofArtifact}
                </div>
              )}
              {opp.positioning.skillGap && (
                <div className="text-sm flex items-center gap-2">
                  <span className="badge badge-xs badge-warning">gap</span>
                  {opp.positioning.skillGap}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Application context */}
        {(opp.resumeVersion || opp.jobDescriptionNotes) && (
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body p-4 gap-2">
              <h2 className="font-semibold">Application context</h2>
              {opp.resumeVersion && (
                <div className="text-sm">
                  <span className="opacity-60">Resume: </span>{opp.resumeVersion}
                </div>
              )}
              {opp.jobDescriptionNotes && (
                <p className="text-sm opacity-70 whitespace-pre-wrap">{opp.jobDescriptionNotes}</p>
              )}
            </div>
          </div>
        )}

        {/* Follow-up */}
        {opp.followUp && (
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body p-4 gap-2">
              <h2 className="font-semibold">Follow-up</h2>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={opp.followUp.completed}
                  onChange={handleToggleFollowUp}
                  disabled={togglingFollowUp}
                  className="checkbox checkbox-sm checkbox-primary"
                />
                <span className={`text-sm ${opp.followUp.completed ? "line-through opacity-50" : ""}`}>
                  {opp.followUp.action}
                </span>
                {opp.followUp.dueDate && (
                  <span className="text-xs opacity-50 ml-auto">
                    {new Date(opp.followUp.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reflections */}
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-4 gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Reflections</h2>
              {!showReflectionForm && (
                <button
                  className="btn btn-sm btn-ghost border border-base-300"
                  onClick={() => setShowReflectionForm(true)}
                >
                  + Add
                </button>
              )}
            </div>

            {showReflectionForm && (
              <ReflectionForm
                opportunityId={opp.id}
                onAdded={handleReflectionAdded}
                onCancel={() => setShowReflectionForm(false)}
              />
            )}

            {opp.reflections.length === 0 && !showReflectionForm && (
              <p className="text-sm opacity-40">No reflections yet. Add one after an interview.</p>
            )}

            {opp.reflections.map((r, i) => (
              <div key={i} className="border border-base-300 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`badge badge-sm ${r.sentiment === "expanded" ? "badge-success" : r.sentiment === "drained" ? "badge-error" : "badge-neutral"}`}>
                    {r.sentiment}
                  </span>
                  <span className="text-xs opacity-50">{new Date(r.reflectedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {r.theyListened && <span className="opacity-60">✓ Listened</span>}
                  {r.meaningfulChallenge && <span className="opacity-60">✓ Challenged</span>}
                  {r.respectfulEngagement && <span className="opacity-60">✓ Respectful</span>}
                </div>
                {r.notes && <p className="text-sm opacity-70">{r.notes}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card bg-base-200 border border-error/30">
          <div className="card-body p-4 gap-2">
            <h2 className="font-semibold text-error">Danger zone</h2>
            <p className="text-sm opacity-60">This permanently removes the opportunity and all its reflections.</p>
            <button
              className="btn btn-error btn-sm btn-outline"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <span className="loading loading-spinner loading-xs" /> : "Delete opportunity"}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
