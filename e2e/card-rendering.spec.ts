import { test, expect, mockSupabase, makeOpportunityRow } from "./fixtures"
import type { Page } from "@playwright/test"

/**
 * E2E tests for OpportunityCard density-adaptive rendering.
 *
 * Card density is controlled by Harmonia's cognitive capacity:
 *   low density    → status + score only
 *   medium density → status + energy + signal + score
 *   high density   → all fields (status, energy, signal, score, followup, gap)
 *
 * We use Harmonia's capacity presets to switch density in the browser.
 */

const OPP_WITH_ALL_FIELDS = makeOpportunityRow({
  id: "opp-card-1",
  company: "DensityTest Corp",
  role: "Staff Engineer",
  status: "interviewing",
  alignment_score: 8,
  energy_type: "expansive",
  energy_intensity: 7,
  signal_type: "warm",
  skill_gap: "Distributed systems",
  followup_action: "Send portfolio",
  followup_due_date: "2024-03-01",
  followup_completed: false,
})

/** Open capacity controls and select a preset to change the density mode */
async function selectPreset(page: Page, presetLabel: string) {
  // Open the capacity controls panel
  await page.locator(".fixed.bottom-4").getByRole("button", { name: /capacity/i }).click()
  await expect(page.getByText("Capacity Controls")).toBeVisible()

  // Select a preset from the dropdown
  const presetSelect = page.locator("select").filter({ hasText: /select a preset/i })
  await presetSelect.selectOption({ label: new RegExp(presetLabel) })

  // Close the panel so it doesn't overlap card content
  await page.getByRole("button", { name: "Close capacity controls" }).click()
  await expect(page.getByText("Capacity Controls")).not.toBeVisible()
}

test.describe("Card Density — Low (Exhausted preset)", () => {
  test("shows only status badge and score", async ({ page }) => {
    await mockSupabase(page, { opportunities: [OPP_WITH_ALL_FIELDS] })
    await page.goto("/dashboard")
    await expect(page.getByText("DensityTest Corp")).toBeVisible({ timeout: 15000 })

    // Switch to exhausted preset → cognitive=0.1 → low density
    await selectPreset(page, "Exhausted")

    // Wait for UI to re-render with new density
    const card = page.locator(".card", { hasText: "DensityTest Corp" }).first()

    // Status badge should be visible (Interviewing)
    await expect(card.getByText("Interviewing", { exact: true })).toBeVisible()

    // Score should be visible
    // alignment=8, warm(0.75), expansive(1.0) → (0.4+0.225+0.2)*100 = 83
    await expect(card.getByText("83")).toBeVisible()

    // Energy badge should NOT be visible at low density
    await expect(card.getByText("Expansive")).not.toBeVisible()

    // Signal badge should NOT be visible at low density
    await expect(card.getByText("Warm Network")).not.toBeVisible()

    // Follow-up should NOT be visible
    await expect(card.getByText("Send portfolio")).not.toBeVisible()

    // Skill gap should NOT be visible
    await expect(card.getByText("Distributed systems")).not.toBeVisible()
  })
})

test.describe("Card Density — Medium (Neutral preset)", () => {
  test("shows status, energy, signal, and score", async ({ page }) => {
    await mockSupabase(page, { opportunities: [OPP_WITH_ALL_FIELDS] })
    await page.goto("/dashboard")
    await expect(page.getByText("DensityTest Corp")).toBeVisible({ timeout: 15000 })

    // Switch to neutral preset → cognitive=0.5 → medium density
    await selectPreset(page, "Neutral")

    const card = page.locator(".card", { hasText: "DensityTest Corp" }).first()

    // Status, score, energy, signal should all be visible
    await expect(card.getByText("Interviewing", { exact: true })).toBeVisible()
    await expect(card.getByText("83")).toBeVisible()
    await expect(card.getByText("Expansive")).toBeVisible()
    await expect(card.getByText("Warm Network")).toBeVisible()

    // Follow-up and gap should NOT be visible at medium
    await expect(card.getByText("Send portfolio")).not.toBeVisible()
    await expect(card.getByText("Distributed systems")).not.toBeVisible()
  })
})

test.describe("Card Density — High (Exploring preset)", () => {
  test("shows all fields including follow-up and skill gap", async ({ page }) => {
    await mockSupabase(page, { opportunities: [OPP_WITH_ALL_FIELDS] })
    await page.goto("/dashboard")
    await expect(page.getByText("DensityTest Corp")).toBeVisible({ timeout: 15000 })

    // Switch to exploring preset → cognitive=1.0 → high density
    await selectPreset(page, "Exploring")

    const card = page.locator(".card", { hasText: "DensityTest Corp" }).first()

    // All fields should be visible
    await expect(card.getByText("Interviewing", { exact: true })).toBeVisible()
    await expect(card.getByText("83")).toBeVisible()
    await expect(card.getByText("Expansive")).toBeVisible()
    await expect(card.getByText("Warm Network")).toBeVisible()
    await expect(card.getByText("Send portfolio")).toBeVisible()
    await expect(card.getByText("Distributed systems")).toBeVisible()
  })

  test("hides follow-up when completed", async ({ page }) => {
    const opp = makeOpportunityRow({
      ...OPP_WITH_ALL_FIELDS,
      followup_completed: true,
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/dashboard")
    await expect(page.getByText("DensityTest Corp")).toBeVisible({ timeout: 15000 })

    await selectPreset(page, "Exploring")

    const card = page.locator(".card", { hasText: "DensityTest Corp" }).first()
    // Follow-up is completed → hidden even at high density
    await expect(card.getByText("Send portfolio")).not.toBeVisible()
  })

  test("hides skill gap when not set", async ({ page }) => {
    const opp = makeOpportunityRow({
      ...OPP_WITH_ALL_FIELDS,
      skill_gap: null,
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/dashboard")
    await expect(page.getByText("DensityTest Corp")).toBeVisible({ timeout: 15000 })

    await selectPreset(page, "Exploring")

    const card = page.locator(".card", { hasText: "DensityTest Corp" }).first()
    // No gap badge should appear
    await expect(card.locator(".badge", { hasText: "gap" })).not.toBeVisible()
  })
})

test.describe("Card Category Badge", () => {
  test("pursue card shows 'pursue' badge", async ({ page }) => {
    const opp = makeOpportunityRow({
      alignment_score: 9,
      signal_type: "referral",
      energy_type: "expansive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    // category badge shows "pursue" (underscores replaced with spaces)
    await expect(page.locator(".card").first().getByText("pursue")).toBeVisible()
  })

  test("worth_it card shows 'worth it' badge", async ({ page }) => {
    const opp = makeOpportunityRow({
      alignment_score: 8,
      signal_type: "recruiter",
      energy_type: "neutral",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    await expect(page.locator(".card").first().getByText("worth it")).toBeVisible()
  })

  test("mercenary card shows 'mercenary' badge", async ({ page }) => {
    const opp = makeOpportunityRow({
      alignment_score: 4,
      signal_type: "warm",
      energy_type: "expansive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    await expect(page.locator(".card").first().getByText("mercenary")).toBeVisible()
  })

  test("experimental card shows 'experimental' badge", async ({ page }) => {
    const opp = makeOpportunityRow({
      alignment_score: 3,
      signal_type: "cold",
      energy_type: "extractive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    await expect(page.locator(".card").first().getByText("experimental")).toBeVisible()
  })
})

test.describe("Card CTA Link", () => {
  test("card links to opportunity detail page", async ({ page }) => {
    const opp = makeOpportunityRow({ id: "opp-link-test" })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })

    // CTA link should point to the detail page
    const ctaLink = page.locator("a[href='/opportunities/opp-link-test']")
    await expect(ctaLink).toBeVisible()
  })
})
