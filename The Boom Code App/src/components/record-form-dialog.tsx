import { useState, useEffect, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useLookupOptions } from "@/hooks/use-dataverse";
import type { EntityConfig, FieldConfig } from "@/types/entities";

// ─── Lookup Select ──────────────────────────────────────────────────────────

function LookupSelect({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  const { data: options, isLoading } = useLookupOptions(field);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? "Loading…" : `Select ${field.label}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__clear__">— None —</SelectItem>
        {options?.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Date Picker ────────────────────────────────────────────────────────────

function DateField({
  value,
  onChange,
  showTime,
}: {
  value: string;
  onChange: (v: string) => void;
  showTime?: boolean;
}) {
  const date = value ? parseISO(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, showTime ? "PPP p" : "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) onChange(d.toISOString());
            else onChange("");
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── Main form dialog ───────────────────────────────────────────────────────

interface RecordFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: EntityConfig;
  /** Existing record data for edit mode, null for create */
  record: Record<string, unknown> | null;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending?: boolean;
}

export function RecordFormDialog({
  open,
  onOpenChange,
  config,
  record,
  onSubmit,
  isPending,
}: RecordFormDialogProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const isEditing = !!record;

  // Seed form when opening
  useEffect(() => {
    if (!open) return;
    const seed: Record<string, string> = {};
    for (const field of config.fields) {
      if (record) {
        if (field.type === "lookup") {
          seed[field.name] = (record[field.readName ?? ""] as string) ?? "";
        } else {
          seed[field.name] = String(record[field.name] ?? "");
        }
      } else {
        seed[field.name] = "";
      }
    }
    setFormData(seed);
  }, [open, record, config.fields]);

  function handleChange(name: string, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Build OData payload
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      const raw = formData[field.name];

      if (field.type === "lookup") {
        if (raw && raw !== "__clear__") {
          // Bind syntax: "field@odata.bind": "/entitySet(guid)"
          payload[`${field.name}@odata.bind`] = `${field.bindPath}(${raw})`;
        } else {
          // Unbind – set navigation property to null
          payload[`${field.name}@odata.bind`] = null;
        }
        continue;
      }

      if (field.type === "optionset" || field.type === "number") {
        payload[field.name] = raw ? Number(raw) : null;
        continue;
      }

      if (field.type === "date" || field.type === "datetime") {
        payload[field.name] = raw || null;
        continue;
      }

      payload[field.name] = raw || null;
    }

    onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${config.displayName}` : `New ${config.displayName}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {config.fields.map((field) => (
            <div key={field.name} className="grid gap-1.5">
              <Label htmlFor={field.name}>
                {field.label}
                {field.isRequired && <span className="text-destructive ml-0.5">*</span>}
              </Label>

              {field.type === "text" && (
                <Input
                  id={field.name}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.isRequired}
                />
              )}

              {field.type === "textarea" && (
                <Textarea
                  id={field.name}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  rows={4}
                />
              )}

              {field.type === "number" && (
                <Input
                  id={field.name}
                  type="number"
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {(field.type === "date" || field.type === "datetime") && (
                <DateField
                  value={formData[field.name] ?? ""}
                  onChange={(v) => handleChange(field.name, v)}
                  showTime={field.type === "datetime"}
                />
              )}

              {field.type === "optionset" && (
                <Select
                  value={formData[field.name] ?? ""}
                  onValueChange={(v) => handleChange(field.name, v === "__clear__" ? "" : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__clear__">— None —</SelectItem>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === "lookup" && (
                <LookupSelect
                  field={field}
                  value={formData[field.name] ?? ""}
                  onChange={(v) => handleChange(field.name, v === "__clear__" ? "" : v)}
                />
              )}
            </div>
          ))}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
