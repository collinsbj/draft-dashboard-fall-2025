"use client";

import { useMemo } from "react";
import { useReturningPlayers } from "@/app/hooks/useReturningPlayers";
import { useRookies } from "@/app/hooks/useRookies";
import { useQbs } from "@/app/hooks/useQbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SelectedEntry = {
  displayName: string;
  sourceType: "Returning" | "Rookie" | "QB";
  selected: boolean;
  totalScore: number | null;
  blocker: string | null;
  wr: string | null;
  slot: string | null;
  rusher: string | null;
  safety: string | null;
  corner: string | null;
  linebacker: string | null;
};

const POSITION_FIELDS: Array<{ key: keyof SelectedEntry; label: string }> = [
  { key: "blocker", label: "Blocker" },
  { key: "wr", label: "WR" },
  { key: "slot", label: "Slot" },
  { key: "rusher", label: "Rusher" },
  { key: "safety", label: "Safety" },
  { key: "corner", label: "Corner" },
  { key: "linebacker", label: "LB" },
];

function formatPositions(player: SelectedEntry): string {
  return POSITION_FIELDS.filter((pos) => {
    const val = player[pos.key];
    return val === "Preferred" || val === "Willing";
  })
    .map((pos) => {
      const tag = player[pos.key] === "Preferred" ? "P" : "W";
      return `${pos.label} (${tag})`;
    })
    .join(" • ");
}

export function SelectedPlayersPane() {
  const { returningPlayers, isLoadingReturningPlayers } = useReturningPlayers();
  const { rookies, isLoadingRookies } = useRookies();
  const { qbs, isLoadingQbs } = useQbs();

  const selected = useMemo(() => {
    const entries: SelectedEntry[] = [
      ...returningPlayers.map((player) => ({
        ...player,
        sourceType: "Returning" as const,
      })),
      ...rookies.map((player) => ({
        ...player,
        sourceType: "Rookie" as const,
      })),
    ].filter((player) => player.selected);

    const selectedQb = qbs.find((q) => q.selected);
    if (selectedQb) {
      entries.push({
        displayName: selectedQb.displayName,
        sourceType: "QB",
        selected: true,
        totalScore: selectedQb.totalScore ?? null,
        blocker: selectedQb.blocker ?? null,
        wr: selectedQb.wr ?? null,
        slot: selectedQb.slot ?? null,
        rusher: selectedQb.rusher ?? null,
        safety: selectedQb.safety ?? null,
        corner: selectedQb.corner ?? null,
        linebacker: selectedQb.linebacker ?? null,
      });
    }

    return entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [returningPlayers, rookies, qbs]);

  const isLoading = isLoadingReturningPlayers || isLoadingRookies || isLoadingQbs;

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Selected Players</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[45vh] overflow-auto">
        {isLoading ? (
          <div className="pt-1">
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ) : selected.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No players selected yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Positions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selected.map((player) => (
                <TableRow key={player.displayName}>
                  <TableCell className="font-medium">
                    {player.displayName}
                  </TableCell>
                  <TableCell>{player.sourceType}</TableCell>
                  <TableCell>{player.totalScore ?? "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatPositions(player) || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
