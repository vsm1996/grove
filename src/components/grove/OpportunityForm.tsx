"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFeedback } from "@/lib/capacity"
import { createOpportunity, updateOpportunity } from "@/lib/grove/db"
import { useGroveStore } from "@/store/grove"
import { AlignmentInput, EnergyInput, SignalInput } from "./ScoreInputs"
import type { NewOpportunityInput, OpportunityStatus, EnergyType, SignalStrength } from "@/types/grove"

interface Props {
  /** When provided, form operates in edit mode */
  opportunityId?: string
  initialValues?: NewOpportunityInput
}

export function OpportunityForm({ opportunityId, initialValues }: Props) {
  const router = useRouter()
  const { fire } = useFeedback()
  const addOpportunity = useGroveStore((s) => s.addOpportunity)
  const storeUpdate = useGroveStore((s) => s.updateOpportunity)

  const isEdit = !!opportunityId

  // Section 1
  const [company, setCompany] = useState(initialValues?.company ?? "")
  const [role, setRole] = useState(initialValues?.role ?? "")
  const [url, setUrl] = useState(initialValues?.url ?? "")
  const [status, setStatus] = useState<OpportunityStatus>(initialValues?.status ?? "saved")

  // Section 2
  const [alignmentScore, setAlignmentScore] = useState(initialValues?.alignment.score ?? 5)
  const [alignmentNotes, setAlignmentNotes] = useState(initialValues?.alignment.notes ?? "")

  // Section 3
  const [energyType, setEnergyType] = useState<EnergyType | undefined>(initialValues?.energy.type)
  const [energyIntensity, setEnergyIntensity] = useState(initialValues?.energy.intensity ?? 5)

  // Section 4
  const [signalType, setSignalType] = useState<SignalStrength | undefined>(initialValues?.signal.type)
  const [signalNotes, setSignalNotes] = useState(initialValues?.signal.notes ?? "")

  // Section 5
  const [narrativeAngle, setNarrativeAngle] = useState(initialValues?.positioning.narrativeAngle ?? "")
  const [proofArtifact, setProofArtifact] = useState(initialValues?.positioning.proofArtifact ?? "")
  const [skillGap, setSkillGap] = useState(initialValues?.positioning.skillGap ?? "")

  // Section 6
  const [resumeVersion, setResumeVersion] = useState(initialValues?.resumeVersion ?? "")
  const [jdNotes, setJdNotes] = useState(initialValues?.jobDescriptionNotes ?? "")

  // Section 7
  const [nextAction, setNextAction] = useState(initialValues?.followUp?.action ?? "")
  const [dueDate, setDueDate] = useState(initialValues?.followUp?.dueDate ?? "")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function validate() {
    const errors: Record<string, string> = {}
    if (!company.trim()) errors.company = "Company name is required."
    if (!role.trim()) errors.role = "Role title is required."
    if (!energyType) errors.energyType = "Select how this role feels to you."
    if (!signalType) errors.signalType = "Select how you found this role."
    return errors
  }

  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }))
  const clearFieldError = (field: string) => setFieldErrors((e) => { const next = { ...e }; delete next[field]; return next })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setTouched({ company: true, role: true, energyType: true, signalType: true })
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)

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
      if (isEdit && opportunityId) {
        const updated = await updateOpportunity(opportunityId, input)
        storeUpdate(updated)
        fire("tap")
        router.push(`/opportunities/${opportunityId}`)
      } else {
        const opportunity = await createOpportunity(input)
        addOpportunity(opportunity)
        fire("tap")
        router.push(`/opportunities/${opportunity.id}`)
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      fire("error")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1 — The Role */}
      <FormSection title="The Role">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Company *" error={touched.company ? fieldErrors.company : undefined}>
            <input
              type="text"
              className={`input input-bordered w-full ${touched.company && fieldErrors.company ? "input-error" : ""}`}
              placeholder="Acme Corp"
              value={company}
              onChange={(e) => { setCompany(e.target.value); clearFieldError("company") }}
              onBlur={() => touch("company")}
            />
          </FormField>
          <FormField label="Role *" error={touched.role ? fieldErrors.role : undefined}>
            <input
              type="text"
              className={`input input-bordered w-full ${touched.role && fieldErrors.role ? "input-error" : ""}`}
              placeholder="Senior Product Designer"
              value={role}
              onChange={(e) => { setRole(e.target.value); clearFieldError("role") }}
              onBlur={() => touch("role")}
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
      <FormSection title="Energy" subtitle="How does this feel?" error={touched.energyType ? fieldErrors.energyType : undefined}>
        <EnergyInput
          type={energyType}
          intensity={energyIntensity}
          onTypeChange={(t) => { setEnergyType(t); clearFieldError("energyType"); touch("energyType") }}
          onIntensityChange={setEnergyIntensity}
        />
      </FormSection>

      {/* Section 4 — Signal */}
      <FormSection title="Signal" subtitle="How did you find this?" error={touched.signalType ? fieldErrors.signalType : undefined}>
        <SignalInput
          type={signalType}
          notes={signalNotes}
          onTypeChange={(t) => { setSignalType(t); clearFieldError("signalType"); touch("signalType") }}
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

      {submitError && <div className="alert alert-error"><span>{submitError}</span></div>}

      <div className="flex gap-3">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : isEdit ? "Save changes" : "Save opportunity"}
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
  error,
  children,
}: {
  title: string
  subtitle?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-sm opacity-60">{subtitle}</p>}
      </div>
      <div className={`card bg-base-200 border ${error ? "border-error" : "border-base-300"}`}>
        <div className="card-body p-4">
          {children}
        </div>
      </div>
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="form-control gap-1">
      <label className="label label-text text-xs opacity-70">{label}</label>
      {children}
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  )
}
