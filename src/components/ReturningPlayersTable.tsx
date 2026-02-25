"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { ReturningPlayer } from "@/generated/prisma/client";
import { useReturningPlayers } from "@/app/hooks/useReturningPlayers";
import { DraftDataTable } from "@/components/DraftDataTable";
import { UploadSpreadsheetDialog } from "@/components/UploadSpreadsheetDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, X } from "lucide-react";

const yesNoCell = ({ getValue }: { getValue: () => unknown }) =>
  getValue() === true ? "Yes" : "No";

export function ReturningPlayersTable() {
  const {
    returningPlayers,
    isLoadingReturningPlayers,
    errorReturningPlayers,
    refetchReturningPlayers,
    updateReturningPlayer,
  } = useReturningPlayers();

  const patchPlayer = useCallback(
    async (
      player: ReturningPlayer,
      data: Partial<ReturningPlayer>,
      undoData?: Partial<ReturningPlayer>,
      toastLabel?: string
    ) => {
      await updateReturningPlayer({ id: player.id, data });

      if (toastLabel) {
        toast.success(toastLabel, {
          action: undoData
            ? {
                label: "Undo",
                onClick: () => {
                  void updateReturningPlayer({ id: player.id, data: undoData });
                },
              }
            : undefined,
        });
      }
    },
    [updateReturningPlayer]
  );

  const columns = useMemo<ColumnDef<ReturningPlayer>[]>(
    () => [
      {
        id: "__compare",
        header: "Cmp",
        enableSorting: false,
        enableHiding: false,
        cell: () => null,
      },
      {
        id: "favorite",
        header: "Fav",
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
                  `${player.firstName}'s favorite was updated.`
                )
              }
              className={player.favorite ? "text-amber-500" : "text-muted-foreground"}
            >
              <Star className="size-4" />
            </Button>
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
                patchPlayer(
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
        id: "drafted",
        header: "Drafted",
        cell: ({ row }) => {
          const player = row.original;
          return (
            <Checkbox
              checked={player.drafted}
              onCheckedChange={() =>
                patchPlayer(
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
        id: "rejected",
        header: "No",
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
                  `${player.firstName}'s No status was updated.`
                )
              }
              className={player.rejected ? "text-red-500" : "text-muted-foreground"}
            >
              <X className="size-4" />
            </Button>
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
      { accessorKey: "bucket", header: "Bucket" },
      { accessorKey: "group", header: "Group" },
      { accessorKey: "height", header: "Height" },
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
    [patchPlayer]
  );

  return (
    <DraftDataTable
      tableId="returning-players"
      title="Returning Players"
      data={returningPlayers}
      columns={columns}
      isLoading={isLoadingReturningPlayers}
      error={errorReturningPlayers}
      onRetry={() => void refetchReturningPlayers()}
      defaultHideDrafted
      defaultHideRejected
      rightActions={
        <UploadSpreadsheetDialog
          defaultTableType="returningPlayers"
          compact
          onUploaded={() => void refetchReturningPlayers()}
        />
      }
    />
  );
}
