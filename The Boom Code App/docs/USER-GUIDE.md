# USER GUIDE — The Boom Code App

## Getting Started

Open the app from Power Apps:
`https://apps.powerapps.com/play/e/0582014c-9a6d-e35b-8705-5168c385f413/app/c55049c1-73e0-44d0-b4d3-c816839a02a9`

Or find **The Boom Code App** in your Power Apps home screen.

## Navigation

- **Home** — Dashboard showing cards for all 8 entity types
- **Sidebar** (left) — Direct links to each entity's list view
- **Theme toggle** (top-right) — Switch between light and dark mode

## Entity Views

Each entity (Accounts, Contacts, Action Items, HVAs, Ideas, Impacts, Meeting Summaries, Projects) has the same layout:

### List View
- Displays records in a data table with relevant columns
- Use the **search bar** to filter by name (server-side OData `contains` filter)
- Click **New [Entity]** to create a record
- Click the **pencil icon** to edit a record
- Click the **trash icon** to delete a record

### Creating a Record
1. Click **New [Entity]**
2. Fill in the form fields:
   - **Text/Textarea** — Type directly
   - **Number** — Enter a numeric value
   - **Date** — Click the calendar picker
   - **Option Set** — Select from a dropdown (e.g., Priority, Status, Category)
   - **Lookup** — Select from a dropdown of related records (e.g., Account → Contact)
3. Click **Create**

### Editing a Record
1. Click the **pencil icon** on any row
2. Modify fields as needed
3. Click **Save Changes**

### Deleting a Record
1. Click the **trash icon** on any row
2. Confirm the deletion in the dialog
3. The record is permanently removed from Dataverse

## Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **Accounts** | Customer organizations | Name, Revenue, Employees, Primary Contact |
| **Contacts** | Individual people | Full Name, Job Title, Email, Phone, Company |
| **Action Items** | Tasks to track | Name, Date, Customer, Type, Priority, Status |
| **HVAs** | High-Value Activities | Name, Date, Customer, Description |
| **Ideas** | Product/solution ideas | Name, Category, Account, Contact |
| **Impacts** | Customer impact stories | Name, Date, Customer, Description |
| **Meeting Summaries** | Meeting notes | Name, Date, Account, Summary |
| **Projects** | Active projects | Name, Account, Description |

## Tips

- Toast notifications appear at the bottom when records are created, updated, or deleted
- Lookup dropdowns load up to 500 related records, sorted alphabetically
- Long text fields are truncated in the table view but shown in full in the edit form
