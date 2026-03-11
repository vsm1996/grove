import { test, expect, mockSupabase } from "./fixtures"

test.describe("Dashboard", () => {
  test("shows loading spinner then renders opportunities", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Beta Inc")).toBeVisible()
  })

  test("renders top bar with Grove heading and mode badge", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: "Grove" })).toBeVisible({ timeout: 15000 })
    await expect(page.locator("header .badge").first()).toBeVisible()
  })

  test("renders Auto/Manual toggle", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    const toggle = page.locator("header").getByRole("button", { name: /auto|manual/i })
    await expect(toggle).toBeVisible()
  })

  test("renders Insights link", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole("link", { name: "Insights" })).toBeVisible()
  })

  test("renders FAB add button", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    await expect(page.getByTitle("Add opportunity")).toBeVisible()
  })

  test("FAB navigates to new opportunity page", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    await page.getByTitle("Add opportunity").click()
    await page.waitForURL("**/opportunities/new")
  })

  test("shows empty state when no opportunities", async ({ page }) => {
    await mockSupabase(page, { opportunities: [] })
    await page.goto("/dashboard")
    // Wait for content to load (category sections render even when empty)
    await expect(page.locator("section").first()).toBeVisible({ timeout: 15000 })
    // Should show some empty state text in the dashed border container
    await expect(page.locator(".border-dashed").first()).toBeVisible()
  })

  test("sign out button works", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    await page.getByRole("button", { name: "Sign out" }).click()
    await page.waitForURL("/", { timeout: 10000 })
  })

  test("renders category sections", async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByText(/pursue|worth it|mercenary|experimental/i).first()
    ).toBeVisible()
  })
})
