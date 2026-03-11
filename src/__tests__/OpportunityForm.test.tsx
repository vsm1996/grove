import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ── Mocks ─────────────────────────────────────

const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}))

vi.mock("@/lib/capacity", () => ({
  useFeedback: vi.fn(),
}))

vi.mock("@/lib/grove/db", () => ({
  createOpportunity: vi.fn(),
}))

vi.mock("@/store/grove", () => ({
  useGroveStore: vi.fn(),
}))

import { useFeedback } from "@/lib/capacity"
import { createOpportunity } from "@/lib/grove/db"
import { useGroveStore } from "@/store/grove"
import { OpportunityForm } from "@/components/grove/OpportunityForm"

const mockFire = vi.fn()
const mockAddOpportunity = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useFeedback).mockReturnValue({ fire: mockFire } as never)
  vi.mocked(useGroveStore).mockImplementation(
    (selector: (s: { addOpportunity: typeof mockAddOpportunity }) => unknown) =>
      selector({ addOpportunity: mockAddOpportunity })
  )
})

// ── Helpers ───────────────────────────────────

/** Fill the minimum required fields to enable submit */
function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText("Acme Corp"), {
    target: { value: "TestCo" },
  })
  fireEvent.change(screen.getByPlaceholderText("Senior Product Designer"), {
    target: { value: "Engineer" },
  })
  // Select energy type (Expansive button)
  fireEvent.click(screen.getByText("Expansive"))
  // Select signal type (Referral button)
  fireEvent.click(screen.getByText("Referral"))
}

// ── Tests ─────────────────────────────────────

describe("OpportunityForm", () => {
  // ── Rendering ─────────────────────────────────

  it("renders all seven section headings", () => {
    render(<OpportunityForm />)
    expect(screen.getByText("The Role")).toBeInTheDocument()
    expect(screen.getByText("Alignment")).toBeInTheDocument()
    expect(screen.getByText("Energy")).toBeInTheDocument()
    expect(screen.getByText("Signal")).toBeInTheDocument()
    expect(screen.getByText("Positioning")).toBeInTheDocument()
    expect(screen.getByText("Context")).toBeInTheDocument()
    expect(screen.getByText("Follow-Up")).toBeInTheDocument()
  })

  it("renders section subtitles", () => {
    render(<OpportunityForm />)
    expect(screen.getByText("How well does this fit you?")).toBeInTheDocument()
    expect(screen.getByText("How does this feel?")).toBeInTheDocument()
    expect(screen.getByText("How did you find this?")).toBeInTheDocument()
    expect(screen.getByText("What's the gap?")).toBeInTheDocument()
    expect(screen.getByText("The practical stuff")).toBeInTheDocument()
    expect(screen.getByText("What's next?")).toBeInTheDocument()
  })

  it("renders company and role inputs", () => {
    render(<OpportunityForm />)
    expect(screen.getByPlaceholderText("Acme Corp")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Senior Product Designer")).toBeInTheDocument()
  })

  it("renders status select with default 'Saved'", () => {
    render(<OpportunityForm />)
    const select = screen.getByDisplayValue("Saved")
    expect(select).toBeInTheDocument()
  })

  // ── Submit validation ─────────────────────────

  describe("submit button", () => {
    it("shows company and role errors when submitting empty form", async () => {
      render(<OpportunityForm />)
      fireEvent.click(screen.getByText("Save opportunity"))
      await waitFor(() => {
        expect(screen.getByText("Company name is required.")).toBeInTheDocument()
        expect(screen.getByText("Role title is required.")).toBeInTheDocument()
        expect(screen.getByText("Select how this role feels to you.")).toBeInTheDocument()
        expect(screen.getByText("Select how you found this role.")).toBeInTheDocument()
      })
    })

    it("shows energy and signal errors when only company + role are filled", async () => {
      render(<OpportunityForm />)
      fireEvent.change(screen.getByPlaceholderText("Acme Corp"), {
        target: { value: "TestCo" },
      })
      fireEvent.change(screen.getByPlaceholderText("Senior Product Designer"), {
        target: { value: "Engineer" },
      })
      fireEvent.click(screen.getByText("Save opportunity"))
      await waitFor(() => {
        expect(screen.getByText("Select how this role feels to you.")).toBeInTheDocument()
        expect(screen.getByText("Select how you found this role.")).toBeInTheDocument()
        expect(screen.queryByText("Company name is required.")).not.toBeInTheDocument()
        expect(screen.queryByText("Role title is required.")).not.toBeInTheDocument()
      })
    })

    it("does not show errors when company + role filled but no energy/signal before submit", () => {
      render(<OpportunityForm />)
      fireEvent.change(screen.getByPlaceholderText("Acme Corp"), {
        target: { value: "TestCo" },
      })
      fireEvent.change(screen.getByPlaceholderText("Senior Product Designer"), {
        target: { value: "Engineer" },
      })
      expect(screen.queryByText("Select how this role feels to you.")).not.toBeInTheDocument()
    })

    it("enables submit and clears field error when required field is filled", async () => {
      render(<OpportunityForm />)
      fireEvent.click(screen.getByText("Save opportunity"))
      await waitFor(() => {
        expect(screen.getByText("Company name is required.")).toBeInTheDocument()
      })
      fireEvent.change(screen.getByPlaceholderText("Acme Corp"), {
        target: { value: "TestCo" },
      })
      await waitFor(() => {
        expect(screen.queryByText("Company name is required.")).not.toBeInTheDocument()
      })
    })
  })

  // ── Successful submission ─────────────────────

  it("submits with correct data and navigates on success", async () => {
    const created = { id: "new-1", company: "TestCo", role: "Engineer" }
    vi.mocked(createOpportunity).mockResolvedValue(created as never)

    render(<OpportunityForm />)
    fillRequiredFields()
    fireEvent.click(screen.getByText("Save opportunity"))

    await waitFor(() => {
      expect(createOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({
          company: "TestCo",
          role: "Engineer",
          status: "saved",
          energy: expect.objectContaining({ type: "expansive" }),
          signal: expect.objectContaining({ type: "referral" }),
        })
      )
      expect(mockAddOpportunity).toHaveBeenCalledWith(created)
      expect(mockFire).toHaveBeenCalledWith("tap")
      expect(mockPush).toHaveBeenCalledWith("/opportunities/new-1")
    })
  })

  it("trims company and role whitespace", async () => {
    vi.mocked(createOpportunity).mockResolvedValue({ id: "x" } as never)

    render(<OpportunityForm />)
    fireEvent.change(screen.getByPlaceholderText("Acme Corp"), {
      target: { value: "  Spaced Co  " },
    })
    fireEvent.change(screen.getByPlaceholderText("Senior Product Designer"), {
      target: { value: "  Lead  " },
    })
    fireEvent.click(screen.getByText("Expansive"))
    fireEvent.click(screen.getByText("Referral"))
    fireEvent.click(screen.getByText("Save opportunity"))

    await waitFor(() => {
      expect(createOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({
          company: "Spaced Co",
          role: "Lead",
        })
      )
    })
  })

  it("omits optional fields when empty", async () => {
    vi.mocked(createOpportunity).mockResolvedValue({ id: "x" } as never)

    render(<OpportunityForm />)
    fillRequiredFields()
    fireEvent.click(screen.getByText("Save opportunity"))

    await waitFor(() => {
      expect(createOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({
          url: undefined,
          resumeVersion: undefined,
          jobDescriptionNotes: undefined,
          followUp: undefined,
        })
      )
    })
  })

  it("includes optional fields when filled", async () => {
    vi.mocked(createOpportunity).mockResolvedValue({ id: "x" } as never)

    render(<OpportunityForm />)
    fillRequiredFields()

    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "https://example.com/job" },
    })
    fireEvent.change(screen.getByPlaceholderText(/narrative angle/i), {
      target: { value: "Design systems" },
    })
    fireEvent.change(screen.getByPlaceholderText(/next action/i), {
      target: { value: "Send follow-up" },
    })

    fireEvent.click(screen.getByText("Save opportunity"))

    await waitFor(() => {
      expect(createOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://example.com/job",
          positioning: expect.objectContaining({ narrativeAngle: "Design systems" }),
          followUp: expect.objectContaining({ action: "Send follow-up", completed: false }),
        })
      )
    })
  })

  // ── Error handling ────────────────────────────

  it("shows error message on failure", async () => {
    vi.mocked(createOpportunity).mockRejectedValue(new Error("DB insert failed"))

    render(<OpportunityForm />)
    fillRequiredFields()
    fireEvent.click(screen.getByText("Save opportunity"))

    await waitFor(() => {
      expect(screen.getByText("DB insert failed")).toBeInTheDocument()
      expect(mockFire).toHaveBeenCalledWith("error")
    })
  })

  it("shows generic error for non-Error throws", async () => {
    vi.mocked(createOpportunity).mockRejectedValue("boom")

    render(<OpportunityForm />)
    fillRequiredFields()
    fireEvent.click(screen.getByText("Save opportunity"))

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument()
    })
  })

  it("does not navigate on error", async () => {
    vi.mocked(createOpportunity).mockRejectedValue(new Error("fail"))

    render(<OpportunityForm />)
    fillRequiredFields()
    fireEvent.click(screen.getByText("Save opportunity"))

    await waitFor(() => {
      expect(screen.getByText("fail")).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  // ── Cancel ────────────────────────────────────

  it("calls router.back() when cancel is clicked", () => {
    render(<OpportunityForm />)
    fireEvent.click(screen.getByText("Cancel"))
    expect(mockBack).toHaveBeenCalled()
  })

  // ── Status select ─────────────────────────────

  it("allows changing status", () => {
    render(<OpportunityForm />)
    const select = screen.getByDisplayValue("Saved")
    fireEvent.change(select, { target: { value: "interviewing" } })
    expect(screen.getByDisplayValue("Interviewing")).toBeInTheDocument()
  })
})
