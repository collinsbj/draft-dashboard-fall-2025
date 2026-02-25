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

type PositionKey =
  | "blocker"
  | "wr"
  | "slot"
  | "rusher"
  | "safety"
  | "corner"
  | "linebacker";

const positions: Array<{ label: string; key: PositionKey }> = [
  { label: "Blocker", key: "blocker" },
  { label: "Wide Receiver", key: "wr" },
  { label: "Slot Receiver", key: "slot" },
  { label: "Rusher", key: "rusher" },
  { label: "Safety", key: "safety" },
  { label: "Corner", key: "corner" },
  { label: "Linebacker", key: "linebacker" },
];

export function PositionSummaryPane() {
  const { returningPlayers, isLoadingReturningPlayers } = useReturningPlayers();
  const { rookies, isLoadingRookies } = useRookies();
  const selected = useMemo(
    () => [...returningPlayers, ...rookies].filter((player) => player.selected),
    [returningPlayers, rookies]
  );
  const isLoading = isLoadingReturningPlayers || isLoadingRookies;

  const getPositionCounts = (key: PositionKey) => {
    const preferred = selected.filter((player) => player[key] === "Preferred").length;
    const willing = selected.filter((player) => player[key] === "Willing").length;
    return { total: preferred + willing, preferred, willing };
  };

  const womenPlus = selected.filter((player) => player.womens).length;
  const defensiveCaptainCount = selected.filter((player) =>
    ["Both", "Defensive"].includes(player.offDefCaptainInterest ?? "")
  ).length;
  const socialCaptainCount = selected.filter((player) => player.socialCaptainInterest).length;

  return (
    <>
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Position Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="pt-1">
              <Skeleton className="h-40 w-full rounded-md" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Preferred</TableHead>
                  <TableHead>Willing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => {
                  const counts = getPositionCounts(position.key);
                  return (
                    <TableRow key={position.key}>
                      <TableCell>{position.label}</TableCell>
                      <TableCell>{counts.total}</TableCell>
                      <TableCell>{counts.preferred}</TableCell>
                      <TableCell>{counts.willing}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Team Composition</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="pt-1">
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Womens+</TableCell>
                  <TableCell>{womenPlus}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Defensive Captain</TableCell>
                  <TableCell>{defensiveCaptainCount}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Social Captain</TableCell>
                  <TableCell>{socialCaptainCount}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
