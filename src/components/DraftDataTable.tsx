"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  ColumnPinningState,
  ColumnOrderState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Columns3,
  GripVertical,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DraftTableRow = {
  id: number;
  firstName: string;
  lastName: string;
  drafted?: boolean;
  rejected?: boolean;
  [key: string]: unknown;
};

type DraftDataTableProps<T extends DraftTableRow> = {
  tableId: string;
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  error: unknown;
  onRetry?: () => void;
  onRowReorder?: (updates: Array<{ id: number; sortOrder: number }>) => Promise<void>;
  stickyTopOffsetClassName?: string;
  defaultHideDrafted?: boolean;
  defaultHideRejected?: boolean;
  draftTotal?: number;
  rightActions?: React.ReactNode;
};

const CONTROL_COLUMN_IDS = new Set(["__drag", "__compare"]);
const COMPARE_EXCLUDED_IDS = new Set(["__drag", "__compare", "drafted", "selected", "name"]);
const STORAGE_KEY_PREFIX = "dglffl-table:";

type SortableHeaderProps = {
  id: string;
  children: React.ReactNode;
};

function SortableHeader({ id, children }: SortableHeaderProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex w-full items-center",
        isDragging && "opacity-60",
        !CONTROL_COLUMN_IDS.has(id) && "cursor-grab active:cursor-grabbing"
      )}
      {...(!CONTROL_COLUMN_IDS.has(id) ? { ...attributes, ...listeners } : {})}
    >
      {children}
    </div>
  );
}

type SortableRowProps = {
  id: string;
  children: (dragListeners: ReturnType<typeof useSortable>) => React.ReactNode;
};

function SortableRow({ id, children }: SortableRowProps) {
  const sortable = useSortable({ id });
  const { setNodeRef, transform, transition, isDragging } = sortable;

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "border-b border-border/60 transition-colors hover:bg-muted/50",
        isDragging && "opacity-60"
      )}
    >
      {children(sortable)}
    </TableRow>
  );
}

export function DraftDataTable<T extends DraftTableRow>({
  tableId,
  title,
  data,
  columns,
  isLoading,
  error,
  onRetry,
  onRowReorder,
  stickyTopOffsetClassName = "top-0",
  defaultHideDrafted = false,
  defaultHideRejected = false,
  draftTotal,
  rightActions,
}: DraftDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["name"],
  });
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [hideDrafted, setHideDrafted] = useState(defaultHideDrafted);
  const [hideRejected, setHideRejected] = useState(defaultHideRejected);
  const [searchValue, setSearchValue] = useState("");
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [orderedRows, setOrderedRows] = useState<T[]>(data);

  const columnStorageKey = `${STORAGE_KEY_PREFIX}${tableId}:columnOrder`;
  const visibilityStorageKey = `${STORAGE_KEY_PREFIX}${tableId}:columnVisibility`;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    setOrderedRows(data);
  }, [data]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawColumnOrder = window.localStorage.getItem(columnStorageKey);
    const rawVisibility = window.localStorage.getItem(visibilityStorageKey);
    if (rawColumnOrder) {
      setColumnOrder(JSON.parse(rawColumnOrder));
    }
    if (rawVisibility) {
      setColumnVisibility(JSON.parse(rawVisibility));
    }
  }, [columnStorageKey, visibilityStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(columnStorageKey, JSON.stringify(columnOrder));
  }, [columnOrder, columnStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(visibilityStorageKey, JSON.stringify(columnVisibility));
  }, [columnVisibility, visibilityStorageKey]);

  const filteredRows = useMemo(() => {
    const needle = searchValue.trim().toLowerCase();
    return orderedRows.filter((row) => {
      if (hideDrafted && row.drafted) return false;
      if (hideRejected && row.rejected) return false;

      if (!needle) return true;
      const fullName = `${row.firstName} ${row.lastName}`.toLowerCase();
      return fullName.includes(needle);
    });
  }, [orderedRows, hideDrafted, hideRejected, searchValue]);

  const draftedCount = data.filter((row) => Boolean(row.drafted)).length;
  const totalDraftSlots = draftTotal ?? data.length;
  const progressPct = totalDraftSlots
    ? Math.round((draftedCount / totalDraftSlots) * 100)
    : 0;

  const compareRows = useMemo(
    () => filteredRows.filter((row) => compareIds.includes(row.id)).slice(0, 3),
    [filteredRows, compareIds]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getRowId: (row) => String(row.id),
    state: { sorting, columnOrder, columnVisibility, columnPinning },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const comparisonColumns = useMemo(
    () =>
      table
        .getAllLeafColumns()
        .filter((column) => !COMPARE_EXCLUDED_IDS.has(column.id))
        .map((column) => ({
          id: column.id,
          label: typeof column.columnDef.header === "string" ? column.columnDef.header : column.id,
          getValue: (row: T) => {
            const { accessorFn, accessorKey } = column.columnDef;
            if (typeof accessorFn === "function") {
              return accessorFn(row, 0);
            }
            if (typeof accessorKey === "string") {
              return row[accessorKey];
            }
            return row[column.id];
          },
        })),
    [table]
  );

  const visibleColumnIds = table.getVisibleLeafColumns().map((column) => column.id);

  const hasRejectedColumn = data.some((row) => typeof row.rejected === "boolean");
  const hasDraftedColumn = data.some((row) => typeof row.drafted === "boolean");
  const canRowReorder = Boolean(onRowReorder) && sorting.length === 0;

  const handleResetFilters = () => {
    setSearchValue("");
    setHideDrafted(defaultHideDrafted);
    setHideRejected(defaultHideRejected);
    setSorting([]);
  };

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setColumnOrder((current) => {
      const oldIndex = current.length
        ? current.indexOf(String(active.id))
        : visibleColumnIds.indexOf(String(active.id));
      const newIndex = current.length
        ? current.indexOf(String(over.id))
        : visibleColumnIds.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return current;
      const base = current.length ? current : visibleColumnIds;
      return arrayMove(base, oldIndex, newIndex);
    });
  };

  const handleRowDragEnd = async (event: DragEndEvent) => {
    if (!canRowReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredRows.findIndex((row) => String(row.id) === String(active.id));
    const newIndex = filteredRows.findIndex((row) => String(row.id) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(filteredRows, oldIndex, newIndex);
    const updates = reordered.map((row, index) => ({ id: row.id, sortOrder: index }));

    // Keep row order optimistic in the UI before server sync.
    const nextMap = new Map(reordered.map((row, index) => [row.id, index]));
    setOrderedRows((current) =>
      [...current].sort((a, b) => (nextMap.get(a.id) ?? 0) - (nextMap.get(b.id) ?? 0))
    );

    await onRowReorder?.(updates);
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="space-y-0 p-0">
          <div
            className={cn(
              "sticky z-30 border-b border-border/70 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/70",
              stickyTopOffsetClassName
            )}
          >
            <Skeleton className="mb-3 h-6 w-48" />
            <Skeleton className="h-9 w-full max-w-[720px]" />
          </div>

          <div className="min-h-[420px] p-4">
            <Skeleton className="h-[360px] w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 p-4 text-center">
          <p className="text-sm text-muted-foreground">Unable to load data.</p>
          {onRetry ? (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 size-4" />
              Retry
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardContent className="space-y-0 p-0">
        <div
          className={cn(
            "sticky z-30 border-b border-border/70 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/70",
            stickyTopOffsetClassName
          )}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {hasDraftedColumn ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Draft progress: {draftedCount}/{totalDraftSlots} ({progressPct}%)
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">{rightActions}</div>
          </div>

          {hasDraftedColumn ? (
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-60 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search players..."
                className="h-9 rounded-none border-x-0 border-t-0 border-b border-border bg-transparent pl-8 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-b-foreground"
              />
            </div>

            {hasDraftedColumn ? (
              <Button
                variant={hideDrafted ? "default" : "outline"}
                size="sm"
                onClick={() => setHideDrafted((value) => !value)}
              >
                {hideDrafted ? "Showing Available" : "Showing All"}
              </Button>
            ) : null}

            {hasRejectedColumn ? (
              <Button
                variant={hideRejected ? "default" : "outline"}
                size="sm"
                onClick={() => setHideRejected((value) => !value)}
              >
                {hideRejected ? "No-Tagged Hidden" : "No-Tagged Visible"}
              </Button>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="mr-2 size-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-80 overflow-auto">
                {table
                  .getAllLeafColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}
                    >
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              <RotateCcw className="mr-2 size-4" />
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={compareIds.length < 2}
              onClick={() => setIsCompareOpen(true)}
            >
              <Scale className="mr-2 size-4" />
              Compare ({compareIds.length})
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleColumnDragEnd}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleRowDragEnd}
            >
              <Table>
                <TableHeader className="sticky top-[calc(var(--spacing)*0)] z-20 bg-background/95">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-b border-border/80">
                      <SortableContext
                        items={visibleColumnIds}
                        strategy={horizontalListSortingStrategy}
                      >
                        {headerGroup.headers.map((header) => {
                          const sortDirection = header.column.getIsSorted();
                          return (
                            <TableHead
                              key={header.id}
                              className={cn(
                                "whitespace-nowrap",
                                header.column.getIsPinned() && "sticky z-10 bg-background/95"
                              )}
                              style={
                                header.column.getIsPinned()
                                  ? { left: `${header.column.getStart("left")}px` }
                                  : undefined
                              }
                            >
                              <SortableHeader id={header.column.id}>
                                {header.isPlaceholder ? null : (
                                  <Button
                                    variant="ghost"
                                    className="h-8 px-0 text-xs font-semibold hover:bg-transparent"
                                    onClick={() => header.column.toggleSorting(sortDirection === "asc")}
                                  >
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                    {sortDirection === "asc" ? (
                                      <ArrowUp className="ml-1 size-3.5" />
                                    ) : sortDirection === "desc" ? (
                                      <ArrowDown className="ml-1 size-3.5" />
                                    ) : (
                                      <ArrowUpDown className="ml-1 size-3.5 text-muted-foreground" />
                                    )}
                                  </Button>
                                )}
                              </SortableHeader>
                            </TableHead>
                          );
                        })}
                      </SortableContext>
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  <SortableContext
                    items={table.getRowModel().rows.map((row) => String(row.original.id))}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <SortableRow key={row.id} id={String(row.original.id)}>
                        {(sortable) =>
                          row.getVisibleCells().map((cell) => {
                            if (cell.column.id === "__drag") {
                              return (
                                <TableCell
                                  key={cell.id}
                                  className={cn(
                                    "w-9 align-top",
                                    Boolean((row.original as Record<string, unknown>).favorite) &&
                                      "bg-amber-500/10",
                                    row.original.drafted && "bg-muted/30",
                                    row.original.rejected && "bg-destructive/5"
                                  )}
                                >
                                  <button
                                    type="button"
                                    className={cn(
                                      "mt-1 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted",
                                      !canRowReorder && "opacity-40"
                                    )}
                                    disabled={!canRowReorder}
                                    aria-label="Drag row"
                                    {...sortable.attributes}
                                    {...sortable.listeners}
                                  >
                                    <GripVertical className="size-4" />
                                  </button>
                                </TableCell>
                              );
                            }

                            if (cell.column.id === "__compare") {
                              const checked = compareIds.includes(row.original.id);
                              return (
                                <TableCell
                                  key={cell.id}
                                  className={cn(
                                    "align-top",
                                    Boolean((row.original as Record<string, unknown>).favorite) &&
                                      "bg-amber-500/10",
                                    row.original.drafted && "bg-muted/30",
                                    row.original.rejected && "bg-destructive/5"
                                  )}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(nextChecked) => {
                                      setCompareIds((current) => {
                                        const set = new Set(current);
                                        if (nextChecked) set.add(row.original.id);
                                        else set.delete(row.original.id);
                                        return Array.from(set).slice(0, 3);
                                      });
                                    }}
                                    aria-label={`Select ${row.original.firstName} ${row.original.lastName} for comparison`}
                                  />
                                </TableCell>
                              );
                            }

                            return (
                              <TableCell
                                key={cell.id}
                                className={cn(
                                  "align-top",
                                  cell.column.getIsPinned() && "sticky z-10 bg-card/95",
                                  Boolean((row.original as Record<string, unknown>).favorite) &&
                                    "bg-amber-500/10",
                                  row.original.drafted && "bg-muted/30",
                                  row.original.rejected && "bg-destructive/5"
                                )}
                                style={
                                  cell.column.getIsPinned()
                                    ? { left: `${cell.column.getStart("left")}px` }
                                    : undefined
                                }
                              >
                                {(() => {
                                  const rendered = flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  );
                                  if (typeof rendered === "boolean") {
                                    return rendered ? "Yes" : "No";
                                  }
                                  return rendered;
                                })()}
                              </TableCell>
                            );
                          })
                        }
                      </SortableRow>
                    ))}
                    {table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={table.getVisibleLeafColumns().length || 1}
                          className="h-36 text-center align-middle"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">No players to display</p>
                            <p className="text-sm text-muted-foreground">
                              Try resetting search and filters.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </DndContext>
        </div>
      </CardContent>

      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent style={{ width: 'fit-content' }} className="max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-4rem)] max-h-[calc(100vh-4rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Player Comparison</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  {compareRows.map((row) => (
                    <TableHead key={row.id}>
                      {row.firstName} {row.lastName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonColumns.map((column) => (
                  <TableRow key={column.id}>
                    <TableCell className="font-medium">{column.label}</TableCell>
                    {compareRows.map((row) => (
                      <TableCell key={`${row.id}-${column.id}`}>
                        {(() => {
                          const value = column.getValue(row);
                          if (typeof value === "boolean") {
                            return value ? "Yes" : "No";
                          }
                          return String(value ?? "-");
                        })()}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
