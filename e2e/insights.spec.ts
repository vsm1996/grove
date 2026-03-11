import { test, expect, mockSupabase } from "./fixtures"

test.describe("Insights page", () => {
  test("shows empty state when no opportunities", async ({ page }) => {
    await mockSupabase(page, { opportunities: [] })
    await page.goto("/insights")
    await expect(page.getByText("No opportunities tracked yet.")).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole("link", { name: /add your first one/i })).toBeVisible()
  })

  test("shows pipeline health stats when data exists", async ({ page }) => {
    await mockSupabase(page)
    // Navigate to dashboard first to load opportunities into the Zustand store
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })

    // Then navigate to insights
    await page.getByRole("link", { name: "Insights" }).click()
    await page.waitForURL("**/insights")

    await expect(page.getByText("Pipeline Health")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("Energy Analysis")).toBeVisible()
  })

  test("dashboard link navigates back", async ({ page }) => {
    await mockSupabase(page, { opportunities: [] })
    await page.goto("/insights")
    await expect(page.getByRole("link", { name: "← Dashboard" })).toBeVisible({ timeout: 15000 })
    await page.getByRole("link", { name: "← Dashboard" }).click()
    await page.waitForURL("**/dashboard")
  })

  test("page heading is visible", async ({ page }) => {
    await mockSupabase(page, { opportunities: [] })
    await page.goto("/insights")
    await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible({ timeout: 15000 })
  })
})
