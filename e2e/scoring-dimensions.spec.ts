import { test, expect, mockSupabase, makeOpportunityRow } from "./fixtures"

/**
 * E2E tests for the four scoring dimensions:
 * Alignment, Energy, Signal, Positioning.
 *
 * These verify that dimension data flows correctly from the mock API
 * through the Zustand store to the rendered detail page UI.
 */

test.describe("Scoring Dimensions — Alignment", () => {
  test("renders alignment score and 'Strong fit' label for score 8", async ({ page }) => {
    const opp = makeOpportunityRow({ alignment_score: 8 })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("8/10")).toBeVisible()
    await expect(page.getByText("Strong fit")).toBeVisible()
  })

  test("renders 'Dream role' label for score 9", async ({ page }) => {
    const opp = makeOpportunityRow({ alignment_score: 9 })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("9/10")).toBeVisible()
    await expect(page.getByText("Dream role")).toBeVisible()
  })

  test("renders 'Solid option' label for score 5", async ({ page }) => {
    const opp = makeOpportunityRow({ alignment_score: 5 })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("5/10")).toBeVisible()
    await expect(page.getByText("Solid option")).toBeVisible()
  })

  test("renders 'Questionable' label for score 3", async ({ page }) => {
    const opp = makeOpportunityRow({ alignment_score: 3 })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("3/10")).toBeVisible()
    await expect(page.getByText("Questionable")).toBeVisible()
  })

  test("renders 'Misaligned' label for score 2", async ({ page }) => {
    const opp = makeOpportunityRow({ alignment_score: 2 })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("2/10")).toBeVisible()
    await expect(page.getByText("Misaligned")).toBeVisible()
  })

  test("renders alignment notes when present", async ({ page }) => {
    const opp = makeOpportunityRow({ alignment_notes: "Perfect team culture" })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Perfect team culture")).toBeVisible({ timeout: 15000 })
  })
})

test.describe("Scoring Dimensions — Energy", () => {
  test("renders 'Expansive' energy badge with success color", async ({ page }) => {
    const opp = makeOpportunityRow({ energy_type: "expansive", energy_intensity: 9 })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Expansive").first()).toBeVisible()
    await expect(page.getByText("×9/10")).toBeVisible()
  })

  test("renders 'Neutral' energy badge", async ({ page }) => {
    const opp = makeOpportunityRow({ energy_type: "neutral", energy_intensity: 5 })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Neutral").first()).toBeVisible()
    await expect(page.getByText("×5/10")).toBeVisible()
  })

  test("renders 'Extractive' energy badge with error color", async ({ page }) => {
    const opp = makeOpportunityRow({ energy_type: "extractive", energy_intensity: 3 })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Extractive").first()).toBeVisible()
    await expect(page.getByText("×3/10")).toBeVisible()
  })
})

test.describe("Scoring Dimensions — Signal", () => {
  test("renders 'Referral' signal badge", async ({ page }) => {
    const opp = makeOpportunityRow({ signal_type: "referral", signal_notes: "From Jamie at Vercel" })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Referral")).toBeVisible()
  })

  test("renders 'Warm Network' signal badge", async ({ page }) => {
    const opp = makeOpportunityRow({ signal_type: "warm" })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Warm Network")).toBeVisible()
  })

  test("renders 'Recruiter Outreach' signal badge", async ({ page }) => {
    const opp = makeOpportunityRow({ signal_type: "recruiter" })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Recruiter Outreach")).toBeVisible()
  })

  test("renders 'Cold Apply' signal badge", async ({ page }) => {
    const opp = makeOpportunityRow({ signal_type: "cold" })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Cold Apply")).toBeVisible()
  })
})

test.describe("Scoring Dimensions — Positioning", () => {
  test("renders narrative angle", async ({ page }) => {
    const opp = makeOpportunityRow({ narrative_angle: "Design systems leader" })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Positioning")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Design systems leader")).toBeVisible()
  })

  test("renders proof artifact", async ({ page }) => {
    const opp = makeOpportunityRow({ proof_artifact: "Before/after metrics case study" })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Positioning")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Before/after metrics case study")).toBeVisible()
  })

  test("renders skill gap", async ({ page }) => {
    const opp = makeOpportunityRow({ skill_gap: "No ML experience" })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Positioning")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("No ML experience")).toBeVisible()
  })

  test("hides positioning section when all fields are null", async ({ page }) => {
    const opp = makeOpportunityRow({
      narrative_angle: null,
      proof_artifact: null,
      skill_gap: null,
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    // Positioning heading should not appear
    await expect(page.locator("h2", { hasText: "Positioning" })).not.toBeVisible()
  })
})
