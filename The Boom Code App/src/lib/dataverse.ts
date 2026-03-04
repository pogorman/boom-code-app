import { AccountsService } from "@/generated/services/AccountsService";
import { ContactsService } from "@/generated/services/ContactsService";
import { Tdvsp_actionitemsService } from "@/generated/services/Tdvsp_actionitemsService";
import { Tdvsp_hvasService } from "@/generated/services/Tdvsp_hvasService";
import { Tdvsp_ideasService } from "@/generated/services/Tdvsp_ideasService";
import { Tdvsp_impactsService } from "@/generated/services/Tdvsp_impactsService";
import { Tdvsp_meetingsummariesService } from "@/generated/services/Tdvsp_meetingsummariesService";
import { Tdvsp_projectsService } from "@/generated/services/Tdvsp_projectsService";
import type { EntityConfig } from "@/types/entities";

// ─── Service registry ───────────────────────────────────────────────────────
// Maps entitySetName → the correct generated service class.

interface ServiceFacade {
  getAll: (opts?: {
    filter?: string;
    orderBy?: string[];
    top?: number;
    skipToken?: string;
  }) => Promise<{ data: unknown[] | null }>;
  get: (id: string) => Promise<{ data: unknown }>;
  create: (record: Record<string, unknown>) => Promise<{ data: unknown }>;
  update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  delete: (id: string) => Promise<void>;
}

const serviceMap: Record<string, ServiceFacade> = {
  accounts: AccountsService as unknown as ServiceFacade,
  contacts: ContactsService as unknown as ServiceFacade,
  tdvsp_actionitems: Tdvsp_actionitemsService as unknown as ServiceFacade,
  tdvsp_hvas: Tdvsp_hvasService as unknown as ServiceFacade,
  tdvsp_ideas: Tdvsp_ideasService as unknown as ServiceFacade,
  tdvsp_impacts: Tdvsp_impactsService as unknown as ServiceFacade,
  tdvsp_meetingsummaries: Tdvsp_meetingsummariesService as unknown as ServiceFacade,
  tdvsp_projects: Tdvsp_projectsService as unknown as ServiceFacade,
};

function getService(entitySetName: string): ServiceFacade {
  const svc = serviceMap[entitySetName];
  if (!svc) {
    throw new Error(`No generated service registered for "${entitySetName}"`);
  }
  return svc;
}

// ─── Public CRUD functions ──────────────────────────────────────────────────

export async function listRecords<T>(
  config: EntityConfig,
  options?: {
    filter?: string;
    top?: number;
    orderBy?: string;
    skipToken?: string;
  },
): Promise<{ records: T[]; count?: number; nextLink?: string }> {
  const svc = getService(config.entitySetName);

  const orderByArr = options?.orderBy
    ? [options.orderBy]
    : config.defaultOrderBy
      ? [config.defaultOrderBy]
      : undefined;

  const result = await svc.getAll({
    filter: options?.filter,
    orderBy: orderByArr,
    top: options?.top,
    skipToken: options?.skipToken,
  });

  const records = (result.data ?? []) as unknown as T[];
  return { records };
}

export async function getRecord<T>(
  config: EntityConfig,
  id: string,
): Promise<T> {
  const svc = getService(config.entitySetName);
  const result = await svc.get(id);
  return result.data as unknown as T;
}

export async function createRecord<T>(
  config: EntityConfig,
  data: Record<string, unknown>,
): Promise<T> {
  const svc = getService(config.entitySetName);
  const result = await svc.create(data);
  return result.data as unknown as T;
}

export async function updateRecord(
  config: EntityConfig,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const svc = getService(config.entitySetName);
  await svc.update(id, data);
}

export async function deleteRecord(
  config: EntityConfig,
  id: string,
): Promise<void> {
  const svc = getService(config.entitySetName);
  await svc.delete(id);
}

// ─── Lookup helper ──────────────────────────────────────────────────────────

export interface LookupOption {
  id: string;
  name: string;
}

export async function fetchLookupOptions(
  entitySetName: string,
  keyField: string,
  displayField: string,
): Promise<LookupOption[]> {
  const svc = getService(entitySetName);

  const result = await svc.getAll({
    orderBy: [`${displayField} asc`],
    top: 500,
  });

  const items = (result.data ?? []) as unknown as Record<string, string>[];
  return items.map((r) => ({ id: r[keyField], name: r[displayField] }));
}
