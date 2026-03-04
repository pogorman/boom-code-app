# FAQ — The Boom Code App

## General

### What is this?
A Power Apps Code App — a React SPA that runs inside the Power Apps player and provides CRUD functionality for 8 Dataverse tables.

### Where does it run?
Inside a Power Apps iframe at `https://apps.powerapps.com/play/...`. It does NOT run standalone in a browser.

### Can I run it locally?
`npm run dev` starts a local Vite dev server, but data access won't work because the `@microsoft/power-apps` SDK requires the Power Apps host bridge. You can use it for UI development with mock data.

---

## Data Access

### Why can't I use `fetch()` to call Dataverse?
The app runs in a sandboxed iframe. There are no auth tokens or CORS headers available. All data access must go through the `@microsoft/power-apps` SDK, which communicates with the Power Apps host via postMessage.

### What's the difference between connection references and database references?
- **Connection references** (`pac code add-data-source -a "shared_commondataserviceforapps" ...`) generate a single `MicrosoftDataverseService.ts` that uses `connectorOperation` → `executeAsync()`. This compiles but **data operations silently fail**.
- **Database references** (`pac code add-data-source -a dataverse -t <logicalName>`) generate per-table service classes that use `getClient(dataSourcesInfo)` → `retrieveMultipleRecordsAsync()`. **This is the correct pattern.**

### Why are no rows returned?
Most likely causes:
1. Using the wrong SDK pattern (connector references instead of database references)
2. Using `$select` with computed/annotation fields (causes silent failure)
3. The table has no data in the environment

### Why don't creates save to Dataverse?
Same as above — if you're using connector references instead of database references, creates will appear to succeed but nothing persists.

---

## Development

### How do I add a new table?
1. `pac code add-data-source -a dataverse -t <logicalName>`
2. Add interface + `EntityConfig` to `src/types/entities.ts`
3. Register the generated service in `serviceMap` in `src/lib/dataverse.ts`
4. Create a thin page wrapper in `src/pages/`
5. Add a route in `src/router.tsx`

### How do I deploy?
```bash
cd "The Boom Code App"
npm run build
pac code push
```

### What if `pac code add-data-source` generates invalid TypeScript?
Check generated files for parameter names with dots (e.g., `MSCRM.IncludeMipSensitivityLabel`). Replace dots with underscores.

### Why is `@microsoft/power-apps` imported with subpaths?
The package has no root export. Use `/app`, `/data`, `/data/metadata/dataverse`, etc.

---

## Troubleshooting

### Build errors after adding a data source
- Check generated files for invalid identifiers (dots in param names)
- Ensure you used `-a dataverse`, not `-a "shared_commondataserviceforapps"`

### App shows blank page in Power Apps
- Check browser DevTools console for errors
- Verify `power.config.json` has correct `appId` and `environmentId`
- Ensure `dist/index.html` exists after build

### Routing doesn't work
The app must compute its basename from the iframe URL:
```ts
const BASENAME = new URL(".", location.href).pathname;
```
Without this, all routes except `/` will 404.
