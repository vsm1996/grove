import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

vi.mock("@/lib/capacity", () => ({
  useFeedback: vi.fn(),
}))

vi.mock("@/lib/grove/db", () => ({
  addReflection: vi.fn(),
}))

import { useFeedback } from "@/lib/capacity"
import { addReflection } from "@/lib/grove/db"
import { ReflectionForm } from "@/components/grove/ReflectionForm"

const mockFire = vi.fn()
const mockOnAdded = vi.fn()
const mockOnCancel = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useFeedback).mockReturnValue({ fire: mockFire } as never)
})

const defaultProps = {
  opportunityId: "opp-1",
  onAdded: mockOnAdded,
  onCancel: mockOnCancel,
}

describe("ReflectionForm", () => {
  // ── Rendering ─────────────────────────────────

  it("renders sentiment buttons", () => {
    render(<ReflectionForm {...defaultProps} />)
    expect(screen.getByText("Expanded")).toBeInTheDocument()
    expect(screen.getByText("Neutral")).toBeInTheDocument()
    expect(screen.getByText("Drained")).toBeInTheDocument()
  })

  it("renders sentiment descriptions", () => {
    render(<ReflectionForm {...defaultProps} />)
    expect(screen.getByText("Came out energized, excited")).toBeInTheDocument()
    expect(screen.getByText("Fine, neither good nor bad")).toBeInTheDocument()
    expect(screen.getByText("Left feeling depleted")).toBeInTheDocument()
  })

  it("renders three toggle checkboxes", () => {
    render(<ReflectionForm {...defaultProps} />)
    expect(screen.getByText("They actively listened")).toBeInTheDocument()
    expect(screen.getByText("Meaningful challenge")).toBeInTheDocument()
    expect(screen.getByText("Respectful engagement")).toBeInTheDocument()
  })

  it("renders notes textarea", () => {
    render(<ReflectionForm {...defaultProps} />)
    expect(screen.getByPlaceholderText(/debrief notes/i)).toBeInTheDocument()
  })

  // ── Submit button state ───────────────────────

  it("disables submit when no sentiment is selected", () => {
    render(<ReflectionForm {...defaultProps} />)
    expect(screen.getByText("Save reflection")).toBeDisabled()
  })

  it("enables submit when sentiment is selected", () => {
    render(<ReflectionForm {...defaultProps} />)
    fireEvent.click(screen.getByText("Expanded"))
    expect(screen.getByText("Save reflection")).not.toBeDisabled()
  })

  // ── Cancel ────────────────────────────────────

  it("calls onCancel when cancel button is clicked", () => {
    render(<ReflectionForm {...defaultProps} />)
    fireEvent.click(screen.getByText("Cancel"))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  // ── Submission ────────────────────────────────

  it("submits reflection with correct data", async () => {
    const mockReflection = {
      sentiment: "expanded",
      theyListened: true,
      meaningfulChallenge: false,
      respectfulEngagement: false,
      notes: "Great conversation",
      reflectedAt: "2024-01-01T00:00:00Z",
    }
    vi.mocked(addReflection).mockResolvedValue(mockReflection as never)

    render(<ReflectionForm {...defaultProps} />)

    // Select sentiment
    fireEvent.click(screen.getByText("Expanded"))

    // Toggle "they listened"
    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[0])

    // Add notes
    fireEvent.change(screen.getByPlaceholderText(/debrief notes/i), {
      target: { value: "Great conversation" },
    })

    // Submit
    fireEvent.click(screen.getByText("Save reflection"))

    await waitFor(() => {
      expect(addReflection).toHaveBeenCalledWith("opp-1", {
        sentiment: "expanded",
        theyListened: true,
        meaningfulChallenge: false,
        respectfulEngagement: false,
        notes: "Great conversation",
      })
    })
  })

  it("fires tap feedback and calls onAdded on success", async () => {
    const mockReflection = { sentiment: "neutral", reflectedAt: "2024-01-01" }
    vi.mocked(addReflection).mockResolvedValue(mockReflection as never)

    render(<ReflectionForm {...defaultProps} />)
    fireEvent.click(screen.getByText("Neutral"))
    fireEvent.click(screen.getByText("Save reflection"))

    await waitFor(() => {
      expect(mockFire).toHaveBeenCalledWith("tap")
      expect(mockOnAdded).toHaveBeenCalledWith(mockReflection)
    })
  })

  it("shows error and fires error feedback on failure", async () => {
    vi.mocked(addReflection).mockRejectedValue(new Error("Network error"))

    render(<ReflectionForm {...defaultProps} />)
    fireEvent.click(screen.getByText("Expanded"))
    fireEvent.click(screen.getByText("Save reflection"))

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument()
      expect(mockFire).toHaveBeenCalledWith("error")
    })
  })

  it("shows generic error message for non-Error throws", async () => {
    vi.mocked(addReflection).mockRejectedValue("something broke")

    render(<ReflectionForm {...defaultProps} />)
    fireEvent.click(screen.getByText("Drained"))
    fireEvent.click(screen.getByText("Save reflection"))

    await waitFor(() => {
      expect(screen.getByText("Failed to save reflection")).toBeInTheDocument()
    })
  })

  it("does not submit when sentiment is not selected (form submit)", () => {
    render(<ReflectionForm {...defaultProps} />)
    const form = screen.getByText("Save reflection").closest("form")!
    fireEvent.submit(form)
    expect(addReflection).not.toHaveBeenCalled()
  })

  it("omits notes when empty", async () => {
    vi.mocked(addReflection).mockResolvedValue({ sentiment: "expanded" } as never)

    render(<ReflectionForm {...defaultProps} />)
    fireEvent.click(screen.getByText("Expanded"))
    fireEvent.click(screen.getByText("Save reflection"))

    await waitFor(() => {
      expect(addReflection).toHaveBeenCalledWith("opp-1", expect.objectContaining({
        notes: undefined,
      }))
    })
  })
})
