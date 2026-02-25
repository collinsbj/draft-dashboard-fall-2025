"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Qb } from "@/generated/prisma/client";
import { useQbs } from "@/app/hooks/useQbs";
import { DraftDataTable } from "@/components/DraftDataTable";
import { UploadSpreadsheetDialog } from "@/components/UploadSpreadsheetDialog";
import { Checkbox } from "@/components/ui/checkbox";

const yesNoCell = ({ getValue }: { getValue: () => unknown }) =>
  getValue() === true ? "Yes" : "No";

export function QbDraftTable() {
  const { qbs, isLoadingQbs, errorQbs, refetchQbs, updateQb, reorderQbs } = useQbs();

  const patchQb = useCallback(
    async (
      player: Qb,
      data: Partial<Qb>,
      undoData?: Partial<Qb>,
      toastLabel?: string
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
    [updateQb]
  );

  const columns = useMemo<ColumnDef<Qb>[]>(
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
        header: "Cmp",
        enableSorting: false,
        enableHiding: false,
        cell: () => null,
      },
      {
        id: "drafted",
        header: "Drafted",
        cell: ({ row }) => {
          const player = row.original;
          return (
            <Checkbox
              checked={player.drafted}
              onCheckedChange={() =>
                patchQb(
                  player,
                  { drafted: !player.drafted },
                  { drafted: !!player.drafted },
                  `${player.firstName}'s drafted status was updated.`
                )
              }
            />
          );
        },
      },
      {
        id: "selected",
        header: "Selected",
        cell: ({ row }) => {
          const player = row.original;
          return (
            <Checkbox
              checked={player.selected}
              onCheckedChange={() =>
                patchQb(
                  player,
                  { selected: !player.selected },
                  { selected: !!player.selected },
                  `${player.firstName}'s selected status was updated.`
                )
              }
            />
          );
        },
      },
      {
        id: "name",
        header: "Name",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        cell: ({ row }) => (
          <span className="font-semibold">
            {row.original.firstName} {row.original.lastName}
          </span>
        ),
      },
      { accessorKey: "height", header: "Height" },
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
      { accessorKey: "socialCaptainInterest", header: "Social Capt", cell: yesNoCell },
      { accessorKey: "returningMember", header: "Returning", cell: yesNoCell },
      { accessorKey: "ngffl", header: "NGFFL", cell: yesNoCell },
      { accessorKey: "summitMhcInterest", header: "Summit/MHC", cell: yesNoCell },
      { accessorKey: "missingWeeks", header: "Missing Weeks?", cell: yesNoCell },
      { accessorKey: "whichWeeks", header: "Which Weeks" },
      { accessorKey: "additionalContext", header: "Additional Context" },
      { accessorKey: "otherExperience", header: "Other Experience" },
    ],
    [patchQb]
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
      rightActions={
        <UploadSpreadsheetDialog
          defaultTableType="qbs"
          compact
          onUploaded={() => void refetchQbs()}
        />
      }
    />
  );
}
