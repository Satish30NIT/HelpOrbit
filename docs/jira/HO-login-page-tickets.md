# Login Page — JIRA Tickets

---

## Parent Ticket

### Title

Login page

### Description

Build the **HelpOrbit login page** so administrators can sign in with email or username and password, receive a JWT, and enter the dashboard.

This feature enables users to:

- Open a dedicated public login route
- Submit credentials securely to the auth API
- See clear validation and error messages
- Persist session (token + user) for subsequent requests
- Redirect to `/dashboard` after successful login
- Skip login when already authenticated

**Route:**

`/login`

**Depends on:** Project setup (auth API: `POST /api/auth/login`, `AuthContext`)

**Does not include:** User registration, password reset, or SSO (out of scope unless added later).

The page must support:

- Identifier field (email or username)
- Password field with show/hide toggle
- Loading state during auth hydration and submit
- Branded layout (logo, HelpOrbit styling)
- Dark mode compatibility
- Framer Motion entry animation (optional polish)

**API used:**

- `POST /api/auth/login` — `{ identifier, password }`
- Returns `{ token, user }` stored via `setSession`

**Reference docs:** `docs/PROJECT_GUIDE.md` §1.6 · Epic Project setup (Authentication)

### Task List

- Login page layout & branding
- Login form & client validation
- Auth API integration (`AuthContext`)
- Session persistence (localStorage)
- Redirect & route protection
- Error, loading, and toast feedback
- Login page QA & accessibility

### Child Tickets (7)

Each child ticket has **Title**, **Description**, and **Tasks**. Full detail in sections below.

---

#### 1. Login Page Layout & Branding

**Title:** Login Page Layout & Branding

**Description:** Create the visual shell for the login screen centered on the viewport.

**Tasks:**

- Create `frontend/src/app/login/page.tsx`
- Full-height centered layout (`min-h-screen`, `app-bg`)
- Add `Logo` component (large size)
- Headline: “Welcome back” + subtitle
- Card container for form (`card` styles)
- Responsive padding (`px-4`, `max-w-md`)
- Support light and dark theme classes

---

#### 2. Login Form & Client Validation

**Title:** Login Form & Client Validation

**Description:** Build the credential form with accessible labels and basic client checks.

**Tasks:**

- Email or username input (`identifier`)
- Password input with required attribute
- Show/hide password toggle button
- Submit button with disabled state while submitting
- Prevent empty submit (trim identifier)
- Associate labels with `htmlFor` / `id`
- Form `onSubmit` handler (prevent default)

---

#### 3. Auth API Integration

**Title:** Auth API Integration

**Description:** Wire the form to `AuthContext.login` and backend auth endpoint.

**Tasks:**

- Call `login(identifier, password)` from `useAuth()`
- Use `api.post` with `auth: false` for login request
- Parse `LoginResponse` (`token`, `user`)
- Update context state on success
- Map `ApiError` to user-facing message
- Do not log password in console or network tools docs

---

#### 4. Session Persistence

**Title:** Session Persistence

**Description:** Store JWT and user profile so refresh keeps the user signed in.

**Tasks:**

- Implement `setSession(token, user)` in `lib/auth.ts`
- Implement `getToken()`, `getUser()`, `clearSession()`
- Hydrate `AuthContext` on app load from storage
- Expose `loading` flag until hydration completes
- Clear session on `logout()` (for header/sidebar later)

---

#### 5. Redirect & Route Protection

**Title:** Redirect & Route Protection

**Description:** Navigate users to the right place based on auth state.

**Tasks:**

- If `token` exists after hydration → `router.replace("/dashboard")`
- On successful login → `router.replace("/dashboard")`
- Root `/` page redirects to dashboard or login (`app/page.tsx`)
- Dashboard layout redirects unauthenticated users to `/login`
- Avoid flash of login form when already logged in (show loader while hydrating)

---

#### 6. Error, Loading & Toast Feedback

**Title:** Error, Loading & Toast Feedback

**Description:** Provide clear UX during load, failure, and success.

**Tasks:**

- Show `BrandedLoader` while `hydrating`
- Inline error message below form on failure
- Success toast: “Signed in successfully…”
- Error toast with API message
- `submitting` state disables inputs and button
- Generic fallback message if not `ApiError`

---

#### 7. Login Page QA & Accessibility

**Title:** Login Page QA & Accessibility

**Description:** Verify login works end-to-end and meets basic a11y standards.

**Tasks:**

- Test valid admin credentials → dashboard
- Test invalid password → error shown, no redirect
- Test empty fields → browser validation or app message
- Keyboard: Tab through fields, Enter submits
- Screen reader: labels announced
- Document test credentials in team wiki (not in git)
- Cross-check CORS if login fails from browser only

---

## Child Tickets for Login Page (detailed)

---

### 1. Login Page Layout & Branding

**Key files:** `login/page.tsx`, `components/brand/Logo.tsx`, `globals.css` (`.card`, `.app-bg`)

---

### 2. Login Form & Client Validation

**Key files:** `login/page.tsx` (form JSX)

---

### 3. Auth API Integration

**Key files:** `contexts/AuthContext.tsx`, `lib/api.ts`, `backend/src/routes/auth.routes.js`

---

### 4. Session Persistence

**Key files:** `lib/auth.ts`, `AuthContext.tsx`

---

### 5. Redirect & Route Protection

**Key files:** `login/page.tsx`, `app/page.tsx`, `dashboard/layout.tsx`

---

### 6. Error, Loading & Toast Feedback

**Key files:** `ToastContext.tsx`, `BrandedLoader.tsx`, `login/page.tsx`

---

### 7. Login Page QA & Accessibility

**Manual test matrix in parent ticket §7 tasks.**

---

## Suggested JIRA structure

| JIRA issue | Maps to section |
|------------|-----------------|
| Epic | **Login page** |
| Story | 1–7 as listed above |

**Blocked by:** Project setup → Authentication module (backend + `AuthContext` skeleton)

**Blocks:** Dashboard and all `/dashboard/*` routes
