"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { QbRow, useQbs } from "@/app/hooks/useQbs";
import { useAdminMode } from "@/app/hooks/useAdminMode";
import {
  ColumnHeaderInfo,
  DraftDataTable,
  heightSortingFn,
} from "@/components/DraftDataTable";
import { UploadSpreadsheetDialog } from "@/components/UploadSpreadsheetDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const yesNoCell = ({ getValue }: { getValue: () => unknown }) =>
  getValue() === true ? "Yes" : "No";

export function QbDraftTable() {
  const { qbs, isLoadingQbs, errorQbs, refetchQbs, updateQb, reorderQbs } =
    useQbs();
  const { isAdmin } = useAdminMode();

  const patchQb = useCallback(
    async (
      player: QbRow,
      data: Partial<QbRow>,
      undoData?: Partial<QbRow>,
      toastLabel?: string,
    ) => {
      await updateQb({ id: player.id, data });

      if (toastLabel) {
        toast.success(toastLabel, {
          action: undoData
            ? {
                label: "Undo",
                onClick: () => {
                  void updateQb({ id: player.id, data: undoData });
                },
              }
            : undefined,
        });
      }
    },
    [updateQb],
  );

  const selectedQb = qbs.find((q) => q.selected);

  const columns = useMemo<ColumnDef<QbRow>[]>(
    () => [
      {
        id: "__drag",
        header: "",
        enableSorting: false,
        enableHiding: false,
        cell: () => null,
      },
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
                patchQb(
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
        id: "selected",
        header: () => (
          <ColumnHeaderInfo label="Selected" info="You drafted this player" />
        ),
        meta: { displayName: "Selected" },
        cell: ({ row }) => {
          const player = row.original;
          const otherSelected = selectedQb && selectedQb.id !== player.id;
          const disabled = !!player.drafted || !!otherSelected;
          const tooltipMsg = player.drafted
            ? "Undraft player first"
            : `${selectedQb?.displayName} is already selected`;
          const checkbox = (
            <Checkbox
              checked={player.selected}
              disabled={disabled}
              onCheckedChange={() =>
                patchQb(
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
              <TooltipContent>{tooltipMsg}</TooltipContent>
            </Tooltip>
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
      { accessorKey: "pronouns", header: "Pronouns" },
      { accessorKey: "womens", header: "Womens+", cell: yesNoCell },
      { accessorKey: "totalScore", header: "Score" },
      { accessorKey: "speed", header: "Speed" },
      { accessorKey: "agility", header: "Agility" },
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
      { accessorKey: "offDefCaptainExperience", header: "Cap Exp" },
      { accessorKey: "offDefCaptainInterest", header: "Cap Interest" },
      {
        accessorKey: "socialCaptainInterest",
        header: "Social Capt",
        cell: yesNoCell,
      },
      { accessorKey: "returningMember", header: "Returning", cell: yesNoCell },
      { accessorKey: "ngffl", header: "NGFFL", cell: yesNoCell },
      {
        accessorKey: "summitMhcInterest",
        header: "Summit/MHC",
        cell: yesNoCell,
      },
      {
        accessorKey: "missingWeeks",
        header: "Missing Weeks?",
        cell: yesNoCell,
      },
      { accessorKey: "whichWeeks", header: "Which Weeks" },
      { accessorKey: "additionalContext", header: "Additional Context" },
      { accessorKey: "otherExperience", header: "Other Experience" },
    ],
    [patchQb, selectedQb],
  );

  return (
    <DraftDataTable
      tableId="qbs"
      title="QB Draft Board"
      data={qbs}
      columns={columns}
      isLoading={isLoadingQbs}
      error={errorQbs}
      onRetry={() => void refetchQbs()}
      onRowReorder={reorderQbs}
      draftTotal={20}
      defaultHideDrafted
      rightActions={
        isAdmin ? (
          <UploadSpreadsheetDialog
            defaultTableType="qbs"
            compact
            onUploaded={() => void refetchQbs()}
          />
        ) : null
      }
    />
  );
}
