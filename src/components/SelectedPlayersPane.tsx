"use client";

import { useMemo } from "react";
import { useReturningPlayers } from "@/app/hooks/useReturningPlayers";
import { useRookies } from "@/app/hooks/useRookies";
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

export function SelectedPlayersPane() {
  const { returningPlayers, isLoadingReturningPlayers } = useReturningPlayers();
  const { rookies, isLoadingRookies } = useRookies();

  const selected = useMemo(
    () =>
      [
        ...returningPlayers.map((player) => ({ ...player, sourceType: "Returning" as const })),
        ...rookies.map((player) => ({ ...player, sourceType: "Rookie" as const })),
      ]
        .filter((player) => player.selected)
        .sort((a, b) => a.firstName.localeCompare(b.firstName)),
    [returningPlayers, rookies]
  );

  const isLoading = isLoadingReturningPlayers || isLoadingRookies;

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
          <p className="text-sm text-muted-foreground">No players selected yet.</p>
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
                <TableRow key={`${player.firstName}-${player.lastName}`}>
                  <TableCell className="font-medium">
                    {player.firstName} {player.lastName}
                  </TableCell>
                  <TableCell>{player.sourceType}</TableCell>
                  <TableCell>{player.totalScore ?? "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[player.qb, player.wr, player.slot, player.rusher]
                      .filter(Boolean)
                      .join(" • ")}
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
