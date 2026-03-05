# Grove — Claude Code Agent Prompt

You are building **Grove**, a career intelligence system built on top of **Harmonia UI** — a capacity-adaptive interface framework. This document is your complete source of truth. Read it fully before writing any code.

---

## What Grove Is

Grove is not a job tracker. It is a career intelligence system that:
1. Scores opportunities across four dimensions (Alignment, Energy, Signal, Positioning)
2. Adapts the interface to the user's current cognitive and emotional capacity via Harmonia
3. Surfaces insights and patterns from the user's pipeline over time
4. Protects the user's nervous system — only showing what they can handle right now

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict) |
| Auth + DB | Supabase |
| UI Primitives | Tailwind CSS + DaisyUI |
| Client State | Zustand |
| Adaptive Layer | Harmonia UI (`/src/lib/capacity`) |
| Package Manager | npm |

---

## What's Already Built

These files exist and must NOT be rewritten — only imported and used:

| File | What It Contains |
|---|---|
| `src/types/grove.ts` | Complete TypeScript type system |
| `src/store/grove.ts` | Zustand store with scoring + insights |
| `src/lib/grove/db.ts` | Supabase CRUD + auth helpers |
| `src/lib/grove/scoring.ts` | Scoring utilities + Harmonia bridge functions |
| `supabase/schema.sql` | Database schema (already run in Supabase) |

---

## Harmonia — The Adaptive Layer

Harmonia is copied into `/src/lib/capacity`. It is the engine that makes Grove's UI adapt to the user's state.

### Key Hooks (use these in every page and card component)

```typescript
import { useDerivedMode, deriveModeLabel } from "@/lib/capacity"
import { usePredictedCapacity } from "@/lib/capacity/prediction/hooks"
import { useFeedback } from "@/lib/capacity"
import { useCapacityContext } from "@/lib/capacity"
```

### `useDerivedMode()` — Primary Hook
```typescript
const { field, mode } = useDerivedMode()
// mode.density: "low" | "medium" | "high"
// mode.motion: "off" | "soothing" | "subtle" | "expressive"
// mode.focus: "default" | "gentle" | "guided"
// mode.contrast: "standard" | "boosted"
// mode.pace: "calm" | "neutral" | "activated"
```

### `deriveModeLabel(field)` — Dashboard Filter
```typescript
const label = deriveModeLabel(field)
// "Minimal" | "Calm" | "Focused" | "Exploratory"
```

Pass this label to `categoriesForMode(label)` from `src/lib/grove/scoring.ts` to determine which opportunity categories to show.

### `usePredictedCapacity()` — Anticipatory UX
```typescript
const predicted = usePredictedCapacity() // CapacityField | null
// Use this to preload the minimal view before the user hits low capacity
```

### `useFeedback()` — Multimodal Feedback
```typescript
const { fire } = useFeedback()
fire("tap")    // On save, confirm, status change
fire("toggle") // On expand/collapse
fire("error")  // On form validation error
```

### Animation Utilities
```typescript
import {
  entranceClass,
  hoverClass,
  ambientClass,
  listItemClass,
  focusBeaconClass,
  focusTextClass,
} from "@/lib/capacity/animation"

// Example:
const cardAnim = entranceClass(mode.motion, "morph", hasPlayed)
const hover = hoverClass(mode.motion)
const beacon = focusBeaconClass(mode.focus)
```

---

## Harmonia Adaptive Rules

These are the rules for how Grove adapts. Follow them exactly.

### Dashboard Category Filtering
```
Minimal mode     → show "pursue" only, further filter to warm leads (referral/warm signal)
Calm mode        → show "pursue" + "worth_it"
Focused mode     → show all four categories
Exploratory mode → show all four categories + inline insights
```
Use `categoriesForMode(modeLabel)` from `src/lib/grove/scoring.ts`.

### Card Density
```
density: "low"    → show: status, composite score only
density: "medium" → show: status, energy, signal, score
density: "high"   → show: status, energy, signal, score, follow-up, positioning gap
```
Use `cardFieldsForDensity(mode.density)` from `src/lib/grove/scoring.ts`.

### Card Animation
```typescript
// Always gate animations through Harmonia — never hardcode CSS animation classes
const entranceAnim = entranceClass(mode.motion, "morph", hasPlayed)
const hoverAnim = hoverClass(mode.motion)
```

### Tone (via valence)
```typescript
const { context } = useCapacityContext()
const valence = context.emotionalState.valence
// valence > 0.2  → encouraging, forward-looking copy
// valence < -0.2 → gentle, low-pressure copy
// else           → neutral, matter-of-fact copy
```

### Focus Beacons
```typescript
// Apply to CTA buttons and priority cards
const beacon = focusBeaconClass(mode.focus)
// "guided" → strong warm glow (user needs direction)
// "gentle" → soft cool glow
// "default" → no beacon
```

---

## Project Structure

```
grove/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout — CapacityProvider + auth guard
│   │   ├── page.tsx                    # Auth page (login/signup)
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Capacity-adaptive pipeline
│   │   ├── opportunities/
│   │   │   ├── new/
│   │   │   │   └── page.tsx            # Add opportunity form
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Detail + scoring + reflection
│   │   └── insights/
│   │       └── page.tsx                # Patterns + gap analysis
│   │
│   ├── lib/
│   │   ├── capacity/                   # Harmonia — DO NOT MODIFY
│   │   └── grove/
│   │       ├── db.ts                   # Already built — Supabase CRUD
│   │       └── scoring.ts              # Already built — scoring utilities
│   │
│   ├── components/
│   │   ├── grove/
│   │   │   ├── OpportunityCard.tsx     # Adaptive card — primary component
│   │   │   ├── DashboardSection.tsx    # Category section wrapper
│   │   │   ├── OpportunityForm.tsx     # Add/edit form
│   │   │   ├── ScoreInputs.tsx         # Alignment slider + energy/signal selectors
│   │   │   ├── ReflectionForm.tsx      # Post-interview reflection
│   │   │   ├── InsightCard.tsx         # Single insight pattern card
│   │   │   └── StatusBadge.tsx         # Status pill component
│   │   └── ui/
│   │       ├── CapacityGate.tsx        # Show/hide based on mode
│   │       └── AdaptiveText.tsx        # Renders different copy per valence
│   │
│   ├── store/
│   │   └── grove.ts                    # Already built — Zustand store
│   │
│   └── types/
│       └── grove.ts                    # Already built — all types
│
└── supabase/
    └── schema.sql                      # Already run — do not re-run
```

---

## Build Order

Build in this exact sequence. Each step depends on the previous.

### Step 1 — Project Setup
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
# Say NO to src directory — we're using src/ manually
# Actually use: npx create-next-app@latest grove --typescript --tailwind --app
```

Install dependencies:
```bash
npm install @supabase/supabase-js zustand daisyui
```

Configure DaisyUI in `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["dark"],
    darkTheme: "dark",
  },
}
export default config
```

### Step 2 — Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<from Supabase dashboard>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
```

### Step 3 — Copy Files
Copy all pre-built files into the project:
- `src/types/grove.ts`
- `src/store/grove.ts`
- `src/lib/grove/db.ts`
- `src/lib/grove/scoring.ts`

Copy Harmonia from the harmonia-ui repo. The two repos must be sibling directories:

```
# Expected directory structure — both repos sit side by side
~/your-projects-folder/
├── harmonia-ui/            ← existing Harmonia repo
│   └── src/
│       └── lib/
│           └── capacity/   ← copy FROM here
└── grove/                  ← this repo (you are here)
    └── src/
        └── lib/
            └── capacity/   ← copy TO here
```

From inside the grove root directory:
```bash
cp -r ../harmonia-ui/src/lib/capacity ./src/lib/capacity
```

If harmonia-ui lives somewhere other than a sibling directory, use its full path:
```bash
# Example if it's in ~/code/ instead
cp -r ~/code/harmonia-ui/src/lib/capacity ./src/lib/capacity
```

**Verify the copy succeeded before continuing** — this file must exist:
```
src/lib/capacity/index.ts
```
If it doesn't exist, the path was wrong. Do not proceed to Step 4 until confirmed.

### Step 4 — Root Layout
`src/app/layout.tsx`:
- Wrap with `<CapacityProvider>` from `@/lib/capacity`
- Add auth guard: redirect unauthenticated users to `/`
- Import Harmonia's `globals.css` for animation classes
- Add `<CapacityControls />` fixed to bottom-right

```typescript
import { CapacityProvider } from "@/lib/capacity"
import { CapacityControls } from "@/components/capacity-controls" // from Harmonia
```

### Step 5 — Auth Page (`/`)
- Email + password login and signup
- On success → redirect to `/dashboard`
- Use `signIn` and `signUp` from `@/lib/grove/db`
- DaisyUI form components
- Simple, clean — this isn't the showcase, dashboard is

### Step 6 — OpportunityCard Component
This is the most important component. Build it before the dashboard.

```typescript
// src/components/grove/OpportunityCard.tsx
import { useDerivedMode, deriveModeLabel, entranceClass, hoverClass, focusBeaconClass } from "@/lib/capacity"
import { cardFieldsForDensity, CATEGORY_COLORS, energyBadgeColor, signalBadgeColor, alignmentLabel, scoreColor } from "@/lib/grove/scoring"
import { useFeedback } from "@/lib/capacity"
```

The card must:
- Call `useDerivedMode()` internally
- Use `cardFieldsForDensity(mode.density)` to decide which fields render
- Apply `entranceClass`, `hoverClass`, `focusBeaconClass` from Harmonia
- Fire `fire("tap")` on status change and primary CTA
- Adapt copy tone based on `context.emotionalState.valence`
- Show composite score as a progress bar
- Show category badge with `CATEGORY_COLORS`

### Step 7 — Dashboard (`/dashboard`)
```typescript
import { useDerivedMode, deriveModeLabel } from "@/lib/capacity"
import { categoriesForMode, isWarmLead } from "@/lib/grove/scoring"
import { useGroveStore } from "@/store/grove"
```

Dashboard sections:
1. **Top bar**: Mode label badge + auto/manual toggle (`isAutoMode`, `toggleAutoMode`)
2. **Category sections**: Filtered by `categoriesForMode(modeLabel)`
3. **Minimal mode**: Additional filter via `isWarmLead()` — only warm leads
4. **Exploratory mode**: Inline insight summary from `useGroveStore().insights`
5. **Empty states**: Adaptive copy based on current mode
6. **FAB**: Add opportunity button — always visible, `focusBeaconClass` applied

Load opportunities on mount:
```typescript
useEffect(() => {
  fetchOpportunities().then(store.setOpportunities)
}, [])
```

### Step 8 — OpportunityForm (`/opportunities/new`)
Grouped into logical sections — never feel like a survey:

**Section 1 — The Role**
- Company name (text input)
- Role title (text input)
- Job posting URL (text input, optional)
- Status (DaisyUI select: saved/applied/interviewing/offer/rejected)

**Section 2 — Alignment** (how well does this fit?)
- Score: 0–10 range slider + label (`alignmentLabel(score)`)
- Notes: textarea (optional)

**Section 3 — Energy** (how does this feel?)
- Type: card selector — Expansive / Neutral / Extractive with descriptions
- Intensity: 0–10 slider (only shows if type is selected)

**Section 4 — Signal** (how did you find this?)
- Type: card selector — Referral / Warm / Recruiter / Cold with descriptions
- Notes: text input (optional, e.g. "Referred by Jamie at Vercel")

**Section 5 — Positioning** (what's the gap?)
- Narrative angle: text input (optional)
- Proof artifact needed: text input (optional)
- Skill gap: text input (optional)

**Section 6 — Context** (the practical stuff)
- Resume version: text input (optional)
- JD notes: textarea (optional)

**Section 7 — Follow-Up** (what's next?)
- Next action: text input (optional)
- Due date: date input (optional)

On submit:
```typescript
const opportunity = await createOpportunity(formData)
store.addOpportunity(opportunity)
fire("tap")
router.push(`/opportunities/${opportunity.id}`)
```

### Step 9 — Opportunity Detail (`/opportunities/[id]`)
Sections:
1. **Header**: Company, role, status badge, composite score
2. **Score breakdown**: All four dimensions displayed visually
3. **Application context**: Resume version, JD notes
4. **Reflections**: List of past reflections + "Add Reflection" button
5. **Follow-up**: Next action + due date + complete toggle
6. **Danger zone**: Delete opportunity

Reflection form (inline or modal):
- Sentiment: Expanded / Neutral / Drained (card selector)
- They listened: toggle
- Meaningful challenge: toggle
- Respectful engagement: toggle
- Notes: textarea

### Step 10 — Insights (`/insights`)
Data from `useGroveStore().insights`:

**Section 1 — Pipeline Health**
- Total opportunities donut: by status
- Category breakdown: pursue / worth_it / mercenary / experimental
- Avg alignment score

**Section 2 — Patterns**
- Map `insights.patterns` → `<InsightCard>` components
- Color by severity: info / warning / critical

**Section 3 — Positioning Gaps**
- List `insights.topPositioningGaps`
- "You keep applying to roles where X is missing"

**Section 4 — Energy Analysis**
- Dominant energy type
- Count of expansive vs extractive
- Recommendation based on ratio

---

## DaisyUI Component Reference

Use these DaisyUI classes throughout:

```
Buttons:     btn btn-primary, btn-secondary, btn-ghost, btn-sm
Cards:       card card-body card-compact
Badges:      badge badge-success, badge-warning, badge-error, badge-neutral, badge-info
Inputs:      input input-bordered, textarea textarea-bordered, select select-bordered
Range:       range range-primary
Progress:    progress progress-primary
Modal:       modal modal-open, modal-box
Loading:     loading loading-spinner
Alert:       alert alert-warning, alert-error
Tabs:        tabs tabs-boxed, tab tab-active
Stats:       stats shadow, stat, stat-title, stat-value, stat-desc
```

---

## Supabase Auth Pattern

Use this pattern for auth state in the root layout:

```typescript
"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/grove/db"

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="loading loading-spinner" />
  return children
}
```

---

## Scoring Logic Reference

### Composite Score Formula
```
compositeScore = (alignmentNorm × 0.5) + (signalNorm × 0.3) + (energyNorm × 0.2) × 100

Signal weights:  referral=1.0, warm=0.75, recruiter=0.5, cold=0.25
Energy weights:  expansive=1.0, neutral=0.5, extractive=0.0
```

### Category Derivation
```
pursue      → alignment >= 7 AND (referral OR warm signal)
worth_it    → alignment >= 7 AND NOT extractive
mercenary   → alignment < 7 AND (referral OR warm signal)
experimental → everything else
```

Both are computed automatically by the Zustand store on every mutation — never compute manually in components.

---

## Critical Rules

1. **Never hardcode animation class names** — always use Harmonia's animation utilities
2. **Never bypass the store** — all mutations go through `useGroveStore()` actions
3. **Never render all opportunities at once** — always filter through `categoriesForMode()`
4. **Never modify `/src/lib/capacity/`** — Harmonia is read-only
5. **Always fire haptic feedback** on user-initiated actions (save, status change, delete confirm)
6. **Always handle loading and error states** — the store has `isLoading` and `error`
7. **RLS is on** — Supabase will silently return empty arrays if auth is broken. Check session first.
8. **Valence drives tone** — read `context.emotionalState.valence` for copy decisions, not just mode label

---

## Aesthetic Direction

Grove's visual identity: **refined intelligence**. Not a spreadsheet. Not a kanban board. A system that feels like it actually understands the job search process.

- Dark theme (DaisyUI `dark`)
- Data-dense but never cluttered — Harmonia handles the density dial
- Category colors signal meaning: green=pursue, blue=worth_it, yellow=mercenary, neutral=experimental
- Composite score displayed as a progress bar, not just a number
- Empty states are human — copy adapts to capacity mode
- Transitions are earned — Harmonia controls whether animation fires at all

---

## Common Mistakes to Avoid

- Don't use `useCapacityContext()` for rendering decisions — use `useDerivedMode()` instead
- Don't store `mode` in component state — call `useDerivedMode()` directly, it's reactive
- Don't forget to call `aggregator.destroy()` — Harmonia's `CapacityProvider` handles this, don't instantiate `SignalAggregator` manually
- Don't import from deep Harmonia internals — only import from `@/lib/capacity` (the barrel export) and `@/lib/capacity/prediction/hooks` for `usePredictedCapacity`
- Don't run `schema.sql` again — it's already applied

---

## Reference Links

- Harmonia API: `harmonia-ui/API.md` (in the harmonia-ui repo)
- Harmonia Architecture: `harmonia-ui/ARCHITECTURE.md`
- Supabase JS Docs: https://supabase.com/docs/reference/javascript
- DaisyUI Components: https://daisyui.com/components/
- Zustand Docs: https://zustand.docs.pmnd.rs
- Next.js App Router: https://nextjs.org/docs/app
