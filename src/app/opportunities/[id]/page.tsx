"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useFeedback } from "@/lib/capacity"
import { fetchOpportunityById, updateOpportunity, deleteOpportunity } from "@/lib/grove/db"
import { useGroveStore } from "@/store/grove"
import { StatusBadge } from "@/components/grove/StatusBadge"
import { ScoreBreakdown } from "@/components/grove/ScoreBreakdown"
import { ReflectionList } from "@/components/grove/ReflectionList"
import { PageHeader } from "@/components/ui/PageHeader"
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  ALL_STATUSES,
  formatDate,
} from "@/lib/grove/scoring"
import type { Opportunity, ScoredOpportunity, OpportunityStatus, InterviewReflection } from "@/types/grove"

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { fire } = useFeedback()
  const storeOpp = useGroveStore((s) => s.opportunities.find((o) => o.id === id))
  const storeUpdate = useGroveStore((s) => s.updateOpportunity)
  const storeRemove = useGroveStore((s) => s.removeOpportunity)

  const [opp, setOpp] = useState<ScoredOpportunity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingFollowUp, setTogglingFollowUp] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    fetchOpportunityById(id)
      .then((data) => {
        setOpp(withScore(data, storeOpp))
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [id, storeOpp])

  const handleStatusChange = async (status: OpportunityStatus) => {
    if (!opp) return
    fire("tap")
    try {
      const updated = await updateOpportunity(opp.id, { status })
      setOpp(withScore(updated, storeOpp))
      storeUpdate(updated)
    } catch {
      fire("error")
    }
  }

  const handleToggleFollowUp = async () => {
    if (!opp?.followUp) return
    setTogglingFollowUp(true)
    fire("tap")
    try {
      const updated = await updateOpportunity(opp.id, {
        followUp: { ...opp.followUp, completed: !opp.followUp.completed },
      })
      setOpp(withScore(updated, storeOpp))
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

  const handleReflectionsChange = (reflections: InterviewReflection[]) => {
    if (!opp) return
    setOpp({ ...opp, reflections })
  }

  if (isLoading) return <LoadingScreen />
  if (error || !opp) return <ErrorScreen message={error} />

  const categoryColor = CATEGORY_COLORS[opp.category]

  return (
    <div className="min-h-screen bg-base-100">
      <PageHeader
        backHref="/dashboard"
        title={opp.company}
        subtitle={opp.role}
        actions={
          <Link href={`/opportunities/${id}/edit`} className="btn btn-sm btn-ghost border border-base-300">
            Edit
          </Link>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Identity + status */}
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
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
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

        <ScoreBreakdown opp={opp} />

        {/* Positioning */}
        {hasPositioning(opp) && (
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
                  <span className="text-xs opacity-50 ml-auto">{formatDate(opp.followUp.dueDate)}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <ReflectionList
          opportunityId={opp.id}
          reflections={opp.reflections}
          onChange={handleReflectionsChange}
        />

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

// ── Helpers ───────────────────────────────────

function withScore(opp: Opportunity, storeOpp: ScoredOpportunity | undefined): ScoredOpportunity {
  return storeOpp
    ? { ...opp, compositeScore: storeOpp.compositeScore, category: storeOpp.category }
    : { ...opp, compositeScore: 0, category: "experimental" as const }
}

function hasPositioning(opp: ScoredOpportunity): boolean {
  return !!(opp.positioning.narrativeAngle || opp.positioning.proofArtifact || opp.positioning.skillGap)
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg" />
    </div>
  )
}

function ErrorScreen({ message }: { message: string | null }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="alert alert-error max-w-sm">
        <span>{message ?? "Opportunity not found"}</span>
      </div>
    </div>
  )
}
