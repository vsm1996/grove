import { test, expect, mockSupabase, makeOpportunityRow } from "./fixtures"

/**
 * E2E tests for the composite score algorithm and category derivation.
 *
 * Composite formula:
 *   Math.round((alignment/10 * 0.5 + signalWeight * 0.3 + energyWeight * 0.2) * 100)
 *
 * Signal weights:  referral=1.0, warm=0.75, recruiter=0.5, cold=0.25
 * Energy weights:  expansive=1.0, neutral=0.5, extractive=0.0
 *
 * Category rules (checked in order):
 *   pursue      → alignment≥7 AND (referral OR warm)
 *   worth_it    → alignment≥7 AND NOT extractive
 *   mercenary   → alignment<7 AND (referral OR warm)
 *   experimental → everything else
 */

test.describe("Composite Score Algorithm", () => {
  // ── Score computation verified on the detail page ──

  test("alignment=8, warm, expansive → score 83", async ({ page }) => {
    // (8/10*0.5 + 0.75*0.3 + 1.0*0.2) * 100 = (0.4 + 0.225 + 0.2) * 100 = 82.5 → 83
    const opp = makeOpportunityRow({
      alignment_score: 8,
      signal_type: "warm",
      energy_type: "expansive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("83/100")).toBeVisible()
  })

  test("alignment=10, referral, expansive → score 100", async ({ page }) => {
    // (10/10*0.5 + 1.0*0.3 + 1.0*0.2) * 100 = (0.5 + 0.3 + 0.2) * 100 = 100
    const opp = makeOpportunityRow({
      alignment_score: 10,
      signal_type: "referral",
      energy_type: "expansive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("100/100")).toBeVisible()
  })

  test("alignment=0, cold, extractive → score 8", async ({ page }) => {
    // (0/10*0.5 + 0.25*0.3 + 0.0*0.2) * 100 = (0 + 0.075 + 0) * 100 = 7.5 → 8
    const opp = makeOpportunityRow({
      alignment_score: 0,
      signal_type: "cold",
      energy_type: "extractive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("8/100")).toBeVisible()
  })

  test("alignment=5, cold, neutral → score 43", async ({ page }) => {
    // (5/10*0.5 + 0.25*0.3 + 0.5*0.2) * 100 = (0.25 + 0.075 + 0.1) * 100 = 42.5 → 43
    const opp = makeOpportunityRow({
      alignment_score: 5,
      signal_type: "cold",
      energy_type: "neutral",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("43/100")).toBeVisible()
  })

  test("alignment=7, recruiter, neutral → score 50", async ({ page }) => {
    // (7/10*0.5 + 0.5*0.3 + 0.5*0.2) * 100 = (0.35 + 0.15 + 0.1) * 100 = 60
    const opp = makeOpportunityRow({
      alignment_score: 7,
      signal_type: "recruiter",
      energy_type: "neutral",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("60/100")).toBeVisible()
  })

  test("alignment=4, referral, expansive → score 70", async ({ page }) => {
    // (4/10*0.5 + 1.0*0.3 + 1.0*0.2) * 100 = (0.2 + 0.3 + 0.2) * 100 = 70
    const opp = makeOpportunityRow({
      alignment_score: 4,
      signal_type: "referral",
      energy_type: "expansive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("70/100")).toBeVisible()
  })

  test("alignment=6, warm, extractive → score 53", async ({ page }) => {
    // (6/10*0.5 + 0.75*0.3 + 0.0*0.2) * 100 = (0.3 + 0.225 + 0) * 100 = 52.5 → 53
    const opp = makeOpportunityRow({
      alignment_score: 6,
      signal_type: "warm",
      energy_type: "extractive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("53/100")).toBeVisible()
  })
})

test.describe("Category Derivation", () => {
  test("pursue: high alignment + strong signal (referral)", async ({ page }) => {
    const opp = makeOpportunityRow({
      id: "cat-pursue",
      company: "Pursue Co",
      alignment_score: 9,
      signal_type: "referral",
      energy_type: "expansive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/cat-pursue")
    await expect(page.locator("h1", { hasText: "Pursue Co" })).toBeVisible({ timeout: 15000 })
    // Category badge in the header
    await expect(page.getByText("Pursue", { exact: true })).toBeVisible()
  })

  test("pursue: high alignment + strong signal (warm)", async ({ page }) => {
    const opp = makeOpportunityRow({
      id: "cat-pursue-warm",
      company: "Warm Pursue Co",
      alignment_score: 7,
      signal_type: "warm",
      energy_type: "neutral",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/cat-pursue-warm")
    await expect(page.locator("h1", { hasText: "Warm Pursue Co" })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Pursue", { exact: true })).toBeVisible()
  })

  test("worth_it: high alignment + weak signal + not extractive", async ({ page }) => {
    const opp = makeOpportunityRow({
      id: "cat-worthit",
      company: "Worth It Co",
      alignment_score: 8,
      signal_type: "recruiter",
      energy_type: "neutral",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/cat-worthit")
    await expect(page.locator("h1", { hasText: "Worth It Co" })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Worth It")).toBeVisible()
  })

  test("mercenary: low alignment + strong signal", async ({ page }) => {
    const opp = makeOpportunityRow({
      id: "cat-merc",
      company: "Mercenary Co",
      alignment_score: 4,
      signal_type: "referral",
      energy_type: "expansive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/cat-merc")
    await expect(page.locator("h1", { hasText: "Mercenary Co" })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Mercenary")).toBeVisible()
  })

  test("experimental: low alignment + weak signal", async ({ page }) => {
    const opp = makeOpportunityRow({
      id: "cat-exp",
      company: "Experimental Co",
      alignment_score: 3,
      signal_type: "cold",
      energy_type: "extractive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/cat-exp")
    await expect(page.locator("h1", { hasText: "Experimental Co" })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Experimental")).toBeVisible()
  })

  test("experimental: high alignment + extractive + weak signal", async ({ page }) => {
    // alignment=8 (high), signal=cold (weak), energy=extractive
    // pursue? No (no strong signal). worth_it? No (extractive). mercenary? No (not strong signal). → experimental
    const opp = makeOpportunityRow({
      id: "cat-exp-extractive",
      company: "Draining Co",
      alignment_score: 8,
      signal_type: "cold",
      energy_type: "extractive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/cat-exp-extractive")
    await expect(page.locator("h1", { hasText: "Draining Co" })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Experimental")).toBeVisible()
  })

  test("boundary: alignment=7 is high (pursue with strong signal)", async ({ page }) => {
    const opp = makeOpportunityRow({
      id: "cat-boundary",
      company: "Boundary Co",
      alignment_score: 7,
      signal_type: "referral",
      energy_type: "neutral",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/cat-boundary")
    await expect(page.locator("h1", { hasText: "Boundary Co" })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Pursue", { exact: true })).toBeVisible()
  })

  test("boundary: alignment=6 is low (mercenary with strong signal)", async ({ page }) => {
    const opp = makeOpportunityRow({
      id: "cat-boundary-low",
      company: "Low Boundary Co",
      alignment_score: 6,
      signal_type: "warm",
      energy_type: "expansive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/opportunities/cat-boundary-low")
    await expect(page.locator("h1", { hasText: "Low Boundary Co" })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Mercenary")).toBeVisible()
  })
})

test.describe("Composite Score on Dashboard Cards", () => {
  test("score renders on opportunity cards with progress bar", async ({ page }) => {
    const opp = makeOpportunityRow({
      alignment_score: 8,
      signal_type: "warm",
      energy_type: "expansive",
    })
    await mockSupabase(page, { opportunities: [opp] })
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    // Score should be 83 on the card
    await expect(page.getByText("83")).toBeVisible()
    // Progress bar should exist
    await expect(page.locator("progress")).toBeVisible()
  })

  test("multiple cards show correct individual scores", async ({ page }) => {
    const pursue = makeOpportunityRow({
      id: "opp-1",
      company: "High Score Co",
      alignment_score: 10,
      signal_type: "referral",
      energy_type: "expansive",
    })
    const experimental = makeOpportunityRow({
      id: "opp-2",
      company: "Low Score Co",
      alignment_score: 2,
      signal_type: "cold",
      energy_type: "extractive",
    })
    await mockSupabase(page, { opportunities: [pursue, experimental] })
    await page.goto("/dashboard")
    await expect(page.getByText("High Score Co")).toBeVisible({ timeout: 15000 })

    // High Score Co: (1.0*0.5 + 1.0*0.3 + 1.0*0.2)*100 = 100
    await expect(page.getByText("100")).toBeVisible()
    // Low Score Co: (0.2*0.5 + 0.25*0.3 + 0.0*0.2)*100 = 17.5 → 18
    await expect(page.getByText("18")).toBeVisible()
  })
})
