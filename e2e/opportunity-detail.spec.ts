import { test, expect, mockSupabase } from "./fixtures"

test.describe("Opportunity Detail", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  test("renders opportunity header with company and role", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.locator("h1", { hasText: "Acme Corp" })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Senior Engineer").first()).toBeVisible()
  })

  test("renders score breakdown section", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Score breakdown")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("8/10")).toBeVisible()
    await expect(page.getByText("Expansive").first()).toBeVisible()
    await expect(page.getByText("Warm Network")).toBeVisible()
  })

  test("renders positioning section", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Positioning")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Design systems")).toBeVisible()
    await expect(page.getByText("Case study")).toBeVisible()
    await expect(page.getByText("ML experience")).toBeVisible()
  })

  test("renders application context", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Application context")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("IC-focused v3")).toBeVisible()
    await expect(page.getByText("Looking for senior IC")).toBeVisible()
  })

  test("renders follow-up section with checkbox", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Follow-up")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Send thank you email")).toBeVisible()
  })

  test("renders reflections section with add button", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByRole("heading", { name: "Reflections" })).toBeVisible({ timeout: 15000 })
    await expect(page.locator("button", { hasText: "Add" })).toBeVisible()
  })

  test("opens reflection form when add button clicked", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByRole("heading", { name: "Reflections" })).toBeVisible({ timeout: 15000 })
    await page.locator("button", { hasText: "Add" }).click()

    await expect(page.getByText("How did it feel?")).toBeVisible()
    await expect(page.locator("button", { hasText: "Expanded" })).toBeVisible()
    await expect(page.locator("button", { hasText: "Drained" })).toBeVisible()
  })

  test("submits a reflection", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByRole("heading", { name: "Reflections" })).toBeVisible({ timeout: 15000 })
    await page.locator("button", { hasText: "Add" }).click()

    // Select sentiment
    await page.locator("button", { hasText: "Expanded" }).click()
    // Submit
    await page.locator("button", { hasText: "Save reflection" }).click()

    // Form should close (add button should reappear)
    await expect(page.locator("button", { hasText: "Add" })).toBeVisible({ timeout: 5000 })
  })

  test("renders danger zone with delete button", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Danger zone")).toBeVisible({ timeout: 15000 })
    await expect(page.locator("button", { hasText: "Delete opportunity" })).toBeVisible()
  })

  test("delete redirects to dashboard", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Danger zone")).toBeVisible({ timeout: 15000 })
    await page.locator("button", { hasText: "Delete opportunity" }).click()
    await page.waitForURL("**/dashboard", { timeout: 10000 })
  })

  test("back button links to dashboard", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByRole("link", { name: "← Back" })).toBeVisible({ timeout: 15000 })
  })

  test("status badge is visible", async ({ page }) => {
    await page.goto("/opportunities/opp-e2e-1")
    await expect(page.getByText("Applied", { exact: true }).first()).toBeVisible({ timeout: 15000 })
  })
})
