import { test as base, type Page } from "@playwright/test"

/**
 * Fake Supabase row data used across e2e tests.
 * snake_case to match what the real Supabase REST API returns.
 */
export const FAKE_USER = {
  id: "e2e-user-1",
  email: "test@grove.dev",
}

export const FAKE_SESSION = {
  access_token: "fake-access-token",
  refresh_token: "fake-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: FAKE_USER.id,
    email: FAKE_USER.email,
    aud: "authenticated",
    role: "authenticated",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    app_metadata: { provider: "email" },
    user_metadata: {},
    identities: [],
  },
}

/**
 * The cookie name used by @supabase/ssr to store the auth session.
 * Format: sb-{project-ref}-auth-token
 * Project ref is the hostname prefix from NEXT_PUBLIC_SUPABASE_URL.
 */
const SUPABASE_COOKIE_NAME = "sb-hteqergwrzqikiipletz-auth-token"

export function makeOpportunityRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "opp-e2e-1",
    user_id: FAKE_USER.id,
    company: "Acme Corp",
    role: "Senior Engineer",
    url: "https://acme.com/jobs/123",
    status: "applied",
    alignment_score: 8,
    alignment_notes: "Great culture fit",
    energy_type: "expansive",
    energy_intensity: 7,
    signal_type: "warm",
    signal_notes: "Met at conference",
    narrative_angle: "Design systems",
    proof_artifact: "Case study",
    skill_gap: "ML experience",
    resume_version: "IC-focused v3",
    jd_notes: "Looking for senior IC",
    followup_action: "Send thank you email",
    followup_due_date: "2024-02-01",
    followup_completed: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    reflections: [],
    ...overrides,
  }
}

export const FAKE_OPP_ROW = makeOpportunityRow()

export const FAKE_OPP_ROW_2 = makeOpportunityRow({
  id: "opp-e2e-2",
  company: "Beta Inc",
  role: "Staff Designer",
  status: "interviewing",
  alignment_score: 5,
  energy_type: "neutral",
  energy_intensity: 5,
  signal_type: "cold",
  signal_notes: null,
  narrative_angle: null,
  proof_artifact: null,
  skill_gap: null,
  resume_version: null,
  jd_notes: null,
  followup_action: null,
  followup_due_date: null,
  followup_completed: false,
  url: null,
})

/**
 * Seeds the Supabase auth cookie so the AuthGuard sees a valid session.
 * Must be called BEFORE navigating to any protected page.
 */
async function seedAuthCookie(page: Page) {
  await page.context().addCookies([
    {
      name: SUPABASE_COOKIE_NAME,
      value: JSON.stringify(FAKE_SESSION),
      domain: "localhost",
      path: "/",
    },
  ])
}

/**
 * Intercepts all Supabase REST + auth calls on the page.
 * Call this in beforeEach for any test that needs a logged-in user.
 */
export async function mockSupabase(
  page: Page,
  opts: {
    opportunities?: Record<string, unknown>[]
    authenticated?: boolean
  } = {}
) {
  const { opportunities = [FAKE_OPP_ROW, FAKE_OPP_ROW_2], authenticated = true } = opts

  // Seed auth cookie so @supabase/ssr's getSession() returns a session
  if (authenticated) {
    await seedAuthCookie(page)
  }

  // ── Auth endpoints ──────────────────────────

  // Token refresh
  await page.route("**/auth/v1/token*", async (route) => {
    if (authenticated) {
      await route.fulfill({ json: FAKE_SESSION })
    } else {
      await route.fulfill({ status: 401, json: { error: "not_authenticated" } })
    }
  })

  // getUser
  await page.route("**/auth/v1/user*", async (route) => {
    if (authenticated) {
      await route.fulfill({ json: FAKE_SESSION.user })
    } else {
      await route.fulfill({ status: 401, json: { error: "not_authenticated" } })
    }
  })

  // signUp
  await page.route("**/auth/v1/signup", async (route) => {
    await route.fulfill({
      json: { ...FAKE_SESSION, user: { ...FAKE_SESSION.user, email_confirmed_at: null } },
    })
  })

  // signOut
  await page.route("**/auth/v1/logout", async (route) => {
    await route.fulfill({ json: {} })
  })

  // ── REST endpoints (opportunities + reflections) ──

  await page.route("**/rest/v1/opportunities*", async (route) => {
    const method = route.request().method()
    const url = route.request().url()

    if (method === "GET") {
      if (url.includes("id=eq.")) {
        const idMatch = url.match(/id=eq\.([^&]+)/)
        const id = idMatch?.[1]
        const opp = opportunities.find((o) => o.id === id) ?? opportunities[0]
        await route.fulfill({ json: opp })
      } else {
        await route.fulfill({ json: opportunities })
      }
    } else if (method === "POST") {
      const body = route.request().postDataJSON()
      const newRow = makeOpportunityRow({
        ...body,
        id: "opp-new-" + Date.now(),
        reflections: [],
      })
      await route.fulfill({ json: newRow })
    } else if (method === "PATCH") {
      const body = route.request().postDataJSON()
      const idMatch = url.match(/id=eq\.([^&]+)/)
      const id = idMatch?.[1]
      const base = opportunities.find((o) => o.id === id) ?? opportunities[0]
      await route.fulfill({ json: { ...base, ...body } })
    } else if (method === "DELETE") {
      await route.fulfill({ json: {} })
    } else {
      await route.continue()
    }
  })

  // Reflections
  await page.route("**/rest/v1/reflections*", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON()
      await route.fulfill({
        json: {
          id: "ref-new-1",
          ...body,
          reflected_at: new Date().toISOString(),
        },
      })
    } else {
      await route.fulfill({ json: [] })
    }
  })
}

export const test = base
export { expect } from "@playwright/test"
