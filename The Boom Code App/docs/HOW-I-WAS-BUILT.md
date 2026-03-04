# HOW I WAS BUILT — The Boom Code App

> An ELI5 journal of how this app was created, documenting the prompts, what happened, what broke, and what we learned. Written so you could hand this to a fresh AI agent or a colleague and they'd understand the full story.

---

## Session: March 3, 2026

### Step 1: Verify Auth

**Prompt:** `pac auth list`

**What happened:** Confirmed the PAC CLI was authenticated to the og-dv Dataverse environment as `admin@M365x06150305.onmicrosoft.com`.

---

### Step 2: Deploy the Starter Template

**Prompt:** "Deploy this code app to my active pac auth profile"

**What happened:**
- Ran `npm install`, `npm run build` on the Vite + React + TypeScript starter template
- `pac code init` generated `power.config.json` linking the app to the environment
- `pac code push` deployed the built app to Power Apps

**Result:** Starter app visible in Power Apps player. No data functionality yet.

---

### Step 3: Build CRUD for All Tables

**Prompt:** "Using the customizations file I added to the new customizations folder, update the app so that it has CRUD functionality for every table in the solution"

**What happened:**
- Agent parsed `customizations.xml` (12,000+ lines) to extract 8 entities with their fields, option sets, and relationships
- Created a comprehensive file set from scratch:
  - `src/types/entities.ts` — interfaces, option sets, EntityConfig objects
  - `src/lib/dataverse.ts` — data access layer using raw `fetch()` to Dataverse Web API
  - `src/hooks/use-dataverse.ts` — React Query hooks
  - `src/components/entity-list-page.tsx` — generic CRUD list page
  - `src/components/record-form-dialog.tsx` — dynamic form dialog
  - `src/components/confirm-delete-dialog.tsx` — delete confirmation
  - `src/components/sidebar-nav.tsx` — navigation
  - 8 page files + updated router and layout

**Issue #1:** `@microsoft/power-apps` has no root export. Import `from "@microsoft/power-apps"` failed. Fixed by using subpath imports (`/app`, `/data`).

**Result:** Built and deployed. App had a sidebar, 8 entity pages, forms, the works.

---

### Step 4: "Failed to Fetch"

**Prompt:** "When I click on any table the view screen says failed to fetch"

**What happened:** The data layer used raw `fetch()` to `/api/data/v9.2/...`. This cannot work in a Power Apps iframe — no auth tokens, CORS blocked.

**Fix attempt:** Discovered `pac code add-data-source` to register connectors. Ran:
```bash
pac code add-data-source -a "shared_commondataserviceforapps" -c "66f15c5ff85d4bd892f8d7c262f42c18" -t "accounts"
```

This generated `MicrosoftDataverseService.ts` with typed CRUD methods. Rewrote `dataverse.ts` to use it.

**Issue #2:** The generated service file had `MSCRM.IncludeMipSensitivityLabel` as a parameter name — dots are invalid in TypeScript identifiers. Caused 963 compile errors. Fixed with find-and-replace to underscores.

**Result:** Built and deployed. No more "failed to fetch."

---

### Step 5: Documentation

**Prompt:** "Add a docs folder and add a file that lists all the prompts..."

**What happened:** Created `docs/session-log-2025-03-03.md` and `MEMORY.md`.

---

### Step 6: No Rows, Creates Don't Save

**Prompt:** "No more errors, but no rows are returned for any of the tables, and when I create a new account for example, it doesn't get saved in dataverse"

**What happened:** The connector pattern (`shared_commondataserviceforapps`) generates code that compiles and runs without errors, but data operations silently fail. No rows returned, creates don't persist. This was the hardest bug — zero error messages.

**Investigation:** Added `console.log` debugging, checked `IOperationResult` types, examined the SDK executor code. The agent was stuck trying to fix something that fundamentally couldn't work with the connector pattern.

---

### Step 7: The Breakthrough — Reference App

**Prompt:** "You can look at the code app project here... it works well C:\Users\pogorman\source\repos\og-central-code-app"

**What happened:** O'G pointed to a working reference app. The agent read its code and discovered the **root cause**:

> The working app uses **database references** (`pac code add-data-source -a dataverse -t <logicalName>`), NOT **connection references** (`pac code add-data-source -a "shared_commondataserviceforapps" ...`).

These are **completely different SDK paths**:
- **Connector path** → `connectionReferences` in config → single `MicrosoftDataverseService` → `connectorOperation` → `executeAsync()` → **SILENTLY FAILS**
- **Database path** → `databaseReferences` in config → per-table services (AccountsService, etc.) → `getClient(dataSourcesInfo)` → `retrieveMultipleRecordsAsync()` → **WORKS**

**Fix:**
1. Ran `pac code add-data-source -a dataverse -t <logicalName>` for all 8 tables
2. Rewrote `dataverse.ts` with a `serviceMap` registry pointing to per-table services
3. Removed old `connectionReferences` from power.config.json
4. Omitted `$select` entirely (working app's lesson: computed fields in $select cause silent failures)

**Result:** Built (694KB), deployed, pushed successfully.

---

## Mistakes & Lessons (for next time)

| # | Mistake | Lesson | Time Cost |
|---|---------|--------|-----------|
| 1 | Used raw `fetch()` for Dataverse API | Code Apps run in iframe — must use SDK | ~30 min |
| 2 | Used connector pattern (`shared_commondataserviceforapps`) | Database references (`-a dataverse`) is the correct pattern | ~2 hours |
| 3 | Auto-generated files had invalid TS (dots in identifiers) | Always check generated code for dots → underscores | ~15 min |
| 4 | Tried `import from "@microsoft/power-apps"` | Only subpath exports exist (`/app`, `/data`, etc.) | ~10 min |
| 5 | Used `$select` with computed fields | Omit `$select` — computed fields cause silent query failures | ~20 min |

## The Single Most Important Lesson

**`pac code add-data-source -a dataverse -t <logicalName>`** — not the connector pattern. This one distinction would have saved 2+ hours and multiple deploy cycles.
