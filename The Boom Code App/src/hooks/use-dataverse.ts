import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  fetchLookupOptions,
  type LookupOption,
} from "@/lib/dataverse";
import type { EntityConfig, FieldConfig } from "@/types/entities";
import { toast } from "sonner";

// ─── List hook ──────────────────────────────────────────────────────────────

export function useEntityList<T>(
  config: EntityConfig,
  options?: { filter?: string; top?: number; enabled?: boolean },
): UseQueryResult<{ records: T[]; count?: number }> {
  return useQuery({
    queryKey: [config.entitySetName, "list", options?.filter, options?.top],
    queryFn: () => listRecords<T>(config, { filter: options?.filter, top: options?.top }),
    enabled: options?.enabled ?? true,
  });
}

// ─── Single record hook ─────────────────────────────────────────────────────

export function useEntityRecord<T>(
  config: EntityConfig,
  id: string | null,
): UseQueryResult<T> {
  return useQuery({
    queryKey: [config.entitySetName, "record", id],
    queryFn: () => getRecord<T>(config, id!),
    enabled: !!id,
  });
}

// ─── Create hook ────────────────────────────────────────────────────────────

export function useCreateEntity<T>(
  config: EntityConfig,
): UseMutationResult<T, Error, Record<string, unknown>> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createRecord<T>(config, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [config.entitySetName] });
      toast.success(`${config.displayName} created`);
    },
    onError: (err) => {
      toast.error(`Failed to create ${config.displayName}: ${err.message}`);
    },
  });
}

// ─── Update hook ────────────────────────────────────────────────────────────

export function useUpdateEntity(
  config: EntityConfig,
): UseMutationResult<void, Error, { id: string; data: Record<string, unknown> }> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateRecord(config, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [config.entitySetName] });
      toast.success(`${config.displayName} updated`);
    },
    onError: (err) => {
      toast.error(`Failed to update ${config.displayName}: ${err.message}`);
    },
  });
}

// ─── Delete hook ────────────────────────────────────────────────────────────

export function useDeleteEntity(
  config: EntityConfig,
): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecord(config, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [config.entitySetName] });
      toast.success(`${config.displayName} deleted`);
    },
    onError: (err) => {
      toast.error(`Failed to delete ${config.displayName}: ${err.message}`);
    },
  });
}

// ─── Lookup options hook ────────────────────────────────────────────────────

export function useLookupOptions(field: FieldConfig): UseQueryResult<LookupOption[]> {
  return useQuery({
    queryKey: ["lookup", field.lookupEntitySet, field.lookupKeyField, field.lookupDisplayField],
    queryFn: () =>
      fetchLookupOptions(field.lookupEntitySet!, field.lookupKeyField!, field.lookupDisplayField!),
    enabled: field.type === "lookup" && !!field.lookupEntitySet,
    staleTime: 5 * 60 * 1000,
  });
}
