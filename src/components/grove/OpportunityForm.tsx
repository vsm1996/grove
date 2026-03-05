"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFeedback } from "@/lib/capacity"
import { createOpportunity } from "@/lib/grove/db"
import { useGroveStore } from "@/store/grove"
import { AlignmentInput, EnergyInput, SignalInput } from "./ScoreInputs"
import type { NewOpportunityInput, OpportunityStatus, EnergyType, SignalStrength } from "@/types/grove"

export function OpportunityForm() {
  const router = useRouter()
  const { fire } = useFeedback()
  const addOpportunity = useGroveStore((s) => s.addOpportunity)

  // Section 1
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState<OpportunityStatus>("saved")

  // Section 2
  const [alignmentScore, setAlignmentScore] = useState(5)
  const [alignmentNotes, setAlignmentNotes] = useState("")

  // Section 3
  const [energyType, setEnergyType] = useState<EnergyType | undefined>()
  const [energyIntensity, setEnergyIntensity] = useState(5)

  // Section 4
  const [signalType, setSignalType] = useState<SignalStrength | undefined>()
  const [signalNotes, setSignalNotes] = useState("")

  // Section 5
  const [narrativeAngle, setNarrativeAngle] = useState("")
  const [proofArtifact, setProofArtifact] = useState("")
  const [skillGap, setSkillGap] = useState("")

  // Section 6
  const [resumeVersion, setResumeVersion] = useState("")
  const [jdNotes, setJdNotes] = useState("")

  // Section 7
  const [nextAction, setNextAction] = useState("")
  const [dueDate, setDueDate] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = company.trim() && role.trim() && energyType && signalType

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!energyType || !signalType) return
    setIsSubmitting(true)
    setError(null)

    const input: NewOpportunityInput = {
      company: company.trim(),
      role: role.trim(),
      url: url.trim() || undefined,
      status,
      alignment: { score: alignmentScore, notes: alignmentNotes || undefined },
      energy: { type: energyType, intensity: energyIntensity },
      signal: { type: signalType, notes: signalNotes || undefined },
      positioning: {
        narrativeAngle: narrativeAngle || undefined,
        proofArtifact: proofArtifact || undefined,
        skillGap: skillGap || undefined,
      },
      resumeVersion: resumeVersion || undefined,
      jobDescriptionNotes: jdNotes || undefined,
      followUp: nextAction ? { action: nextAction, dueDate: dueDate || undefined, completed: false } : undefined,
    }

    try {
      const opportunity = await createOpportunity(input)
      addOpportunity(opportunity)
      fire("tap")
      router.push(`/opportunities/${opportunity.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
      fire("error")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1 — The Role */}
      <FormSection title="The Role">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Company *">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Acme Corp"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Role *">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Senior Product Designer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Job posting URL">
            <input
              type="url"
              className="input input-bordered w-full"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </FormField>
          <FormField label="Status">
            <select
              className="select select-bordered w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value as OpportunityStatus)}
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </FormField>
        </div>
      </FormSection>

      {/* Section 2 — Alignment */}
      <FormSection title="Alignment" subtitle="How well does this fit you?">
        <AlignmentInput
          value={alignmentScore}
          onChange={setAlignmentScore}
          notes={alignmentNotes}
          onNotesChange={setAlignmentNotes}
        />
      </FormSection>

      {/* Section 3 — Energy */}
      <FormSection title="Energy" subtitle="How does this feel?">
        <EnergyInput
          type={energyType}
          intensity={energyIntensity}
          onTypeChange={setEnergyType}
          onIntensityChange={setEnergyIntensity}
        />
      </FormSection>

      {/* Section 4 — Signal */}
      <FormSection title="Signal" subtitle="How did you find this?">
        <SignalInput
          type={signalType}
          notes={signalNotes}
          onTypeChange={setSignalType}
          onNotesChange={setSignalNotes}
        />
      </FormSection>

      {/* Section 5 — Positioning */}
      <FormSection title="Positioning" subtitle="What's the gap?">
        <div className="space-y-3">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Narrative angle (e.g. 'Design systems leader building 0→1')"
            value={narrativeAngle}
            onChange={(e) => setNarrativeAngle(e.target.value)}
          />
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Proof artifact needed (e.g. 'Before/after design metrics case study')"
            value={proofArtifact}
            onChange={(e) => setProofArtifact(e.target.value)}
          />
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Skill gap (e.g. 'No ML experience')"
            value={skillGap}
            onChange={(e) => setSkillGap(e.target.value)}
          />
        </div>
      </FormSection>

      {/* Section 6 — Context */}
      <FormSection title="Context" subtitle="The practical stuff">
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Resume version (e.g. 'IC-focused v3')"
          value={resumeVersion}
          onChange={(e) => setResumeVersion(e.target.value)}
        />
        <textarea
          className="textarea textarea-bordered w-full mt-3"
          placeholder="JD notes — anything worth flagging from the posting"
          rows={3}
          value={jdNotes}
          onChange={(e) => setJdNotes(e.target.value)}
        />
      </FormSection>

      {/* Section 7 — Follow-Up */}
      <FormSection title="Follow-Up" subtitle="What's next?">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Next action (e.g. 'Send thank you note')"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
          />
          <input
            type="date"
            className="input input-bordered w-full"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </FormSection>

      {error && <div className="alert alert-error"><span>{error}</span></div>}

      <div className="flex gap-3">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : "Save opportunity"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-sm opacity-60">{subtitle}</p>}
      </div>
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-control gap-1">
      <label className="label label-text text-xs opacity-70">{label}</label>
      {children}
    </div>
  )
}
