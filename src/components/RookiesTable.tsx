"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RookieRow, useRookies } from "@/app/hooks/useRookies";
import { useAdminMode } from "@/app/hooks/useAdminMode";
import {
  ColumnHeaderInfo,
  DraftDataTable,
  heightSortingFn,
  PositionFilterColumn,
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

const POSITION_FILTER_COLUMNS: PositionFilterColumn[] = [
  { key: "qb", label: "QB" },
  { key: "blocker", label: "Blocker" },
  { key: "wr", label: "WR" },
  { key: "slot", label: "Slot" },
  { key: "rusher", label: "Rusher" },
  { key: "safety", label: "Safety" },
  { key: "corner", label: "Corner" },
  { key: "linebacker", label: "LB" },
];

export function RookiesTable() {
  const {
    rookies,
    isLoadingRookies,
    errorRookies,
    refetchRookies,
    updateRookie,
  } = useRookies();
  const { isAdmin } = useAdminMode();
  const queryClient = useQueryClient();

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
        meta: { displayName: "Compare" },
        enableSorting: false,
        cell: () => null,
      },
      {
        id: "favorite",
        header: () => (
          <ColumnHeaderInfo label="Fav" info="Mark as a favorite pick" />
        ),
        meta: { displayName: "Fav" },
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
        meta: { displayName: "Selected" },
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
        meta: { displayName: "Drafted" },
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
        meta: { displayName: "No" },
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
      { accessorKey: "height", header: "Height", sortingFn: heightSortingFn },
      { accessorKey: "jerseySize", header: "Jersey" },
      { accessorKey: "dateOfBirth", header: "DOB" },
      { accessorKey: "mobileNumber", header: "Mobile" },
      { accessorKey: "accountEmail", header: "Email" },
      { accessorKey: "pronouns", header: "Pronouns" },
      { accessorKey: "womens", header: "Womens+", cell: yesNoCell },
      { accessorKey: "totalScore", header: "Score" },
      { accessorKey: "speed", header: "Speed" },
      { accessorKey: "agility", header: "Agility" },
      { accessorKey: "handEyeCoordination", header: "Hand-Eye" },
      { accessorKey: "competitiveness", header: "Compete" },
      { accessorKey: "footballExperience", header: "FB Exp" },
      { accessorKey: "offensiveKnowledge", header: "Off Know" },
      { accessorKey: "defensiveKnowledge", header: "Def Know" },
      { accessorKey: "qb", header: "QB" },
      { accessorKey: "blocker", header: "Blocker" },
      { accessorKey: "wr", header: "WR" },
      { accessorKey: "slot", header: "Slot" },
      { accessorKey: "rusher", header: "Rusher" },
      { accessorKey: "safety", header: "Safety" },
      { accessorKey: "corner", header: "Corner" },
      { accessorKey: "linebacker", header: "LB" },
      { accessorKey: "offDefCaptainExperience", header: "Captain Exp" },
      { accessorKey: "offDefCaptainInterest", header: "Captain Interest" },
      { accessorKey: "socialCaptainInterest", header: "Social Captain", cell: yesNoCell },
      { accessorKey: "ngffl", header: "NGFFL", cell: yesNoCell },
      { accessorKey: "missingWeeks", header: "Missing Weeks", cell: yesNoCell },
      { accessorKey: "whichWeeks", header: "Which Weeks" },
      { accessorKey: "additionalContext", header: "Context" },
      { accessorKey: "otherExperience", header: "Other Exp" },
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
      positionFilterColumns={POSITION_FILTER_COLUMNS}
      rightActions={
        isAdmin ? (
          <UploadSpreadsheetDialog
            defaultTableType="players"
            compact
            onUploaded={() => {
              void queryClient.invalidateQueries({ queryKey: ["returningPlayers"] });
              void queryClient.invalidateQueries({ queryKey: ["rookies"] });
            }}
          />
        ) : null
      }
    />
  );
}
