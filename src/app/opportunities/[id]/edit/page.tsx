"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { fetchOpportunityById } from "@/lib/grove/db"
import { OpportunityForm } from "@/components/grove/OpportunityForm"
import { PageHeader } from "@/components/ui/PageHeader"
import type { NewOpportunityInput, Opportunity } from "@/types/grove"

function toFormValues(opp: Opportunity): NewOpportunityInput {
  return {
    company: opp.company,
    role: opp.role,
    url: opp.url,
    status: opp.status,
    alignment: opp.alignment,
    energy: opp.energy,
    signal: opp.signal,
    positioning: opp.positioning,
    resumeVersion: opp.resumeVersion,
    jobDescriptionNotes: opp.jobDescriptionNotes,
    followUp: opp.followUp,
  }
}

export default function EditOpportunityPage() {
  const { id } = useParams<{ id: string }>()
  const [opp, setOpp] = useState<Opportunity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOpportunityById(id)
      .then((data) => { setOpp(data); setIsLoading(false) })
      .catch((err) => { setError(err.message); setIsLoading(false) })
  }, [id])

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

  return (
    <div className="min-h-screen bg-base-100">
      <PageHeader
        backHref={`/opportunities/${id}`}
        title={`Edit — ${opp.company}`}
        subtitle={opp.role}
      />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <OpportunityForm opportunityId={id} initialValues={toFormValues(opp)} />
      </main>
    </div>
  )
}
