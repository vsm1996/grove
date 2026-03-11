import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AlignmentInput, EnergyInput, SignalInput } from "@/components/grove/ScoreInputs"

// ── AlignmentInput ─────────────────────────────

describe("AlignmentInput", () => {
  it("displays current score and label", () => {
    render(<AlignmentInput value={8} onChange={vi.fn()} />)
    expect(screen.getByText("8/10 — Strong fit")).toBeInTheDocument()
  })

  it("renders range input with correct bounds", () => {
    render(<AlignmentInput value={5} onChange={vi.fn()} />)
    const slider = screen.getByRole("slider")
    expect(slider).toHaveAttribute("min", "0")
    expect(slider).toHaveAttribute("max", "10")
    expect(slider).toHaveAttribute("step", "0.5")
  })

  it("calls onChange when slider moves", () => {
    const onChange = vi.fn()
    render(<AlignmentInput value={5} onChange={onChange} />)
    fireEvent.change(screen.getByRole("slider"), { target: { value: "7" } })
    expect(onChange).toHaveBeenCalledWith(7)
  })

  it("renders notes textarea when onNotesChange is provided", () => {
    render(
      <AlignmentInput value={5} onChange={vi.fn()} notes="" onNotesChange={vi.fn()} />
    )
    expect(screen.getByPlaceholderText(/why does this role align/i)).toBeInTheDocument()
  })

  it("hides notes textarea when onNotesChange is not provided", () => {
    render(<AlignmentInput value={5} onChange={vi.fn()} />)
    expect(screen.queryByPlaceholderText(/why does this role align/i)).not.toBeInTheDocument()
  })

  it("calls onNotesChange when notes textarea changes", () => {
    const onNotesChange = vi.fn()
    render(
      <AlignmentInput value={5} onChange={vi.fn()} notes="" onNotesChange={onNotesChange} />
    )
    fireEvent.change(screen.getByPlaceholderText(/why does this role align/i), {
      target: { value: "Great culture fit" },
    })
    expect(onNotesChange).toHaveBeenCalledWith("Great culture fit")
  })

  it("shows correct labels for different score ranges", () => {
    const { rerender } = render(<AlignmentInput value={9.5} onChange={vi.fn()} />)
    expect(screen.getByText("9.5/10 — Dream role")).toBeInTheDocument()

    rerender(<AlignmentInput value={2} onChange={vi.fn()} />)
    expect(screen.getByText("2/10 — Misaligned")).toBeInTheDocument()

    rerender(<AlignmentInput value={4} onChange={vi.fn()} />)
    expect(screen.getByText("4/10 — Questionable")).toBeInTheDocument()
  })
})

// ── EnergyInput ────────────────────────────────

describe("EnergyInput", () => {
  it("renders three energy type buttons", () => {
    render(
      <EnergyInput intensity={5} onTypeChange={vi.fn()} onIntensityChange={vi.fn()} />
    )
    expect(screen.getByText("Expansive")).toBeInTheDocument()
    expect(screen.getByText("Neutral")).toBeInTheDocument()
    expect(screen.getByText("Extractive")).toBeInTheDocument()
  })

  it("renders descriptions for each type", () => {
    render(
      <EnergyInput intensity={5} onTypeChange={vi.fn()} onIntensityChange={vi.fn()} />
    )
    expect(screen.getByText(/energizes and excites/i)).toBeInTheDocument()
    expect(screen.getByText(/neither draining/i)).toBeInTheDocument()
    expect(screen.getByText(/draining, heavy/i)).toBeInTheDocument()
  })

  it("calls onTypeChange when a type button is clicked", () => {
    const onTypeChange = vi.fn()
    render(
      <EnergyInput intensity={5} onTypeChange={onTypeChange} onIntensityChange={vi.fn()} />
    )
    fireEvent.click(screen.getByText("Expansive"))
    expect(onTypeChange).toHaveBeenCalledWith("expansive")
  })

  it("hides intensity slider when no type is selected", () => {
    render(
      <EnergyInput intensity={5} onTypeChange={vi.fn()} onIntensityChange={vi.fn()} />
    )
    expect(screen.queryByRole("slider")).not.toBeInTheDocument()
  })

  it("shows intensity slider when a type is selected", () => {
    render(
      <EnergyInput type="expansive" intensity={5} onTypeChange={vi.fn()} onIntensityChange={vi.fn()} />
    )
    expect(screen.getByRole("slider")).toBeInTheDocument()
    expect(screen.getByText("5/10")).toBeInTheDocument()
  })

  it("calls onIntensityChange when intensity slider changes", () => {
    const onIntensityChange = vi.fn()
    render(
      <EnergyInput type="neutral" intensity={5} onTypeChange={vi.fn()} onIntensityChange={onIntensityChange} />
    )
    fireEvent.change(screen.getByRole("slider"), { target: { value: "8" } })
    expect(onIntensityChange).toHaveBeenCalledWith(8)
  })

  it("highlights the selected type button", () => {
    const { container } = render(
      <EnergyInput type="extractive" intensity={5} onTypeChange={vi.fn()} onIntensityChange={vi.fn()} />
    )
    const buttons = container.querySelectorAll("button")
    // extractive is the 3rd button
    expect(buttons[2].className).toContain("border-error/60")
  })
})

// ── SignalInput ─────────────────────────────────

describe("SignalInput", () => {
  it("renders four signal type buttons", () => {
    render(
      <SignalInput onTypeChange={vi.fn()} onNotesChange={vi.fn()} />
    )
    expect(screen.getByText("Referral")).toBeInTheDocument()
    expect(screen.getByText("Warm Network")).toBeInTheDocument()
    expect(screen.getByText("Recruiter Outreach")).toBeInTheDocument()
    expect(screen.getByText("Cold Apply")).toBeInTheDocument()
  })

  it("renders descriptions for each signal type", () => {
    render(
      <SignalInput onTypeChange={vi.fn()} onNotesChange={vi.fn()} />
    )
    expect(screen.getByText(/direct referral/i)).toBeInTheDocument()
    expect(screen.getByText(/mutual connection/i)).toBeInTheDocument()
    expect(screen.getByText(/inbound recruiter/i)).toBeInTheDocument()
    expect(screen.getByText(/no connection/i)).toBeInTheDocument()
  })

  it("calls onTypeChange when a signal button is clicked", () => {
    const onTypeChange = vi.fn()
    render(
      <SignalInput onTypeChange={onTypeChange} onNotesChange={vi.fn()} />
    )
    fireEvent.click(screen.getByText("Referral"))
    expect(onTypeChange).toHaveBeenCalledWith("referral")
  })

  it("renders notes input", () => {
    render(
      <SignalInput notes="" onTypeChange={vi.fn()} onNotesChange={vi.fn()} />
    )
    expect(screen.getByPlaceholderText(/referred by/i)).toBeInTheDocument()
  })

  it("calls onNotesChange when notes input changes", () => {
    const onNotesChange = vi.fn()
    render(
      <SignalInput notes="" onTypeChange={vi.fn()} onNotesChange={onNotesChange} />
    )
    fireEvent.change(screen.getByPlaceholderText(/referred by/i), {
      target: { value: "Jamie at Vercel" },
    })
    expect(onNotesChange).toHaveBeenCalledWith("Jamie at Vercel")
  })

  it("highlights selected signal type", () => {
    const { container } = render(
      <SignalInput type="warm" onTypeChange={vi.fn()} onNotesChange={vi.fn()} />
    )
    const buttons = container.querySelectorAll("button")
    // warm is the 2nd button
    expect(buttons[1].className).toContain("border-info/60")
  })
})
