# Session Log — March 3, 2026

## Prompt 1: `pac auth list`

**What it did:** Verified Power Platform CLI auth profiles. Three profiles existed; profile [2] was active, targeting the **og-dv** environment (`admin@M365x06150305.onmicrosoft.com`, `https://og-dv.crm.dynamics.com/`).

---

## Prompt 2: "Deploy this code app to my active pac auth profile"

**Summary:**
- Ran `npm install` and `npm run build` on the React+Vite+TypeScript starter app
- Ran `pac code init` to generate `power.config.json` linking the app to the og-dv environment
- Ran `pac code push` to deploy the starter app to Power Apps

**Result:** App deployed successfully to:
`https://apps.powerapps.com/play/e/0582014c-9a6d-e35b-8705-5168c385f413/app/c55049c1-73e0-44d0-b4d3-c816839a02a9`

---

## Prompt 3: "Using the customizations file I added to the new customizations folder, update the app so that it has CRUD functionality for every table in the solution"

**Summary:**
- Parsed `customizations.xml` to extract 8 entities: Account, Contact, ActionItem, HVA, Idea, Impact, MeetingSummary, Project
- Extracted full field schemas, option sets (Task Priority, Task Status, Task Type, Idea Category), and relationships from the XML
- Studied the `@microsoft/power-apps` SDK to understand available APIs

**Files created:**
- `src/types/entities.ts` — TypeScript interfaces for all 8 entities, option set constants, `EntityConfig` objects with field definitions, entity set names, default select/orderby
- `src/lib/dataverse.ts` — Data access layer with `listRecords`, `getRecord`, `createRecord`, `updateRecord`, `deleteRecord`, `fetchLookupOptions`
- `src/hooks/use-dataverse.ts` — React Query hooks wrapping the data layer (`useEntityList`, `useEntityRecord`, `useCreateEntity`, `useUpdateEntity`, `useDeleteEntity`, `useLookupOptions`)
- `src/components/entity-list-page.tsx` — Generic list page with search, data table, inline edit/delete actions
- `src/components/record-form-dialog.tsx` — Dynamic form dialog supporting text, textarea, number, date, datetime, optionset, and lookup field types
- `src/components/confirm-delete-dialog.tsx` — Delete confirmation dialog
- `src/components/sidebar-nav.tsx` — Sidebar navigation with icons for all 8 entities
- `src/pages/accounts.tsx`, `contacts.tsx`, `action-items.tsx`, `hvas.tsx`, `ideas.tsx`, `impacts.tsx`, `meeting-summaries.tsx`, `projects.tsx` — Thin page wrappers passing entity config to `EntityListPage`
- Updated `src/pages/home.tsx` — Dashboard with entity cards
- Updated `src/pages/_layout.tsx` — Added sidebar layout
- Updated `src/router.tsx` — Added routes for all 8 entities

**Issues:**
- `@microsoft/power-apps` has **no root export** — only subpath exports (`/app`, `/data`, `/data/executors`, `/telemetry`). Initial import `from "@microsoft/power-apps"` failed. Fixed by changing to `from "@microsoft/power-apps/app"`.

**Result:** Built and deployed successfully with `pac code push`.

---

## Prompt 4: "When I click on any table the view screen says failed to fetch"

**Summary:**
The initial data layer used raw `fetch()` calls to the Dataverse Web API (`/api/data/v9.2/...`). This fundamentally doesn't work inside the Power Apps iframe — there's no auth token and CORS blocks the requests.

**Research & resolution:**
- O'G provided two research links: the MS Learn Code Apps docs and the GitHub `PowerAppsCodeApps` repo
- Fetched and read the MS Learn overview, architecture, and "connect to data" pages
- Fetched and read the GitHub repo README and HelloWorld sample
- Discovered the correct pattern: **use `pac code add-data-source` to register connectors**, which generates typed Model/Service files in `src/generated/`
- Ran `pac connection list` to find the Dataverse connection ID
- Ran `pac code add-data-source -a "shared_commondataserviceforapps" -c "66f15c5ff85d4bd892f8d7c262f42c18" -t "accounts"` — **SUCCESS**
  - Generated: `src/generated/services/MicrosoftDataverseService.ts`, `src/generated/models/MicrosoftDataverseModel.ts`, `src/generated/index.ts`, and `.power/schemas/` files
- Read the generated service file and found the SDK CRUD methods: `ListRecords`, `GetItem`, `CreateRecord`, `UpdateRecord`, `DeleteRecord`
- Rewrote `src/lib/dataverse.ts` to use `MicrosoftDataverseService` instead of raw `fetch()`

**Issues during the fix:**
1. **Tried `create_file` on an existing file** — tool rejected it. Had to use `replace_string_in_file` instead.
2. **Auto-generated service file had invalid TypeScript** — the code generator emitted `MSCRM.IncludeMipSensitivityLabel` as a parameter name (dots aren't valid in JS identifiers). This caused 963 compile errors. Fixed with a find-and-replace: `MSCRM.IncludeMipSensitivityLabel` → `MSCRM_IncludeMipSensitivityLabel`.

**Result:** Built successfully, deployed with `pac code push`.

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| `MicrosoftDataverseService` over raw `fetch()` | Power Apps iframe requires data to flow through the SDK bridge — no direct HTTP to Dataverse |
| React Query for caching | Provides automatic refetch, optimistic updates, loading/error states |
| Generic `EntityListPage` component | One component serves all 8 entities — config-driven via `EntityConfig` objects |
| shadcn/ui components | Already in the starter template; consistent with the project's Radix-based design |

## Architecture

```
User clicks table → EntityListPage renders
  → useEntityList hook (React Query)
    → listRecords() in dataverse.ts
      → MicrosoftDataverseService.ListRecords() (generated SDK)
        → getClient().executeAsync() (@microsoft/power-apps/data)
          → Power Apps host bridge (handles auth + connector call)
            → Dataverse Web API
```

---

## Prompt 5: "add a docs folder and add a file that lists all the prompts..."

**Summary:** Created `docs/session-log-2025-03-03.md` (this file) and `MEMORY.md`.

---

## Prompt 6: "no more errors, but no rows are returned for any of the tables, and when i create a new account for example, it doesn't get saved in dataverse"

**Summary:**
The connector pattern (`shared_commondataserviceforapps`) generates code that compiles and runs without errors, but **data operations silently fail**. No rows returned from `ListRecords`, creates via `CreateRecord` don't persist.

**Investigation:**
- Examined `IOperationResult<T>` type: `{ success, data, error, skipToken, count }`
- Added `unwrap()` function and `flattenRows()` helper
- Added `console.log` debugging throughout dataverse.ts
- All calls appeared to "succeed" (no errors thrown) but returned empty data

**Root cause:** Unknown at this point — the connector SDK path fundamentally doesn't work for Dataverse CRUD.

---

## Prompt 7: "you can look at the code app project here... it works well C:\Users\pogorman\source\repos\og-central-code-app"

**Summary:**
O'G pointed to a working reference app. Agent read its entire codebase and discovered the **critical distinction**:

### Connector References vs Database References

| | Connector (WRONG) | Database (CORRECT) |
|-|---------|----------|
| CLI | `pac code add-data-source -a "shared_commondataserviceforapps" -c "<id>" -t "<table>"` | `pac code add-data-source -a dataverse -t <logicalName>` |
| Config | `connectionReferences` in power.config.json | `databaseReferences` in power.config.json |
| Generated | Single `MicrosoftDataverseService.ts` | Per-table services (e.g., `AccountsService.ts`) |
| SDK | `connectorOperation` → `executeAsync()` | `getClient(dataSourcesInfo)` → `retrieveMultipleRecordsAsync()` |
| Result | Silently fails — no data | Full CRUD works |

**Fix applied:**
1. Ran `pac code add-data-source -a dataverse -t <logicalName>` for all 8 tables — all succeeded
2. Verified generated per-table services in `src/generated/services/`
3. Rewrote `src/lib/dataverse.ts` with `serviceMap` pattern mapping entitySetName → generated service
4. Removed old `connectionReferences` from power.config.json
5. Omitted `$select` entirely (working app warned that computed fields cause silent failures)

**Additional learning from reference app:**
- Working app's CLAUDE.md documented the `$select` computed field issue
- Working app used per-table service classes in `src/services/` wrapping generated services
- Working app had separate hooks per CRUD operation (`use-entity-list.ts`, `use-entity-mutation.ts`, `use-entity-record.ts`)

**Result:** Built successfully (694KB bundle), deployed with `pac code push` — SUCCESS.

---

## Prompt 8: "update your files"

**Summary:** Updated all documentation files (MEMORY.md, CLAUDE.md, ARCHITECTURE.md, FAQ.md, USER-GUIDE.md, HOW-I-WAS-BUILT.md, session log, README.md) and created an optimized mega-prompt for rebuilding the app from scratch.

---

## Session Summary

| Step | Action | Time Estimate |
|------|--------|---------------|
| 1 | Auth verification | 1 min |
| 2 | Initial deploy | 5 min |
| 3 | Build CRUD for 8 tables | 30 min |
| 4 | Fix "failed to fetch" (raw fetch → connector SDK) | 30 min |
| 5 | Documentation | 10 min |
| 6 | Debug silent data failure | 30 min |
| 7 | Fix with database references (the real fix) | 20 min |
| 8 | Update all docs + create mega-prompt | 15 min |

**Total estimated session time: ~2.5 hours**

The single biggest time sink was the connector-vs-database-reference distinction. If known upfront, steps 4 and 6 could have been skipped entirely, saving ~1 hour.
