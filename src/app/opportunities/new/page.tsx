"use client"

import { PageHeader } from "@/components/ui/PageHeader"
import { OpportunityForm } from "@/components/grove/OpportunityForm"

export default function NewOpportunityPage() {
  return (
    <div className="min-h-screen bg-base-100">
      <PageHeader backHref="/dashboard" title="New opportunity" />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <OpportunityForm />
      </main>
    </div>
  )
}
