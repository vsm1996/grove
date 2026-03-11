import { test, expect, mockSupabase, makeOpportunityRow } from "./fixtures"

/**
 * E2E tests for the Zustand store lifecycle.
 *
 * Tests verify that store mutations (setOpportunities, addOpportunity,
 * updateOpportunity, removeOpportunity) manifest correctly in the UI
 * and that computed fields (compositeScore, category, insights) update.
 */

test.describe("Store — Load Opportunities", () => {
  test("loads and renders all opportunities from the API", async ({ page }) => {
    const opps = [
      makeOpportunityRow({ id: "opp-1", company: "Alpha Inc" }),
      makeOpportunityRow({ id: "opp-2", company: "Beta Corp" }),
      makeOpportunityRow({ id: "opp-3", company: "Gamma Labs" }),
    ]
    await mockSupabase(page, { opportunities: opps })
    await page.goto("/dashboard")

    await expect(page.getByText("Alpha Inc")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Beta Corp")).toBeVisible()
    await expect(page.getByText("Gamma Labs")).toBeVisible()
  })

  test("computes composite scores for loaded opportunities", async ({ page }) => {
    const opps = [
      makeOpportunityRow({
        id: "opp-scored",
        company: "Scored Co",
        alignment_score: 10,
        signal_type: "referral",
        energy_type: "expansive",
      }),
    ]
    await mockSupabase(page, { opportunities: opps })
    await page.goto("/dashboard")
    await expect(page.getByText("Scored Co")).toBeVisible({ timeout: 15000 })
    // (1.0*0.5 + 1.0*0.3 + 1.0*0.2)*100 = 100
    await expect(page.getByText("100")).toBeVisible()
  })

  test("computes insights on load and shows on insights page", async ({ page }) => {
    const opps = [
      makeOpportunityRow({
        id: "opp-ins-1",
        company: "Co A",
        status: "applied",
        alignment_score: 8,
        energy_type: "expansive",
      }),
      makeOpportunityRow({
        id: "opp-ins-2",
        company: "Co B",
        status: "interviewing",
        alignment_score: 6,
        energy_type: "neutral",
        signal_type: "cold",
      }),
    ]
    await mockSupabase(page, { opportunities: opps })

    // Load dashboard first so the store populates
    await page.goto("/dashboard")
    await expect(page.getByText("Co A")).toBeVisible({ timeout: 15000 })

    // Navigate to insights
    await page.getByRole("link", { name: "Insights" }).click()
    await page.waitForURL("**/insights")

    // Pipeline Health should show total = 2
    await expect(page.getByText("Pipeline Health")).toBeVisible({ timeout: 10000 })
    const totalStat = page.locator(".stat-value", { hasText: "2" })
    await expect(totalStat.first()).toBeVisible()

    // Avg alignment = (8+6)/2 = 7
    await expect(page.locator(".stat-value", { hasText: "7" })).toBeVisible()
  })
})

test.describe("Store — Add Opportunity", () => {
  test("new opportunity appears on dashboard after creation", async ({ page }) => {
    // Start with one existing opportunity
    const existing = makeOpportunityRow({ id: "opp-existing", company: "Existing Co" })
    await mockSupabase(page, { opportunities: [existing] })

    // Load dashboard
    await page.goto("/dashboard")
    await expect(page.getByText("Existing Co")).toBeVisible({ timeout: 15000 })

    // Navigate to new opportunity form
    await page.getByTitle("Add opportunity").click()
    await page.waitForURL("**/opportunities/new")

    // Fill the form
    await page.getByPlaceholder("Acme Corp").fill("Brand New Co")
    await page.getByPlaceholder("Senior Product Designer").fill("Lead Designer")
    await page.locator("button", { hasText: "Expansive" }).first().click()
    await page.locator("button", { hasText: "Referral" }).first().click()

    // Submit
    await page.locator("button[type='submit']").click()

    // Should redirect to the detail page
    await page.waitForURL("**/opportunities/**", { timeout: 10000 })

    // Navigate back to dashboard
    await page.getByRole("link", { name: "← Back" }).click()
    await page.waitForURL("**/dashboard")

    // Both opportunities should be visible
    await expect(page.getByText("Existing Co")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Brand New Co")).toBeVisible()
  })
})

test.describe("Store — Remove Opportunity", () => {
  test("deleted opportunity disappears from dashboard", async ({ page }) => {
    const opps = [
      makeOpportunityRow({ id: "opp-keep", company: "Keep Me Co" }),
      makeOpportunityRow({ id: "opp-delete", company: "Delete Me Co" }),
    ]
    await mockSupabase(page, { opportunities: opps })

    // Load dashboard — both should be visible
    await page.goto("/dashboard")
    await expect(page.getByText("Keep Me Co")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Delete Me Co")).toBeVisible()

    // Navigate to the opportunity to delete
    await page.goto("/opportunities/opp-delete")
    await expect(page.locator("h1", { hasText: "Delete Me Co" })).toBeVisible({ timeout: 15000 })

    // Delete it
    await page.locator("button", { hasText: "Delete opportunity" }).click()

    // Should redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 })

    // Only Keep Me Co should remain
    await expect(page.getByText("Keep Me Co")).toBeVisible()
    await expect(page.getByText("Delete Me Co")).not.toBeVisible()
  })
})

test.describe("Store — Update Opportunity", () => {
  test("status change on detail page updates the badge", async ({ page }) => {
    const opp = makeOpportunityRow({
      id: "opp-update",
      company: "Update Co",
      status: "applied",
    })
    await mockSupabase(page, { opportunities: [opp] })

    await page.goto("/opportunities/opp-update")
    await expect(page.locator("h1", { hasText: "Update Co" })).toBeVisible({ timeout: 15000 })

    // Current status should be "Applied"
    await expect(page.getByText("Applied", { exact: true }).first()).toBeVisible()

    // Change status to "interviewing" via the select
    await page.locator("select").first().selectOption("interviewing")

    // The StatusBadge should update to "Interviewing"
    await expect(page.getByText("Interviewing", { exact: true }).first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe("Store — Category Sorting on Dashboard", () => {
  test("opportunities are grouped by computed category", async ({ page }) => {
    const pursue = makeOpportunityRow({
      id: "opp-p",
      company: "Pursue Co",
      alignment_score: 9,
      signal_type: "referral",
      energy_type: "expansive",
    })
    const worthIt = makeOpportunityRow({
      id: "opp-w",
      company: "Worth It Co",
      alignment_score: 8,
      signal_type: "recruiter",
      energy_type: "neutral",
    })
    const mercenary = makeOpportunityRow({
      id: "opp-m",
      company: "Mercenary Co",
      alignment_score: 4,
      signal_type: "warm",
      energy_type: "expansive",
    })
    const experimental = makeOpportunityRow({
      id: "opp-e",
      company: "Experimental Co",
      alignment_score: 3,
      signal_type: "cold",
      energy_type: "extractive",
    })

    await mockSupabase(page, { opportunities: [pursue, worthIt, mercenary, experimental] })
    await page.goto("/dashboard")
    await expect(page.getByText("Pursue Co")).toBeVisible({ timeout: 15000 })

    // All four category sections should render with correct companies
    // The Pursue section should contain "Pursue Co"
    const pursueSection = page.locator("section", { hasText: "Pursue" }).first()
    await expect(pursueSection.getByText("Pursue Co")).toBeVisible()

    // Worth It section should contain "Worth It Co"
    await expect(page.getByText("Worth It Co")).toBeVisible()

    // Mercenary section should contain "Mercenary Co"
    await expect(page.getByText("Mercenary Co")).toBeVisible()

    // Experimental section should contain "Experimental Co"
    await expect(page.getByText("Experimental Co")).toBeVisible()
  })

  test("insights update when opportunities are categorized", async ({ page }) => {
    const opps = [
      makeOpportunityRow({ id: "i1", alignment_score: 9, signal_type: "referral", energy_type: "expansive" }),
      makeOpportunityRow({ id: "i2", alignment_score: 9, signal_type: "warm", energy_type: "expansive" }),
      makeOpportunityRow({ id: "i3", alignment_score: 8, signal_type: "referral", energy_type: "neutral" }),
    ]
    await mockSupabase(page, { opportunities: opps })

    // Load dashboard to populate store
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })

    // Navigate to insights
    await page.getByRole("link", { name: "Insights" }).click()
    await page.waitForURL("**/insights")

    await expect(page.getByText("Pipeline Health")).toBeVisible({ timeout: 10000 })

    // All 3 are pursue category
    // "Strong pursuit pipeline" pattern should appear (>=3 pursue)
    await expect(page.getByText("Strong pursuit pipeline")).toBeVisible()
  })

  test("positioning gaps aggregate on insights page", async ({ page }) => {
    const opps = [
      makeOpportunityRow({ id: "g1", skill_gap: "ML experience" }),
      makeOpportunityRow({ id: "g2", skill_gap: "Management experience" }),
      makeOpportunityRow({ id: "g3", skill_gap: "ML experience" }),
    ]
    await mockSupabase(page, { opportunities: opps })

    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })

    await page.getByRole("link", { name: "Insights" }).click()
    await page.waitForURL("**/insights")

    await expect(page.getByText("Positioning Gaps")).toBeVisible({ timeout: 10000 })
    // De-duplicated gaps
    await expect(page.getByText("ML experience")).toBeVisible()
    await expect(page.getByText("Management experience")).toBeVisible()
  })
})
