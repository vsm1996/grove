import { test, expect, mockSupabase } from "./fixtures"

test.describe("New Opportunity Form", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  test("renders all form sections", async ({ page }) => {
    await page.goto("/opportunities/new")
    await expect(page.locator("h3", { hasText: "The Role" })).toBeVisible({ timeout: 15000 })
    await expect(page.locator("h3", { hasText: "Alignment" })).toBeVisible()
    await expect(page.locator("h3", { hasText: "Energy" })).toBeVisible()
    await expect(page.locator("h3", { hasText: "Signal" })).toBeVisible()
    await expect(page.locator("h3", { hasText: "Positioning" })).toBeVisible()
    await expect(page.locator("h3", { hasText: "Context" })).toBeVisible()
    await expect(page.locator("h3", { hasText: "Follow-Up" })).toBeVisible()
  })

  test("submit button is disabled when required fields are empty", async ({ page }) => {
    await page.goto("/opportunities/new")
    await expect(page.locator("h3", { hasText: "The Role" })).toBeVisible({ timeout: 15000 })
    await expect(page.locator("button[type='submit']")).toBeDisabled()
  })

  test("submit button enables when all required fields are filled", async ({ page }) => {
    await page.goto("/opportunities/new")
    await expect(page.locator("h3", { hasText: "The Role" })).toBeVisible({ timeout: 15000 })

    // Fill required fields
    await page.getByPlaceholder("Acme Corp").fill("TestCo")
    await page.getByPlaceholder("Senior Product Designer").fill("Engineer")

    // Click energy type button — use the button containing the text
    await page.locator("button", { hasText: "Expansive" }).first().click()
    // Click signal type button
    await page.locator("button", { hasText: "Referral" }).first().click()

    await expect(page.locator("button[type='submit']")).toBeEnabled()
  })

  test("back button navigates to dashboard", async ({ page }) => {
    await page.goto("/opportunities/new")
    await expect(page.getByRole("heading", { name: "New opportunity" })).toBeVisible({ timeout: 15000 })
    await page.getByRole("link", { name: "← Back" }).click()
    await page.waitForURL("**/dashboard")
  })

  test("alignment slider shows label", async ({ page }) => {
    await page.goto("/opportunities/new")
    await expect(page.locator("h3", { hasText: "The Role" })).toBeVisible({ timeout: 15000 })
    // Default score is 5 → "Solid option"
    await expect(page.getByText("5/10 — Solid option")).toBeVisible()
  })

  test("energy selector shows intensity slider after type selection", async ({ page }) => {
    await page.goto("/opportunities/new")
    await expect(page.locator("h3", { hasText: "The Role" })).toBeVisible({ timeout: 15000 })

    // Intensity label should not be visible yet
    await expect(page.getByText("Intensity")).not.toBeVisible()

    // Click an energy type
    await page.locator("button", { hasText: "Expansive" }).first().click()

    // Intensity should now be visible
    await expect(page.getByText("Intensity")).toBeVisible()
  })

  test("full form submission redirects to opportunity detail", async ({ page }) => {
    await page.goto("/opportunities/new")
    await expect(page.locator("h3", { hasText: "The Role" })).toBeVisible({ timeout: 15000 })

    // Fill required fields
    await page.getByPlaceholder("Acme Corp").fill("NewCo")
    await page.getByPlaceholder("Senior Product Designer").fill("Lead Developer")
    await page.locator("button", { hasText: "Expansive" }).first().click()
    await page.locator("button", { hasText: "Referral" }).first().click()

    // Submit
    await page.locator("button[type='submit']").click()

    // Should navigate to the opportunity detail page
    await page.waitForURL("**/opportunities/**", { timeout: 10000 })
    expect(page.url()).toContain("/opportunities/")
  })
})
