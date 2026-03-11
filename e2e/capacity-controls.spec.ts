import { test, expect, mockSupabase } from "./fixtures"

test.describe("Capacity Controls", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/dashboard")
    await expect(page.getByText("Acme Corp")).toBeVisible({ timeout: 15000 })
  })

  test("shows mode badge when panel is closed", async ({ page }) => {
    const controlArea = page.locator(".fixed.bottom-4.right-4")
    await expect(controlArea.locator(".badge").first()).toBeVisible()
  })

  test("opens panel and shows all controls", async ({ page }) => {
    await page.locator(".fixed.bottom-4").getByRole("button", { name: /capacity/i }).click()
    await expect(page.getByText("Capacity Controls")).toBeVisible()

    await expect(page.getByText("Cognitive Capacity")).toBeVisible()
    await expect(page.getByText("Temporal Capacity")).toBeVisible()
    await expect(page.getByText("Emotional Capacity")).toBeVisible()
    await expect(page.getByText("Emotional Valence")).toBeVisible()
    await expect(page.getByText("Arousal")).toBeVisible()
  })

  test("shows derived fields section", async ({ page }) => {
    await page.locator(".fixed.bottom-4").getByRole("button", { name: /capacity/i }).click()
    await expect(page.getByText("Derived Fields")).toBeVisible()
  })

  test("shows interface mode breakdown", async ({ page }) => {
    await page.locator(".fixed.bottom-4").getByRole("button", { name: /capacity/i }).click()
    await expect(page.getByText("Interface Mode")).toBeVisible()
    await expect(page.getByText("Density:")).toBeVisible()
    await expect(page.getByText("Motion:")).toBeVisible()
    await expect(page.getByText("Contrast:")).toBeVisible()
  })

  test("preset selector has all options", async ({ page }) => {
    await page.locator(".fixed.bottom-4").getByRole("button", { name: /capacity/i }).click()
    // The select element contains the preset options — check it exists
    const presetSelect = page.locator("select").filter({ hasText: /select a preset/i })
    await expect(presetSelect).toBeVisible()
    // Verify options exist in the select (options aren't "visible" in DOM sense)
    await expect(presetSelect.locator("option")).toHaveCount(8) // 1 disabled + 7 presets
  })

  test("reset button is available", async ({ page }) => {
    await page.locator(".fixed.bottom-4").getByRole("button", { name: /capacity/i }).click()
    await expect(page.getByRole("button", { name: "Reset" })).toBeVisible()
  })

  test("feedback toggles are available", async ({ page }) => {
    await page.locator(".fixed.bottom-4").getByRole("button", { name: /capacity/i }).click()
    await expect(page.getByRole("button", { name: /haptic/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /sonic/i })).toBeVisible()
  })
})
