# MEMORY — The Boom Code App

> Persistent notes and learnings for this project. Updated March 3, 2026.

---

## Project Identity

| Key | Value |
|-----|-------|
| App Name | The Boom Code App |
| App ID | `c55049c1-73e0-44d0-b4d3-c816839a02a9` |
| Environment ID | `0582014c-9a6d-e35b-8705-5168c385f413` |
| Environment URL | `https://og-dv.crm.dynamics.com/` |
| Play URL | `https://apps.powerapps.com/play/e/0582014c-9a6d-e35b-8705-5168c385f413/app/c55049c1-73e0-44d0-b4d3-c816839a02a9` |
| Admin Account | `admin@M365x06150305.onmicrosoft.com` |
| PAC Profile | `og-dv` |

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Build | Vite | 7.x |
| Language | TypeScript | 5.9 |
| View | React | 19.x |
| SDK | @microsoft/power-apps | 1.0.3 |
| Vite Plugin | @microsoft/power-apps-vite | 1.0.2 |
| Routing | react-router-dom | 7.x |
| Data | @tanstack/react-query | 5.x |
| Tables | @tanstack/react-table | 8.x |
| UI | shadcn/ui + Radix + Tailwind CSS 4 | — |
| Icons | Lucide React | — |
| Dates | date-fns | — |
| Toasts | Sonner | — |

## Dataverse Tables (8 total)

| Display Name | Logical Name | Entity Set | Primary Key | Custom Prefix |
|-------------|-------------|------------|-------------|---------------|
| Account | account | accounts | accountid | — |
| Contact | contact | contacts | contactid | — |
| Action Item | tdvsp_actionitem | tdvsp_actionitems | tdvsp_actionitemid | tdvsp_ |
| HVA | tdvsp_hva | tdvsp_hvas | tdvsp_hvaid | tdvsp_ |
| Idea | tdvsp_idea | tdvsp_ideas | tdvsp_ideaid | tdvsp_ |
| Impact | tdvsp_impact | tdvsp_impacts | tdvsp_impactid | tdvsp_ |
| Meeting Summary | tdvsp_meetingsummary | tdvsp_meetingsummaries | tdvsp_meetingsummaryid | tdvsp_ |
| Project | tdvsp_project | tdvsp_projects | tdvsp_projectid | tdvsp_ |

## Option Sets

| Option Set | Values |
|-----------|--------|
| Task Priority | Eh... Get to it when you can (468510001), Low (468510000), High (468510003), Top priority (468510002) |
| Task Status | Recognized/Pondering (468510000), In Progress (468510001), Pending Communication (468510002), On Hold (468510003), Wrapping Up (468510004), Complete (468510005) |
| Task Type | Personal (468510000), Work (468510001) |
| Idea Category | Copilot Studio (468510000), Canvas Apps (468510001), Model-Driven Apps (468510002), Power Automate (468510003), Power Pages (468510004), Azure (468510005), AI General (468510006), App General (468510007), Other (468510008) |

---

## How to Deploy

```bash
cd "The Boom Code App"
npm run build          # tsc -b && vite build
pac code push          # deploys dist/ to Power Apps
```

---

## Critical Lessons Learned

### 1. Database References vs Connection References (MOST IMPORTANT)

There are **two completely different SDK paths** for accessing Dataverse from a Power Apps Code App. Only one works correctly:

| | Connection References (WRONG) | Database References (CORRECT) |
|-|------|------|
| CLI command | `pac code add-data-source -a "shared_commondataserviceforapps" -c "<connId>" -t "<table>"` | `pac code add-data-source -a dataverse -t <logicalName>` |
| Config key | `connectionReferences` in power.config.json | `databaseReferences` in power.config.json |
| Generated service | Single `MicrosoftDataverseService.ts` | Per-table services (e.g., `AccountsService.ts`) |
| SDK pattern | `connectorOperation` → `executeAsync()` | `getClient(dataSourcesInfo)` → `retrieveMultipleRecordsAsync()` |
| Result | Connectivity exists but data ops silently fail — no rows returned, creates don't save | Full CRUD works correctly |

**Always use: `pac code add-data-source -a dataverse -t <logicalName>`**

### 2. `@microsoft/power-apps` Has No Root Export

```ts
// WRONG — will cause build error
import { something } from "@microsoft/power-apps";

// CORRECT — use subpath exports
import { getClient } from "@microsoft/power-apps/data";
import { App } from "@microsoft/power-apps/app";
```

Available subpaths: `/app`, `/data`, `/data/metadata/dataverse`, `/data/executors`, `/telemetry`

### 3. Never Use `$select` With Computed/Annotation Fields

Including computed fields (like `owneridname`, `_field_value@OData.Community.Display.V1.FormattedValue`) in `$select` causes **silent query failures** — the query executes but returns no rows with no error.

**Solution:** Omit `$select` entirely and let Dataverse return all columns. Performance impact is negligible for most use cases.

### 4. Auto-Generated Service Files May Have Invalid TypeScript

The PAC CLI code generator can emit parameter names with dots (e.g., `MSCRM.IncludeMipSensitivityLabel`), which are invalid TypeScript identifiers. If you see mass compile errors after `pac code add-data-source`, check generated files for this pattern and replace dots with underscores.

### 5. Power Apps Iframe Routing

The app runs inside a Power Apps iframe. The URL path includes a prefix that must be used as `basename` for react-router:

```ts
const BASENAME = new URL(".", location.href).pathname;
if (location.pathname.endsWith("/index.html")) {
  history.replaceState(null, "", BASENAME + location.search + location.hash);
}
export const router = createBrowserRouter([...], { basename: BASENAME });
```

### 6. Raw `fetch()` Does Not Work

You cannot use `fetch()` or `XMLHttpRequest` to call the Dataverse Web API directly from a code app. The app runs in a sandboxed iframe without auth tokens. All data access must go through the SDK-generated services.

### 7. Generated Service Method Signatures

The database-reference pattern generates per-table services with these methods:
```typescript
// Each generated service (e.g., AccountsService) exposes:
AccountsService.getAll(options?: IGetAllOptions)  // → { data: Account[] | null }
AccountsService.get(id: string)                    // → { data: Account }
AccountsService.create(record: Account)            // → { data: Account }
AccountsService.update(id: string, data: Account)  // → unknown
AccountsService.delete(id: string)                 // → void
```

IGetAllOptions: `{ maxPageSize?, select?, filter?, orderBy?: string[], top?, skip?, skipToken? }`

---

## Architecture Pattern

```
Page Component (e.g., AccountsPage)
  → EntityListPage (generic, config-driven)
    → useEntityList / useCreateEntity / etc. (React Query hooks)
      → listRecords / createRecord / etc. (dataverse.ts)
        → serviceMap[entitySetName].getAll() (per-table generated service)
          → getClient(dataSourcesInfo).retrieveMultipleRecordsAsync()
            → Power Apps SDK bridge → Dataverse Web API
```

## Key Files

| File | Purpose |
|------|---------|
| `src/types/entities.ts` | Entity interfaces, EntityConfig objects, option sets |
| `src/lib/dataverse.ts` | Service registry (serviceMap) + CRUD functions |
| `src/hooks/use-dataverse.ts` | React Query hooks wrapping dataverse.ts |
| `src/components/entity-list-page.tsx` | Generic config-driven CRUD list page |
| `src/components/record-form-dialog.tsx` | Dynamic create/edit form |
| `src/components/confirm-delete-dialog.tsx` | Delete confirmation dialog |
| `src/components/sidebar-nav.tsx` | Navigation sidebar |
| `src/pages/*.tsx` | Thin wrappers passing EntityConfig to EntityListPage |
| `src/generated/services/` | Auto-generated per-table service classes (DO NOT edit) |
| `src/generated/models/` | Auto-generated per-table model interfaces + CommonModels |
| `power.config.json` | Links app to environment, databaseReferences |
| `customizations/customizations.xml` | Dataverse solution schema |

## Adding a New Entity

1. Run `pac code add-data-source -a dataverse -t <logicalName>`
2. Add its interface to `src/types/entities.ts`
3. Add an `EntityConfig` object, add to `ALL_ENTITY_CONFIGS`
4. Register the generated service in the `serviceMap` in `src/lib/dataverse.ts`
5. Create a page in `src/pages/` (`<EntityListPage config={CONFIG} />`)
6. Add a route in `src/router.tsx`
