import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/lib/capacity", () => ({
  useCapacityContext: vi.fn(),
}))

import { useCapacityContext } from "@/lib/capacity"
import { AdaptiveText } from "@/components/ui/AdaptiveText"

function mockValence(valence: number) {
  vi.mocked(useCapacityContext).mockReturnValue({
    context: { emotionalState: { valence } },
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("AdaptiveText", () => {
  const props = {
    positive: "You're doing great!",
    neutral: "Here's what's next.",
    negative: "Take it easy.",
  }

  it("renders positive text when valence > 0.2", () => {
    mockValence(0.5)
    render(<AdaptiveText {...props} />)
    expect(screen.getByText("You're doing great!")).toBeInTheDocument()
  })

  it("renders negative text when valence < -0.2", () => {
    mockValence(-0.5)
    render(<AdaptiveText {...props} />)
    expect(screen.getByText("Take it easy.")).toBeInTheDocument()
  })

  it("renders neutral text when valence is between -0.2 and 0.2", () => {
    mockValence(0)
    render(<AdaptiveText {...props} />)
    expect(screen.getByText("Here's what's next.")).toBeInTheDocument()
  })

  it("renders neutral at exact 0.2 boundary", () => {
    mockValence(0.2)
    render(<AdaptiveText {...props} />)
    expect(screen.getByText("Here's what's next.")).toBeInTheDocument()
  })

  it("renders neutral at exact -0.2 boundary", () => {
    mockValence(-0.2)
    render(<AdaptiveText {...props} />)
    expect(screen.getByText("Here's what's next.")).toBeInTheDocument()
  })

  it("applies className to span", () => {
    mockValence(0)
    render(<AdaptiveText {...props} className="text-sm opacity-50" />)
    const span = screen.getByText("Here's what's next.")
    expect(span).toHaveClass("text-sm", "opacity-50")
  })

  it("renders as a span element", () => {
    mockValence(0)
    render(<AdaptiveText {...props} />)
    expect(screen.getByText("Here's what's next.").tagName).toBe("SPAN")
  })
})
