"use client"

import Link from "next/link"
import { OpportunityForm } from "@/components/grove/OpportunityForm"

export default function NewOpportunityPage() {
  return (
    <div className="min-h-screen bg-base-100">
      <header className="border-b border-base-300 sticky top-0 z-40 bg-base-100/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="btn btn-sm btn-ghost">← Back</Link>
          <h1 className="font-semibold">New opportunity</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <OpportunityForm />
      </main>
    </div>
  )
}
