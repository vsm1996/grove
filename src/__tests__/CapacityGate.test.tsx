import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/lib/capacity", () => ({
  useDerivedMode: vi.fn(),
  deriveModeLabel: vi.fn(),
}))

import { useDerivedMode, deriveModeLabel } from "@/lib/capacity"
import { CapacityGate } from "@/components/ui/CapacityGate"

function mockModeLabel(label: string) {
  vi.mocked(useDerivedMode).mockReturnValue({ field: {} as never, mode: {} as never })
  vi.mocked(deriveModeLabel).mockReturnValue(label as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("CapacityGate", () => {
  it("renders children when mode label is in allowlist", () => {
    mockModeLabel("Focused")
    render(
      <CapacityGate showIn={["Focused", "Exploratory"]}>
        <span>Visible content</span>
      </CapacityGate>
    )
    expect(screen.getByText("Visible content")).toBeInTheDocument()
  })

  it("hides children when mode label is not in allowlist", () => {
    mockModeLabel("Minimal")
    render(
      <CapacityGate showIn={["Focused", "Exploratory"]}>
        <span>Hidden content</span>
      </CapacityGate>
    )
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument()
  })

  it("renders fallback when mode label is not in allowlist", () => {
    mockModeLabel("Minimal")
    render(
      <CapacityGate showIn={["Focused"]} fallback={<span>Fallback here</span>}>
        <span>Main content</span>
      </CapacityGate>
    )
    expect(screen.queryByText("Main content")).not.toBeInTheDocument()
    expect(screen.getByText("Fallback here")).toBeInTheDocument()
  })

  it("renders nothing when no fallback and mode not in allowlist", () => {
    mockModeLabel("Calm")
    const { container } = render(
      <CapacityGate showIn={["Minimal"]}>
        <span>Content</span>
      </CapacityGate>
    )
    expect(container.innerHTML).toBe("")
  })

  it("works with single mode in allowlist", () => {
    mockModeLabel("Exploratory")
    render(
      <CapacityGate showIn={["Exploratory"]}>
        <span>Exploratory only</span>
      </CapacityGate>
    )
    expect(screen.getByText("Exploratory only")).toBeInTheDocument()
  })

  it("calls deriveModeLabel with the field from useDerivedMode", () => {
    const mockField = { some: "field" }
    vi.mocked(useDerivedMode).mockReturnValue({ field: mockField as never, mode: {} as never })
    vi.mocked(deriveModeLabel).mockReturnValue("Focused" as never)
    render(
      <CapacityGate showIn={["Focused"]}>
        <span>Content</span>
      </CapacityGate>
    )
    expect(deriveModeLabel).toHaveBeenCalledWith(mockField)
  })
})
