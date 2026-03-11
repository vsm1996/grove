"use client"

import { useState } from "react"
import { useFeedback } from "@/lib/capacity"
import { deleteReflection } from "@/lib/grove/db"
import { formatDate } from "@/lib/grove/scoring"
import { ReflectionForm } from "./ReflectionForm"
import type { InterviewReflection } from "@/types/grove"

interface Props {
  opportunityId: string
  reflections: InterviewReflection[]
  onChange: (reflections: InterviewReflection[]) => void
}

export function ReflectionList({ opportunityId, reflections, onChange }: Props) {
  const { fire } = useFeedback()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdded = (reflection: InterviewReflection) => {
    onChange([...reflections, reflection])
    setShowForm(false)
  }

  const handleUpdated = (updated: InterviewReflection) => {
    onChange(reflections.map((r) => r.id === updated.id ? updated : r))
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteReflection(id)
      onChange(reflections.filter((r) => r.id !== id))
      fire("tap")
    } catch {
      fire("error")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-4 gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Reflections</h2>
          {!showForm && (
            <button
              className="btn btn-sm btn-ghost border border-base-300"
              onClick={() => setShowForm(true)}
            >
              + Add
            </button>
          )}
        </div>

        {showForm && (
          <ReflectionForm
            opportunityId={opportunityId}
            onAdded={handleAdded}
            onCancel={() => setShowForm(false)}
          />
        )}

        {reflections.length === 0 && !showForm && (
          <p className="text-sm opacity-40">No reflections yet. Add one after an interview.</p>
        )}

        {reflections.map((r, i) => (
          <div key={r.id ?? i} className="border border-base-300 rounded-lg p-3 space-y-2">
            {editingId === r.id ? (
              <ReflectionForm
                opportunityId={opportunityId}
                reflectionId={r.id}
                initialValues={r}
                onAdded={handleAdded}
                onUpdated={handleUpdated}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <ReflectionEntry
                reflection={r}
                isDeleting={deletingId === r.id}
                onEdit={() => r.id && setEditingId(r.id)}
                onDelete={() => r.id && handleDelete(r.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface EntryProps {
  reflection: InterviewReflection
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
}

function ReflectionEntry({ reflection: r, isDeleting, onEdit, onDelete }: EntryProps) {
  const sentimentColor =
    r.sentiment === "expanded" ? "badge-success" :
    r.sentiment === "drained" ? "badge-error" :
    "badge-neutral"

  return (
    <>
      <div className="flex items-center gap-2">
        <span className={`badge badge-sm ${sentimentColor}`}>{r.sentiment}</span>
        <span className="text-xs opacity-50">{formatDate(r.reflectedAt)}</span>
        {r.id && (
          <div className="ml-auto flex gap-1">
            <button
              className="btn btn-xs btn-ghost opacity-50 hover:opacity-100"
              onClick={onEdit}
            >
              Edit
            </button>
            <button
              className="btn btn-xs btn-ghost text-error opacity-50 hover:opacity-100"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <span className="loading loading-spinner loading-xs" /> : "Delete"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {r.theyListened && <span className="opacity-60">✓ Listened</span>}
        {r.meaningfulChallenge && <span className="opacity-60">✓ Challenged</span>}
        {r.respectfulEngagement && <span className="opacity-60">✓ Respectful</span>}
      </div>

      {r.notes && <p className="text-sm opacity-70">{r.notes}</p>}
    </>
  )
}
