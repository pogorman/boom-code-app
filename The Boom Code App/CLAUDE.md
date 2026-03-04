# CLAUDE.md — The Boom Code App

> Project-specific instructions for GitHub Copilot / Claude sessions.

---

## What This Project Is

A **Power Apps Code App** — a React SPA deployed into the Power Apps runtime via `pac code push`. It provides full CRUD for 8 Dataverse tables. The app runs inside a Power Apps iframe, NOT as a standalone webapp.

## Non-Negotiable Rules

### Data Access — Database References Only

**NEVER use `fetch()`, `XMLHttpRequest`, or any direct HTTP to Dataverse.** The app runs in a sandboxed iframe with no auth tokens.

**NEVER use the connector pattern** (`pac code add-data-source -a "shared_commondataserviceforapps" -c "<id>" -t "<table>"`). This generates `connectionReferences` in power.config.json and a monolithic `MicrosoftDataverseService.ts`. It compiles fine but **data operations silently fail** — no rows returned, creates don't persist.

**ALWAYS use the database reference pattern:**
```bash
pac code add-data-source -a dataverse -t <logicalName>
```
This generates:
- `databaseReferences` in power.config.json
- Per-table service classes in `src/generated/services/` (e.g., `AccountsService.ts`)
- Per-table model files in `src/generated/models/`
- These services use `getClient(dataSourcesInfo).retrieveMultipleRecordsAsync()` etc.

### SDK Imports — Subpath Only

```ts
// WRONG — no root export exists
import { something } from "@microsoft/power-apps";

// CORRECT
import { getClient } from "@microsoft/power-apps/data";
```

### No `$select` With Computed Fields

Including annotation/computed fields in `$select` (like `owneridname`, `*@OData.Community.Display.V1.FormattedValue`) causes **silent query failures**. Omit `$select` entirely — Dataverse returns all columns.

### Auto-Generated Files — Check for Invalid Identifiers

After running `pac code add-data-source`, check generated `.ts` files for parameter names with dots (e.g., `MSCRM.IncludeMipSensitivityLabel`). Replace dots with underscores.

## Architecture

```
EntityConfig (types/entities.ts)
  → Page (pages/*.tsx)
    → EntityListPage (generic, config-driven)
      → React Query hooks (hooks/use-dataverse.ts)
        → serviceMap (lib/dataverse.ts)
          → Generated per-table service (generated/services/*.ts)
            → getClient(dataSourcesInfo) → Power Apps SDK bridge → Dataverse API
```

All entity pages share a single generic `EntityListPage` component. The component is driven by an `EntityConfig` object that defines fields, types, display settings, lookup relationships, and option sets.

## Deploy

```bash
cd "The Boom Code App"
npm run build
pac code push
```

## Adding a New Entity

1. `pac code add-data-source -a dataverse -t <logicalName>`
2. Add interface + `EntityConfig` to `src/types/entities.ts`, add to `ALL_ENTITY_CONFIGS`
3. Register generated service in `serviceMap` in `src/lib/dataverse.ts`
4. Create thin page wrapper in `src/pages/`
5. Add route in `src/router.tsx`

## Routing

The app uses `react-router-dom` with a dynamically computed basename to handle the Power Apps iframe URL prefix:
```ts
const BASENAME = new URL(".", location.href).pathname;
```

## Lookup Fields

Lookups use OData bind syntax for writes and annotation values for reads:
- **Read:** `_fieldname_value` (GUID) + `_fieldname_value@OData.Community.Display.V1.FormattedValue` (display name)
- **Write:** `"fieldname@odata.bind": "/entitySet(guid)"` or `null` to unbind

## Tech Stack

React 19 · Vite 7 · TypeScript 5.9 · @microsoft/power-apps 1.0.3 · react-router-dom 7 · @tanstack/react-query 5 · shadcn/ui · Tailwind CSS 4 · Lucide · date-fns · Sonner
