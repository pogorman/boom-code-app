# Optimized Prompt — Build Power Apps Code App with Dataverse CRUD

> **Purpose:** Hand this single prompt to a fresh GitHub Copilot instance along with
> `customizations.xml` to build a production-quality Power Apps Code App with full CRUD
> for all Dataverse tables — in one shot, without the trial-and-error that happened the
> first time. Every pitfall discovered in the original session is encoded here.

---

## THE PROMPT

Paste everything below (including the XML file) into a new Copilot session:

---

### Context

I have a Power Apps **Code App** project bootstrapped with the `pac code create` Vite + React + TypeScript starter template. The project lives in the folder called `The Boom Code App`.

I'm authenticated to my Power Platform environment via `pac auth list` (og-dv environment).

I've attached `customizations.xml` from my Dataverse solution. It contains all entity definitions, fields, option sets, and relationships.

### What I Need

Build full CRUD functionality for **every entity** in the customizations XML. The final app should:

1. Have a **sidebar navigation** listing all entities
2. Have a **home page** with cards linking to each entity
3. Have a **generic, config-driven list page** for each entity with:
   - Data table showing key columns
   - Search (server-side OData `contains` filter on primary name field)
   - Create button → modal form
   - Edit button → same modal, pre-populated
   - Delete button → confirmation dialog
4. Support all field types: text, textarea, number, date, datetime, option sets, lookups
5. Use **React Query** for data fetching with automatic cache invalidation on mutations
6. Show **toast notifications** (Sonner) on create/update/delete success and errors
7. Use **shadcn/ui** components (already in the starter: Button, Card, Input, Select, Dialog, Table, Calendar, Popover, Badge, Skeleton, Tabs, etc.)
8. Support **dark/light theme toggle** (already wired in starter)

### CRITICAL Technical Requirements — READ BEFORE WRITING ANY CODE

These are hard-won lessons. Violating any of these will cause silent failures that are extremely difficult to debug.

#### 1. Data Access — Use Database References, NOT Connectors

**BEFORE writing any data access code**, register each Dataverse table using:

```bash
pac code add-data-source -a dataverse -t <logicalName>
```

For example:
```bash
pac code add-data-source -a dataverse -t account
pac code add-data-source -a dataverse -t contact
pac code add-data-source -a dataverse -t tdvsp_actionitem
pac code add-data-source -a dataverse -t tdvsp_hva
pac code add-data-source -a dataverse -t tdvsp_idea
pac code add-data-source -a dataverse -t tdvsp_impact
pac code add-data-source -a dataverse -t tdvsp_meetingsummary
pac code add-data-source -a dataverse -t tdvsp_project
```

This generates:
- `databaseReferences` in `power.config.json`
- Per-table service files in `src/generated/services/` (e.g., `AccountsService.ts`)
- Per-table model files in `src/generated/models/`
- `src/generated/models/CommonModels.ts` with `IGetAllOptions`

**DO NOT use:**
- `pac code add-data-source -a "shared_commondataserviceforapps" ...` — this creates connector references that compile but silently fail at runtime
- Raw `fetch()` or `XMLHttpRequest` to Dataverse — the app runs in a sandboxed iframe with no auth tokens
- Any pattern involving `MicrosoftDataverseService`, `connectionReferences`, or `connectorOperation`

#### 2. SDK Imports — Subpath Only

```ts
// WRONG — no root export exists, will cause build error
import { something } from "@microsoft/power-apps";

// CORRECT
import { getClient } from "@microsoft/power-apps/data";
```

#### 3. Never Use `$select` With Computed Fields

Do **NOT** pass a `$select` parameter that includes computed or annotation fields (anything with `@OData.Community.Display.V1.FormattedValue`, `owneridname`, `_value` suffixed fields, etc.). This causes queries to **silently return zero rows** with no error.

**Solution:** Omit `$select` entirely. Let Dataverse return all columns.

#### 4. Check Generated Files for Invalid TypeScript

After running `pac code add-data-source`, check generated `.ts` files for parameter names containing dots (e.g., `MSCRM.IncludeMipSensitivityLabel`). Dots are invalid in TypeScript identifiers. Replace with underscores.

#### 5. Routing — Compute Basename from Iframe URL

```ts
const BASENAME = new URL(".", location.href).pathname;
if (location.pathname.endsWith("/index.html")) {
  history.replaceState(null, "", BASENAME + location.search + location.hash);
}
export const router = createBrowserRouter([...], { basename: BASENAME });
```

### Architecture to Follow

```
src/
├── types/entities.ts          # Entity interfaces, EntityConfig objects, option sets
├── lib/dataverse.ts           # serviceMap registry + CRUD functions
├── hooks/use-dataverse.ts     # React Query hooks
├── components/
│   ├── entity-list-page.tsx   # Generic config-driven CRUD list page
│   ├── record-form-dialog.tsx # Dynamic form supporting all field types
│   ├── confirm-delete-dialog.tsx
│   └── sidebar-nav.tsx
├── pages/
│   ├── _layout.tsx            # Header + sidebar + <Outlet>
│   ├── home.tsx               # Dashboard cards
│   └── [entity].tsx           # One thin page per entity
├── router.tsx                 # Routes with Power Apps basename
└── generated/                 # Auto-generated (DO NOT edit)
```

#### Data Access Layer Pattern (`src/lib/dataverse.ts`)

Create a `serviceMap` that maps entity set names to the generated service classes:

```ts
import { AccountsService } from "@/generated/services/AccountsService";
// ... import all generated services

interface ServiceFacade {
  getAll: (opts?: { filter?: string; orderBy?: string[]; top?: number; skipToken?: string }) => Promise<{ data: unknown[] | null }>;
  get: (id: string) => Promise<{ data: unknown }>;
  create: (record: Record<string, unknown>) => Promise<{ data: unknown }>;
  update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  delete: (id: string) => Promise<void>;
}

const serviceMap: Record<string, ServiceFacade> = {
  accounts: AccountsService as unknown as ServiceFacade,
  // ... register all services
};

// Then expose: listRecords, getRecord, createRecord, updateRecord, deleteRecord
```

#### EntityConfig Pattern (`src/types/entities.ts`)

Each entity gets a config object that drives the generic components:

```ts
interface EntityConfig {
  displayName: string;
  displayNamePlural: string;
  entitySetName: string;        // Must match serviceMap key
  primaryKey: string;
  primaryNameField: string;
  route: string;
  icon: string;                 // Lucide icon name
  fields: FieldConfig[];
  defaultSelect: string[];      // NOT used in queries, only for reference
  defaultOrderBy?: string;
}

interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "datetime" | "lookup" | "optionset";
  isRequired?: boolean;
  options?: readonly { value: number; label: string }[];  // For optionset
  lookupEntitySet?: string;      // For lookup
  lookupDisplayField?: string;
  lookupKeyField?: string;
  readName?: string;             // e.g., "_primarycontactid_value"
  formattedValueKey?: string;    // e.g., "_primarycontactid_value@OData.Community.Display.V1.FormattedValue"
  bindPath?: string;             // e.g., "/contacts" — for @odata.bind writes
  showInTable?: boolean;
}
```

#### Lookup Field Pattern

- **Read:** Display the formatted value from `formattedValueKey` (e.g., the contact's name)
- **Write:** Use `"fieldname@odata.bind": "/entitySet(guid)"` or `null` to unbind

#### Page Pattern

Each entity page is just:
```tsx
import { EntityListPage } from "@/components/entity-list-page";
import { ACCOUNT_CONFIG } from "@/types/entities";
export default function AccountsPage() {
  return <EntityListPage config={ACCOUNT_CONFIG} />;
}
```

### Execution Order

1. **First:** Run all `pac code add-data-source -a dataverse -t <logicalName>` commands
2. **Check:** Verify generated services exist and have no invalid identifiers
3. **Then:** Create `src/types/entities.ts` with all entity configs (parse from customizations.xml)
4. **Then:** Create `src/lib/dataverse.ts` with serviceMap
5. **Then:** Create `src/hooks/use-dataverse.ts` with React Query hooks
6. **Then:** Create the generic components (entity-list-page, record-form-dialog, confirm-delete-dialog, sidebar-nav)
7. **Then:** Create pages + update router + update layout
8. **Then:** `npm run build` — fix any compile errors
9. **Then:** `pac code push` — deploy

### Deploy

```bash
cd "The Boom Code App"
npm run build
pac code push
```

---

## NOTES FOR THE AI AGENT

- Parse `customizations.xml` to extract: entity names, logical names, entity set names, primary keys, fields (with types, option set values, lookup targets)
- The custom table prefix is `tdvsp_`
- Standard tables (Account, Contact) use standard schema; custom tables use `tdvsp_` prefixed fields
- Option set values are integers — extract both values and labels from the XML
- All 8 entity pages follow the exact same pattern — zero custom per-entity logic
- The `ALL_ENTITY_CONFIGS` array drives the sidebar nav and home page cards
- Never create a file that already exists — use edit tools instead
- Don't forget to update `_layout.tsx` to include the sidebar
- Make sure the `basename` routing fix is in `router.tsx`
