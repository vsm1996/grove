import { test, expect, mockSupabase } from "./fixtures"

test.describe("Navigation flows", () => {
  test("dashboard → new opportunity → back to dashboard", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })

    // Click FAB
    await page.getByTitle("Add opportunity").click()
    await page.waitForURL("**/opportunities/new")
    await expect(page.getByRole("heading", { name: "New opportunity" })).toBeVisible()

    // Back
    await page.getByRole("link", { name: "← Back" }).click()
    await page.waitForURL("**/dashboard")
  })

  test("dashboard → insights → back to dashboard", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })

    await page.getByRole("link", { name: "Insights" }).click()
    await page.waitForURL("**/insights")

    await page.getByRole("link", { name: "← Dashboard" }).click()
    await page.waitForURL("**/dashboard")
  })

  test("dashboard → opportunity detail → back to dashboard", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })

    // Click on an opportunity card link
    await page.locator("a[href*='/opportunities/']").first().click()
    await page.waitForURL("**/opportunities/**")

    // Back
    await page.getByRole("link", { name: "← Back" }).click()
    await page.waitForURL("**/dashboard")
  })

  test("capacity controls panel opens and closes", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })

    // Open capacity controls — the button is in the fixed bottom-right area
    await page.locator(".fixed.bottom-4").getByRole("button", { name: /capacity/i }).click()
    await expect(page.getByText("Capacity Controls")).toBeVisible()
    await expect(page.getByText("Quick Presets")).toBeVisible()

    // Close
    await page.getByRole("button", { name: "Close capacity controls" }).click()
    await expect(page.getByText("Capacity Controls")).not.toBeVisible()
  })
})
