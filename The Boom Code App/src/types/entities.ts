// ─── Option Set Constants ────────────────────────────────────────────────────

export const TASK_PRIORITY = [
  { value: 468510001, label: "Eh... Get to it when you can" },
  { value: 468510000, label: "Low... but on deck for sure" },
  { value: 468510003, label: "High... next in line after top priority..." },
  { value: 468510002, label: "Top priority... no kidding!" },
] as const;

export const TASK_STATUS = [
  { value: 468510000, label: "Recognized/Pondering" },
  { value: 468510001, label: "In Progress" },
  { value: 468510002, label: "Pending Communication" },
  { value: 468510003, label: "On Hold" },
  { value: 468510004, label: "Wrapping Up" },
  { value: 468510005, label: "Complete" },
] as const;

export const TASK_TYPE = [
  { value: 468510000, label: "Personal" },
  { value: 468510001, label: "Work" },
] as const;

export const IDEA_CATEGORY = [
  { value: 468510000, label: "Copilot Studio" },
  { value: 468510001, label: "Canvas Apps" },
  { value: 468510002, label: "Model-Driven Apps" },
  { value: 468510003, label: "Power Automate" },
  { value: 468510004, label: "Power Pages" },
  { value: 468510005, label: "Azure" },
  { value: 468510006, label: "AI General" },
  { value: 468510007, label: "App General" },
  { value: 468510008, label: "Other" },
] as const;

// ─── Entity Interfaces ──────────────────────────────────────────────────────

export interface Account {
  accountid: string;
  name: string;
  revenue?: number;
  numberofemployees?: number;
  _primarycontactid_value?: string;
  /** Formatted lookup value injected by OData */
  "_primarycontactid_value@OData.Community.Display.V1.FormattedValue"?: string;
}

export interface Contact {
  contactid: string;
  fullname: string;
  jobtitle?: string;
  emailaddress1?: string;
  mobilephone?: string;
  _parentcustomerid_value?: string;
  "_parentcustomerid_value@OData.Community.Display.V1.FormattedValue"?: string;
}

export interface ActionItem {
  tdvsp_actionitemid: string;
  tdvsp_name: string;
  tdvsp_description?: string;
  tdvsp_date?: string;
  tdvsp_priority?: number;
  tdvsp_taskstatus?: number;
  tdvsp_tasktype?: number;
  _tdvsp_customer_value?: string;
  "_tdvsp_customer_value@OData.Community.Display.V1.FormattedValue"?: string;
}

export interface HVA {
  tdvsp_hvaid: string;
  tdvsp_name: string;
  tdvsp_description?: string;
  tdvsp_date?: string;
  _tdvsp_customer_value?: string;
  "_tdvsp_customer_value@OData.Community.Display.V1.FormattedValue"?: string;
}

export interface Idea {
  tdvsp_ideaid: string;
  tdvsp_name: string;
  tdvsp_description?: string;
  tdvsp_category?: number;
  _tdvsp_account_value?: string;
  "_tdvsp_account_value@OData.Community.Display.V1.FormattedValue"?: string;
  _tdvsp_contact_value?: string;
  "_tdvsp_contact_value@OData.Community.Display.V1.FormattedValue"?: string;
}

export interface Impact {
  tdvsp_impactid: string;
  tdvsp_name: string;
  tdvsp_description?: string;
  tdvsp_date?: string;
  _tdvsp_customer_value?: string;
  "_tdvsp_customer_value@OData.Community.Display.V1.FormattedValue"?: string;
}

export interface MeetingSummary {
  tdvsp_meetingsummaryid: string;
  tdvsp_name: string;
  tdvsp_summary?: string;
  tdvsp_date?: string;
  _tdvsp_account_value?: string;
  "_tdvsp_account_value@OData.Community.Display.V1.FormattedValue"?: string;
}

export interface Project {
  tdvsp_projectid: string;
  tdvsp_name: string;
  tdvsp_description?: string;
  _tdvsp_account_value?: string;
  "_tdvsp_account_value@OData.Community.Display.V1.FormattedValue"?: string;
}

// ─── Field Config (drives form + table rendering) ───────────────────────────

export type FieldType = "text" | "textarea" | "number" | "date" | "datetime" | "lookup" | "optionset";

export interface OptionSetValue {
  readonly value: number;
  readonly label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  isRequired?: boolean;
  /** For optionset fields */
  options?: readonly OptionSetValue[];
  /** For lookup fields – the entity set to query */
  lookupEntitySet?: string;
  /** For lookup fields – the display field on the related entity */
  lookupDisplayField?: string;
  /** For lookup fields – the key field on the related entity */
  lookupKeyField?: string;
  /** OData-formatted value key for read (lookups) */
  formattedValueKey?: string;
  /** The _value field name for reading lookups */
  readName?: string;
  /** The @odata.bind path for writing lookups */
  bindPath?: string;
  /** Show in list table */
  showInTable?: boolean;
  /** Column width hint */
  width?: string;
}

export interface EntityConfig {
  /** Singular display name */
  displayName: string;
  /** Plural display name */
  displayNamePlural: string;
  /** OData entity set name */
  entitySetName: string;
  /** Primary key field */
  primaryKey: string;
  /** Primary name field (for display) */
  primaryNameField: string;
  /** Route path */
  route: string;
  /** Icon name from lucide-react */
  icon: string;
  /** Fields configuration */
  fields: FieldConfig[];
  /** Default OData $select for list queries */
  defaultSelect: string[];
  /** Default OData $orderby */
  defaultOrderBy?: string;
  /** Default OData $expand */
  defaultExpand?: string;
}

// ─── Entity Configurations ──────────────────────────────────────────────────

export const ACCOUNT_CONFIG: EntityConfig = {
  displayName: "Account",
  displayNamePlural: "Accounts",
  entitySetName: "accounts",
  primaryKey: "accountid",
  primaryNameField: "name",
  route: "/accounts",
  icon: "Building2",
  defaultSelect: ["accountid", "name", "revenue", "numberofemployees", "_primarycontactid_value"],
  defaultOrderBy: "name asc",
  fields: [
    { name: "name", label: "Account Name", type: "text", isRequired: true, showInTable: true },
    { name: "revenue", label: "Revenue", type: "number", showInTable: true },
    { name: "numberofemployees", label: "Employees", type: "number", showInTable: true },
    {
      name: "primarycontactid",
      label: "Primary Contact",
      type: "lookup",
      showInTable: true,
      lookupEntitySet: "contacts",
      lookupDisplayField: "fullname",
      lookupKeyField: "contactid",
      readName: "_primarycontactid_value",
      formattedValueKey: "_primarycontactid_value@OData.Community.Display.V1.FormattedValue",
      bindPath: "/contacts",
    },
  ],
};

export const CONTACT_CONFIG: EntityConfig = {
  displayName: "Contact",
  displayNamePlural: "Contacts",
  entitySetName: "contacts",
  primaryKey: "contactid",
  primaryNameField: "fullname",
  route: "/contacts",
  icon: "Users",
  defaultSelect: ["contactid", "fullname", "jobtitle", "emailaddress1", "mobilephone", "_parentcustomerid_value"],
  defaultOrderBy: "fullname asc",
  fields: [
    { name: "fullname", label: "Full Name", type: "text", isRequired: true, showInTable: true },
    { name: "jobtitle", label: "Job Title", type: "text", showInTable: true },
    { name: "emailaddress1", label: "Email", type: "text", showInTable: true },
    { name: "mobilephone", label: "Mobile Phone", type: "text", showInTable: true },
    {
      name: "parentcustomerid_account",
      label: "Company",
      type: "lookup",
      showInTable: true,
      lookupEntitySet: "accounts",
      lookupDisplayField: "name",
      lookupKeyField: "accountid",
      readName: "_parentcustomerid_value",
      formattedValueKey: "_parentcustomerid_value@OData.Community.Display.V1.FormattedValue",
      bindPath: "/accounts",
    },
  ],
};

export const ACTION_ITEM_CONFIG: EntityConfig = {
  displayName: "Action Item",
  displayNamePlural: "Action Items",
  entitySetName: "tdvsp_actionitems",
  primaryKey: "tdvsp_actionitemid",
  primaryNameField: "tdvsp_name",
  route: "/action-items",
  icon: "CheckSquare",
  defaultSelect: [
    "tdvsp_actionitemid", "tdvsp_name", "tdvsp_description", "tdvsp_date",
    "tdvsp_priority", "tdvsp_taskstatus", "tdvsp_tasktype", "_tdvsp_customer_value",
  ],
  defaultOrderBy: "tdvsp_date desc",
  fields: [
    { name: "tdvsp_name", label: "Name", type: "text", isRequired: true, showInTable: true },
    { name: "tdvsp_date", label: "Date", type: "date", showInTable: true },
    {
      name: "tdvsp_customer",
      label: "Customer",
      type: "lookup",
      showInTable: true,
      lookupEntitySet: "accounts",
      lookupDisplayField: "name",
      lookupKeyField: "accountid",
      readName: "_tdvsp_customer_value",
      formattedValueKey: "_tdvsp_customer_value@OData.Community.Display.V1.FormattedValue",
      bindPath: "/accounts",
    },
    { name: "tdvsp_tasktype", label: "Task Type", type: "optionset", options: TASK_TYPE, showInTable: true },
    { name: "tdvsp_priority", label: "Priority", type: "optionset", options: TASK_PRIORITY, showInTable: true },
    { name: "tdvsp_taskstatus", label: "Status", type: "optionset", options: TASK_STATUS, showInTable: true },
    { name: "tdvsp_description", label: "Description", type: "textarea", showInTable: false },
  ],
};

export const HVA_CONFIG: EntityConfig = {
  displayName: "HVA",
  displayNamePlural: "HVAs",
  entitySetName: "tdvsp_hvas",
  primaryKey: "tdvsp_hvaid",
  primaryNameField: "tdvsp_name",
  route: "/hvas",
  icon: "Star",
  defaultSelect: ["tdvsp_hvaid", "tdvsp_name", "tdvsp_description", "tdvsp_date", "_tdvsp_customer_value"],
  defaultOrderBy: "tdvsp_date desc",
  fields: [
    { name: "tdvsp_name", label: "Name", type: "text", isRequired: true, showInTable: true },
    { name: "tdvsp_date", label: "Date", type: "date", showInTable: true },
    {
      name: "tdvsp_customer",
      label: "Customer",
      type: "lookup",
      showInTable: true,
      lookupEntitySet: "accounts",
      lookupDisplayField: "name",
      lookupKeyField: "accountid",
      readName: "_tdvsp_customer_value",
      formattedValueKey: "_tdvsp_customer_value@OData.Community.Display.V1.FormattedValue",
      bindPath: "/accounts",
    },
    { name: "tdvsp_description", label: "Description", type: "textarea", showInTable: true, width: "300px" },
  ],
};

export const IDEA_CONFIG: EntityConfig = {
  displayName: "Idea",
  displayNamePlural: "Ideas",
  entitySetName: "tdvsp_ideas",
  primaryKey: "tdvsp_ideaid",
  primaryNameField: "tdvsp_name",
  route: "/ideas",
  icon: "Lightbulb",
  defaultSelect: [
    "tdvsp_ideaid", "tdvsp_name", "tdvsp_description", "tdvsp_category",
    "_tdvsp_account_value", "_tdvsp_contact_value",
  ],
  defaultOrderBy: "tdvsp_name asc",
  fields: [
    { name: "tdvsp_name", label: "Name", type: "text", isRequired: true, showInTable: true },
    { name: "tdvsp_category", label: "Category", type: "optionset", options: IDEA_CATEGORY, showInTable: true },
    {
      name: "tdvsp_account",
      label: "Account",
      type: "lookup",
      showInTable: true,
      lookupEntitySet: "accounts",
      lookupDisplayField: "name",
      lookupKeyField: "accountid",
      readName: "_tdvsp_account_value",
      formattedValueKey: "_tdvsp_account_value@OData.Community.Display.V1.FormattedValue",
      bindPath: "/accounts",
    },
    {
      name: "tdvsp_contact",
      label: "Contact",
      type: "lookup",
      showInTable: true,
      lookupEntitySet: "contacts",
      lookupDisplayField: "fullname",
      lookupKeyField: "contactid",
      readName: "_tdvsp_contact_value",
      formattedValueKey: "_tdvsp_contact_value@OData.Community.Display.V1.FormattedValue",
      bindPath: "/contacts",
    },
    { name: "tdvsp_description", label: "Description", type: "textarea", showInTable: false },
  ],
};

export const IMPACT_CONFIG: EntityConfig = {
  displayName: "Impact",
  displayNamePlural: "Impacts",
  entitySetName: "tdvsp_impacts",
  primaryKey: "tdvsp_impactid",
  primaryNameField: "tdvsp_name",
  route: "/impacts",
  icon: "TrendingUp",
  defaultSelect: ["tdvsp_impactid", "tdvsp_name", "tdvsp_description", "tdvsp_date", "_tdvsp_customer_value"],
  defaultOrderBy: "tdvsp_date desc",
  fields: [
    { name: "tdvsp_name", label: "Name", type: "text", isRequired: true, showInTable: true },
    { name: "tdvsp_date", label: "Date", type: "date", showInTable: true },
    {
      name: "tdvsp_customer",
      label: "Customer",
      type: "lookup",
      showInTable: true,
      lookupEntitySet: "accounts",
      lookupDisplayField: "name",
      lookupKeyField: "accountid",
      readName: "_tdvsp_customer_value",
      formattedValueKey: "_tdvsp_customer_value@OData.Community.Display.V1.FormattedValue",
      bindPath: "/accounts",
    },
    { name: "tdvsp_description", label: "Description", type: "textarea", showInTable: true, width: "300px" },
  ],
};

export const MEETING_SUMMARY_CONFIG: EntityConfig = {
  displayName: "Meeting Summary",
  displayNamePlural: "Meeting Summaries",
  entitySetName: "tdvsp_meetingsummaries",
  primaryKey: "tdvsp_meetingsummaryid",
  primaryNameField: "tdvsp_name",
  route: "/meeting-summaries",
  icon: "FileText",
  defaultSelect: [
    "tdvsp_meetingsummaryid", "tdvsp_name", "tdvsp_summary", "tdvsp_date", "_tdvsp_account_value",
  ],
  defaultOrderBy: "tdvsp_date desc",
  fields: [
    { name: "tdvsp_name", label: "Name", type: "text", isRequired: true, showInTable: true },
    { name: "tdvsp_date", label: "Date", type: "datetime", showInTable: true },
    {
      name: "tdvsp_account",
      label: "Account",
      type: "lookup",
      showInTable: true,
      lookupEntitySet: "accounts",
      lookupDisplayField: "name",
      lookupKeyField: "accountid",
      readName: "_tdvsp_account_value",
      formattedValueKey: "_tdvsp_account_value@OData.Community.Display.V1.FormattedValue",
      bindPath: "/accounts",
    },
    { name: "tdvsp_summary", label: "Summary", type: "textarea", showInTable: false },
  ],
};

export const PROJECT_CONFIG: EntityConfig = {
  displayName: "Project",
  displayNamePlural: "Projects",
  entitySetName: "tdvsp_projects",
  primaryKey: "tdvsp_projectid",
  primaryNameField: "tdvsp_name",
  route: "/projects",
  icon: "Briefcase",
  defaultSelect: ["tdvsp_projectid", "tdvsp_name", "tdvsp_description", "_tdvsp_account_value"],
  defaultOrderBy: "tdvsp_name asc",
  fields: [
    { name: "tdvsp_name", label: "Name", type: "text", isRequired: true, showInTable: true },
    {
      name: "tdvsp_account",
      label: "Account",
      type: "lookup",
      showInTable: true,
      lookupEntitySet: "accounts",
      lookupDisplayField: "name",
      lookupKeyField: "accountid",
      readName: "_tdvsp_account_value",
      formattedValueKey: "_tdvsp_account_value@OData.Community.Display.V1.FormattedValue",
      bindPath: "/accounts",
    },
    { name: "tdvsp_description", label: "Description", type: "textarea", showInTable: true, width: "300px" },
  ],
};

// ─── All entity configs for navigation ──────────────────────────────────────

export const ALL_ENTITY_CONFIGS: EntityConfig[] = [
  ACCOUNT_CONFIG,
  CONTACT_CONFIG,
  ACTION_ITEM_CONFIG,
  HVA_CONFIG,
  IDEA_CONFIG,
  IMPACT_CONFIG,
  MEETING_SUMMARY_CONFIG,
  PROJECT_CONFIG,
];
