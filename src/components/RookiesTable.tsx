"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { RookieRow, useRookies } from "@/app/hooks/useRookies";
import { useAdminMode } from "@/app/hooks/useAdminMode";
import {
  ColumnHeaderInfo,
  DraftDataTable,
  heightSortingFn,
} from "@/components/DraftDataTable";
import { UploadSpreadsheetDialog } from "@/components/UploadSpreadsheetDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Star, X } from "lucide-react";

const yesNoCell = ({ getValue }: { getValue: () => unknown }) =>
  getValue() === true ? "Yes" : "No";

export function RookiesTable() {
  const {
    rookies,
    isLoadingRookies,
    errorRookies,
    refetchRookies,
    updateRookie,
  } = useRookies();
  const { isAdmin } = useAdminMode();

  const patchPlayer = useCallback(
    async (
      player: RookieRow,
      data: Partial<RookieRow>,
      undoData?: Partial<RookieRow>,
      toastLabel?: string,
    ) => {
      await updateRookie({ id: player.id, data });

      if (toastLabel) {
        toast.success(toastLabel, {
          action: undoData
            ? {
                label: "Undo",
                onClick: () => {
                  void updateRookie({ id: player.id, data: undoData });
                },
              }
            : undefined,
        });
      }
    },
    [updateRookie],
  );

  const columns = useMemo<ColumnDef<RookieRow>[]>(
    () => [
      {
        id: "__compare",
        header: () => (
          <ColumnHeaderInfo label="Cmp" info="Compare players side-by-side" />
        ),
        enableSorting: false,
        enableHiding: false,
        cell: () => null,
      },
      {
        id: "favorite",
        header: () => (
          <ColumnHeaderInfo label="Fav" info="Mark as a favorite pick" />
        ),
        cell: ({ row }) => {
          const player = row.original;
          return (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                patchPlayer(
                  player,
                  { favorite: !player.favorite },
                  { favorite: !!player.favorite },
                  `${player.displayName}'s favorite was updated.`,
                )
              }
              className={
                player.favorite ? "text-amber-500" : "text-muted-foreground"
              }
            >
              <Star className="size-4" />
            </Button>
          );
        },
      },
      {
        id: "selected",
        header: () => (
          <ColumnHeaderInfo label="Selected" info="You drafted this player" />
        ),
        cell: ({ row }) => {
          const player = row.original;
          const disabled = !!player.drafted;
          const checkbox = (
            <Checkbox
              checked={player.selected}
              disabled={disabled}
              onCheckedChange={() =>
                patchPlayer(
                  player,
                  { selected: !player.selected },
                  { selected: !!player.selected },
                  `${player.displayName}'s selected status was updated.`,
                )
              }
            />
          );
          if (!disabled) return checkbox;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{checkbox}</span>
              </TooltipTrigger>
              <TooltipContent>Undraft player first</TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: "drafted",
        header: () => (
          <ColumnHeaderInfo
            label="Drafted"
            info="Player was drafted by another team"
          />
        ),
        cell: ({ row }) => {
          const player = row.original;
          const disabled = !!player.selected;
          const checkbox = (
            <Checkbox
              checked={player.drafted}
              disabled={disabled}
              onCheckedChange={() =>
                patchPlayer(
                  player,
                  { drafted: !player.drafted },
                  { drafted: !!player.drafted },
                  `${player.displayName}'s drafted status was updated.`,
                )
              }
            />
          );
          if (!disabled) return checkbox;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{checkbox}</span>
              </TooltipTrigger>
              <TooltipContent>Unselect player first</TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: "rejected",
        header: () => (
          <ColumnHeaderInfo label="No" info="Player you don't want to draft" />
        ),
        cell: ({ row }) => {
          const player = row.original;
          return (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                patchPlayer(
                  player,
                  { rejected: !player.rejected },
                  { rejected: !!player.rejected },
                  `${player.displayName}'s No status was updated.`,
                )
              }
              className={
                player.rejected ? "text-red-500" : "text-muted-foreground"
              }
            >
              <X className="size-4" />
            </Button>
          );
        },
      },
      {
        id: "name",
        header: "Name",
        accessorFn: (row) => row.displayName,
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.displayName}</span>
        ),
      },
      { accessorKey: "bucket", header: "Bucket" },
      { accessorKey: "group", header: "Group" },
      { accessorKey: "height", header: "Height", sortingFn: heightSortingFn },
      { accessorKey: "jerseySize", header: "Jersey" },
      { accessorKey: "pronouns", header: "Pronouns" },
      { accessorKey: "womens", header: "Womens+", cell: yesNoCell },
      { accessorKey: "totalScore", header: "Score" },
      { accessorKey: "speed", header: "Speed" },
      { accessorKey: "agility", header: "Agility" },
      { accessorKey: "footballExperience", header: "FB Exp" },
      { accessorKey: "offensiveKnowledge", header: "Off Know" },
      { accessorKey: "defensiveKnowledge", header: "Def Know" },
      { accessorKey: "qb", header: "QB" },
      { accessorKey: "wr", header: "WR" },
      { accessorKey: "slot", header: "Slot" },
      { accessorKey: "rusher", header: "Rusher" },
      { accessorKey: "safety", header: "Safety" },
      { accessorKey: "corner", header: "Corner" },
      { accessorKey: "linebacker", header: "LB" },
    ],
    [patchPlayer],
  );

  return (
    <DraftDataTable
      tableId="rookies"
      title="Rookies"
      data={rookies}
      columns={columns}
      isLoading={isLoadingRookies}
      error={errorRookies}
      onRetry={() => void refetchRookies()}
      defaultHideDrafted
      defaultHideSelected
      defaultHideRejected
      rightActions={
        isAdmin ? (
          <UploadSpreadsheetDialog
            defaultTableType="rookies"
            compact
            onUploaded={() => void refetchRookies()}
          />
        ) : null
      }
    />
  );
}
