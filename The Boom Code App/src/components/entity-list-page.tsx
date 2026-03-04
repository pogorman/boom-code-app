import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { RecordFormDialog } from "@/components/record-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import {
  useEntityList,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
} from "@/hooks/use-dataverse";
import type { EntityConfig, FieldConfig } from "@/types/entities";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCellValue(
  record: Record<string, unknown>,
  field: FieldConfig,
): React.ReactNode {
  // Lookups – show formatted display value
  if (field.type === "lookup") {
    const display = record[field.formattedValueKey ?? ""] as string | undefined;
    return display ?? "—";
  }

  // Option sets – show badge with label
  if (field.type === "optionset") {
    const val = record[field.name] as number | undefined;
    if (val === undefined || val === null) return "—";
    const opt = field.options?.find((o) => o.value === val);
    return opt ? <Badge variant="secondary">{opt.label}</Badge> : String(val);
  }

  // Dates
  if (field.type === "date" || field.type === "datetime") {
    const raw = record[field.name] as string | undefined;
    if (!raw) return "—";
    try {
      return format(parseISO(raw), field.type === "datetime" ? "PPP p" : "PPP");
    } catch {
      return raw;
    }
  }

  // Numbers
  if (field.type === "number") {
    const val = record[field.name] as number | undefined;
    if (val === undefined || val === null) return "—";
    return val.toLocaleString();
  }

  // Text / textarea
  const val = record[field.name] as string | undefined;
  if (!val) return "—";
  // Truncate long text in table
  return val.length > 80 ? `${val.slice(0, 80)}…` : val;
}

// ─── Loading skeleton ───────────────────────────────────────────────────────

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns + 1 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

interface EntityListPageProps {
  config: EntityConfig;
}

export function EntityListPage({ config }: EntityListPageProps) {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);

  // Build OData filter from search
  const filter = useMemo(() => {
    if (!search.trim()) return undefined;
    return `contains(${config.primaryNameField},'${search.trim().replace(/'/g, "''")}')`;
  }, [search, config.primaryNameField]);

  const { data, isLoading, isError, error } = useEntityList<Record<string, unknown>>(config, {
    filter,
  });
  const createMutation = useCreateEntity(config);
  const updateMutation = useUpdateEntity(config);
  const deleteMutation = useDeleteEntity(config);

  const tableFields = config.fields.filter((f) => f.showInTable);

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleCreate() {
    setEditingRecord(null);
    setFormOpen(true);
  }

  function handleEdit(record: Record<string, unknown>) {
    setEditingRecord(record);
    setFormOpen(true);
  }

  function handleFormSubmit(payload: Record<string, unknown>) {
    if (editingRecord) {
      const id = editingRecord[config.primaryKey] as string;
      updateMutation.mutate(
        { id, data: payload },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setFormOpen(false),
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const id = deleteTarget[config.primaryKey] as string;
    deleteMutation.mutate(id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{config.displayNamePlural}</h1>
          {data?.count !== undefined && (
            <p className="text-sm text-muted-foreground">{data.count} record{data.count !== 1 ? "s" : ""}</p>
          )}
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New {config.displayName}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${config.displayNamePlural.toLowerCase()}…`}
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error?.message ?? "Failed to load records"}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {tableFields.map((f) => (
                <TableHead key={f.name} style={f.width ? { width: f.width } : undefined}>
                  {f.label}
                </TableHead>
              ))}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={tableFields.length} />
            ) : data?.records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableFields.length + 1} className="text-center py-8 text-muted-foreground">
                  No {config.displayNamePlural.toLowerCase()} found
                </TableCell>
              </TableRow>
            ) : (
              data?.records.map((record) => (
                <TableRow key={record[config.primaryKey] as string}>
                  {tableFields.map((f) => (
                    <TableCell key={f.name}>{formatCellValue(record, f)}</TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(record)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(record)}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit dialog */}
      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        config={config}
        record={editingRecord}
        onSubmit={handleFormSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        entityName={config.displayName}
        recordName={deleteTarget?.[config.primaryNameField] as string | undefined}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
