# Grove — Project Foundation

Career intelligence system built on Harmonia UI.

## Stack

- **Framework**: Next.js 15 App Router
- **Auth + DB**: Supabase
- **UI**: Tailwind + DaisyUI
- **State**: Zustand
- **Adaptive Layer**: Harmonia `/lib/capacity`

---

## What's Built

### `/src/types/grove.ts`
Complete TypeScript type system:
- `Opportunity` — core data model with all fields
- `ScoredOpportunity` — computed composite score + category
- `AlignmentScore`, `EnergyScore`, `SignalScore`, `PositioningGap`
- `InterviewReflection`, `FollowUp`
- `GroveInsights` — derived analytics

### `/supabase/schema.sql`
Production-ready schema:
- `opportunities` table with all scoring dimensions
- `reflections` table (one-to-many per opportunity)
- Row Level Security — users only see their own data
- Auto-updated `updated_at` trigger
- Indexed for performance

### `/src/store/grove.ts`
Zustand store with:
- Live scoring on every mutation (composite score, category)
- Auto-derived insights (patterns, gaps, averages)
- Selectors: `getByCategory`, `getByStatus`, `getWarmLeads`

### `/src/lib/grove/db.ts`
Supabase data layer:
- Full CRUD for opportunities
- Reflection creation
- Auth helpers (signUp, signIn, signOut, getSession)
- snake_case ↔ camelCase mapping

### `/src/lib/grove/scoring.ts`
Pure scoring utilities:
- Label maps for all enum types
- `categoriesForMode()` — Harmonia mode → which categories to show
- `cardFieldsForDensity()` — density token → which fields to render
- Badge colors, score colors, alignment labels

---

## Next Build Order

1. **`/app/layout.tsx`** — Root layout with `CapacityProvider` + auth guard
2. **`/app/page.tsx`** — Auth page (login/signup)
3. **`/app/dashboard/page.tsx`** — Capacity-adaptive pipeline view
4. **`/components/grove/OpportunityCard`** — Adaptive card using `useDerivedMode()`
5. **`/app/opportunities/new/page.tsx`** — Add opportunity form
6. **`/app/opportunities/[id]/page.tsx`** — Detail + reflection
7. **`/app/insights/page.tsx`** — Patterns + gap analysis

---

## Setup Instructions

### 1. Create Next.js app
```bash
npx create-next-app@latest grove --typescript --tailwind --app
cd grove
```

### 2. Install dependencies
```bash
npm install @supabase/supabase-js zustand daisyui
npm install -D @types/node
```

### 3. Configure DaisyUI
In `tailwind.config.ts`:
```ts
plugins: [require("daisyui")],
daisyui: { themes: ["dark"] }
```

### 4. Copy Harmonia
```bash
cp -r ../harmonia-ui/lib/capacity ./src/lib/capacity
```

### 5. Environment variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 6. Run Supabase schema
Paste `supabase/schema.sql` into your Supabase SQL editor and run.

---

## Harmonia Integration Points

| Harmonia Hook | Grove Usage |
|---|---|
| `useDerivedMode()` | Every card and dashboard section |
| `deriveModeLabel()` | `categoriesForMode()` — filter pipeline |
| `usePredictedCapacity()` | Preload minimal view before user hits low capacity |
| `useFeedback().fire()` | Haptic on opportunity save, status change |
| `CapacityProvider` | Root layout wrapper |
| `CapacityControls` | Fixed panel on dashboard |
