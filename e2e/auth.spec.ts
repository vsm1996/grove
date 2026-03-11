import { test, expect, mockSupabase, FAKE_SESSION } from "./fixtures"

test.describe("Auth page", () => {
  test("renders login form by default", async ({ page }) => {
    await mockSupabase(page, { authenticated: false })
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Grove" })).toBeVisible()
    await expect(page.getByText("Career intelligence, capacity-first")).toBeVisible()
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible()
    await expect(page.getByPlaceholder("••••••••")).toBeVisible()
    // "Sign in" appears as both a tab and a submit button — check submit button
    await expect(page.locator("button[type='submit']")).toBeVisible()
  })

  test("switches between login and signup tabs", async ({ page }) => {
    await mockSupabase(page, { authenticated: false })
    await page.goto("/")

    // Click sign up tab (the tab, not the form submit)
    await page.locator(".tabs").getByRole("button", { name: "Sign up" }).click()
    await expect(page.locator("button[type='submit']")).toHaveText("Create account")

    // Click sign in tab
    await page.locator(".tabs").getByRole("button", { name: "Sign in" }).click()
    await expect(page.locator("button[type='submit']")).toHaveText("Sign in")
  })

  test("shows Google sign-in button", async ({ page }) => {
    await mockSupabase(page, { authenticated: false })
    await page.goto("/")
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible()
  })

  test("login redirects to dashboard on success", async ({ page }) => {
    // Start unauthenticated on the auth page
    await mockSupabase(page, { authenticated: false })
    await page.goto("/")

    // After sign-in, the Supabase client sets the session cookie.
    // We simulate this by seeding the cookie when the token request fires.
    await page.route("**/auth/v1/token?grant_type=password", async (route) => {
      // Seed the session cookie so the dashboard auth guard passes
      await page.context().addCookies([
        {
          name: "sb-hteqergwrzqikiipletz-auth-token",
          value: JSON.stringify(FAKE_SESSION),
          domain: "localhost",
          path: "/",
        },
      ])
      await route.fulfill({ json: FAKE_SESSION })
    })

    await page.getByPlaceholder("you@example.com").fill("test@grove.dev")
    await page.getByPlaceholder("••••••••").fill("password123")
    await page.locator("button[type='submit']").click()

    await page.waitForURL("**/dashboard", { timeout: 10000 })
  })

  test("signup shows confirmation message", async ({ page }) => {
    await mockSupabase(page, { authenticated: false })
    await page.goto("/")

    await page.locator(".tabs").getByRole("button", { name: "Sign up" }).click()
    await page.getByPlaceholder("you@example.com").fill("new@grove.dev")
    await page.getByPlaceholder("••••••••").fill("password123")
    await page.locator("button[type='submit']").click()

    await expect(page.getByText("Check your email to confirm your account.")).toBeVisible({
      timeout: 10000,
    })
  })
})
