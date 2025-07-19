"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlayers } from "@/app/hooks/usePlayers";

type PositionKey =
  | "blocker"
  | "wr"
  | "slot"
  | "rusher"
  | "safety"
  | "corner"
  | "linebacker";

const positions: Array<{ position: string; key: PositionKey }> = [
  {
    position: "Blocker",
    key: "blocker",
  },
  {
    position: "Wide Receiver",
    key: "wr",
  },
  {
    position: "Slot Receiver",
    key: "slot",
  },
  {
    position: "Rusher",
    key: "rusher",
  },
  {
    position: "Safety",
    key: "safety",
  },
  {
    position: "Corner",
    key: "corner",
  },
  {
    position: "Linebacker",
    key: "linebacker",
  },
];

export function PositionSummaryPane() {
  const { selectedPlayers, isLoadingSelected } = usePlayers();

  const getPositionCounts = (key: PositionKey) => {
    const preferred = selectedPlayers.filter(
      (player) => player[key] === "Preferred"
    ).length;

    const willing = selectedPlayers.filter(
      (player) => player[key] === "Willing"
    ).length;

    return {
      total: preferred + willing,
      preferred,
      willing,
    };
  };

  const defensiveCaptainCount = selectedPlayers.filter(
    (player) =>
      player.offDefCaptainInterest === "Both" ||
      player.offDefCaptainInterest === "Defensive"
  ).length;

  const socialCaptainCount = selectedPlayers.filter(
    (player) => player.socialCaptainInterest
  ).length;

  const womensPlus =
    selectedPlayers.filter((player) => player.womens).length + 2;

  return (
    <Card className="h-100 overflow-y-auto">
      <CardHeader>
        <CardTitle>Position Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingSelected ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {positions.map((summary) => (
                  <TableRow key={summary.position}>
                    <TableCell>{summary.position}</TableCell>
                    <TableCell>
                      {getPositionCounts(summary.key).total}
                    </TableCell>
                    <TableCell>
                      {getPositionCounts(summary.key).preferred}
                    </TableCell>
                    <TableCell>
                      {getPositionCounts(summary.key).willing}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow>
                  <TableCell>Womens+</TableCell>
                  <TableCell>{womensPlus}</TableCell>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
