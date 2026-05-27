# Dashboard (Home) — JIRA Tickets

---

## Parent Ticket

### Title

Dashboard

### Description

Build the **HelpOrbit dashboard home page** — the first screen after login. It introduces the product, shows how the platform works, lists the tech stack, and links to live application modules.

This page enables users to:

- Land on `/dashboard` after login
- See a personalized welcome message
- Read product overview and capabilities
- Navigate to Companies, Users, Policies, Activity logs (admin)
- Understand architecture and tech stack
- Distinguish live vs coming-soon modules

**Dashboard route:**

`/dashboard`

**Depends on:** Project setup, Login page, `MainLayout` (sidebar + header)

The dashboard must support:

- Authenticated access only
- Dynamic greeting using user first name
- Content driven from config (`dashboardContent.ts`) for easy edits
- Admin-only module cards (hide admin modules for non-admin if applicable)
- Responsive card grid layout
- Scrollable content within app shell

**Not in scope for this epic:**

- Analytics widgets with live metrics (nav item “Soon”)
- Settings page (Soon)

**Reference docs:** `docs/PROJECT_GUIDE.md` · `frontend/src/config/dashboardContent.ts`

### Task List

- Dashboard route & page shell
- Page header & welcome message
- About & capabilities content cards
- Tech stack & request flow sections
- Application modules grid with links
- Dashboard styles (`dashboard-*` CSS)
- Dashboard QA & content updates

### Child Tickets (7)

Each child ticket has **Title**, **Description**, and **Tasks**. Full detail in sections below.

---

#### 1. Dashboard Route & Page Shell

**Title:** Dashboard Route & Page Shell

**Description:** Wire the dashboard page into the authenticated app layout.

**Tasks:**

- Create `frontend/src/app/dashboard/page.tsx`
- Use `dashboard/layout.tsx` auth guard (token required)
- Wrap content in `PageShell` with scroll (`overflow-y-auto`)
- Render `DashboardHome` component
- Return `null` until `user` loaded from `AuthContext`
- Match side padding with other modules (`app-main` padding)

---

#### 2. Page Header & Welcome Message

**Title:** Page Header & Welcome Message

**Description:** Set sticky header title and personalized description via page header context.

**Tasks:**

- `usePageHeader` with title `"Dashboard"`
- Description: `Welcome back, {firstName}` from `displayName(user)`
- Breadcrumb: `Dashboard` only
- Update header when user changes
- Use `displayName` / `lib/auth.ts` helper

---

#### 3. About & Capabilities Content Cards

**Title:** About & Capabilities Content Cards

**Description:** Display product story, how it works, and key capabilities in card layout.

**Tasks:**

- Add `APP_ABOUT` content in `config/dashboardContent.ts`
- Full-width “About HelpOrbit” card with tagline, goal, summary
- Two-column row: “How HelpOrbit works” (bulleted steps)
- “Key capabilities” card (bulleted list)
- Icons in card headers (Lucide)
- Use `dashboard-card`, `dashboard-card-row--2` CSS classes

---

#### 4. Tech Stack & Request Flow Sections

**Title:** Tech Stack & Request Flow Sections

**Description:** Show technology tags and high-level architecture flow for developers/stakeholders.

**Tasks:**

- `TECH_STACK` array in `dashboardContent.ts` (Backend, Frontend, Database, Tools)
- Four-column grid on large screens (`dashboard-card-row--4`)
- Tag pills per stack item (`dashboard-tag`)
- `ARCHITECTURE_FLOW` steps in full-width card
- Centered section title “Tech stack”

---

#### 5. Application Modules Grid

**Title:** Application Modules Grid

**Description:** Cards linking to live modules; show “Soon” for disabled features.

**Tasks:**

- `DASHBOARD_MODULES` in `dashboardContent.ts`
- Filter by `adminOnly` and `isAdmin` prop
- Live modules: link with `Open module` + `href`
- Soon modules: disabled card, muted badge
- Three-column grid (`dashboard-card-row--3`)
- Section title “Application modules”
- Icons per module (Companies, Users, Policies, Activity, Analytics, Settings)

---

#### 6. Dashboard Styles

**Title:** Dashboard Styles

**Description:** Unified CSS for dashboard home cards and spacing.

**Tasks:**

- `.dashboard-home`, `.dashboard-card`, `.dashboard-card-row` in `globals.css`
- Responsive breakpoints for 2/3/4 column grids
- Card hover state for linked modules
- Blue icon accent color for section headers
- `dashboard-card--module`, `dashboard-card__link` for module cards
- Consistent gap (`--space-8`) between sections

---

#### 7. Dashboard QA & Content Updates

**Title:** Dashboard QA & Content Updates

**Description:** Verify dashboard for admin and document how to edit copy.

**Tasks:**

- Admin login → sees all live module links work
- Click Companies, Users, Policies, Activity → correct routes
- Analytics/Settings show Soon and are not clickable
- Non-admin user behavior documented (if supported)
- Edit `dashboardContent.ts` only for copy changes (no code deploy for text)
- Responsive check: mobile, tablet, desktop
- No duplicate metrics row / layout overflow

---

## Child Tickets for Dashboard (detailed)

**Key files:**

| Area | Path |
|------|------|
| Page | `frontend/src/app/dashboard/page.tsx` |
| UI | `frontend/src/components/dashboard/DashboardHome.tsx` |
| Content | `frontend/src/config/dashboardContent.ts` |
| Styles | `frontend/src/app/globals.css` (dashboard-* ) |
| Layout | `frontend/src/app/dashboard/layout.tsx`, `MainLayout.tsx` |

---

## Suggested JIRA structure

| JIRA issue | Maps to section |
|------------|-----------------|
| Epic | **Dashboard** |
| Story | 1–7 as listed above |

**Blocked by:** Login page, Project setup (layout shell)

**Related epics:** Company, User, Policy, Activity log (linked from module grid)
