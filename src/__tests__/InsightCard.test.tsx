import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { InsightCard } from "@/components/grove/InsightCard"
import type { InsightPattern } from "@/types/grove"

const makePattern = (overrides: Partial<InsightPattern> = {}): InsightPattern => ({
  label: "Extractive load",
  description: "Over half your pipeline is extractive energy",
  count: 5,
  severity: "warning",
  ...overrides,
})

describe("InsightCard", () => {
  it("renders label, description, and count", () => {
    render(<InsightCard pattern={makePattern()} />)
    expect(screen.getByText("Extractive load")).toBeInTheDocument()
    expect(screen.getByText("Over half your pipeline is extractive energy")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("renders severity badge text", () => {
    render(<InsightCard pattern={makePattern({ severity: "critical" })} />)
    expect(screen.getByText("critical")).toBeInTheDocument()
  })

  describe("severity styles", () => {
    it("applies info styles", () => {
      const { container } = render(<InsightCard pattern={makePattern({ severity: "info" })} />)
      expect(container.querySelector(".border-info\\/30")).toBeInTheDocument()
      expect(screen.getByText("info")).toHaveClass("badge-info")
    })

    it("applies warning styles", () => {
      const { container } = render(<InsightCard pattern={makePattern({ severity: "warning" })} />)
      expect(container.querySelector(".border-warning\\/30")).toBeInTheDocument()
      expect(screen.getByText("warning")).toHaveClass("badge-warning")
    })

    it("applies critical styles", () => {
      const { container } = render(<InsightCard pattern={makePattern({ severity: "critical" })} />)
      expect(container.querySelector(".border-error\\/30")).toBeInTheDocument()
      expect(screen.getByText("critical")).toHaveClass("badge-error")
    })
  })
})
