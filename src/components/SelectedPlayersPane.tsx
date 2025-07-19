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

export function SelectedPlayersPane() {
  const { selectedPlayers, isLoadingSelected } = usePlayers();

  return (
    <Card className="h-100 overflow-y-auto">
      <CardHeader>
        <CardTitle>Selected Players</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingSelected ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : selectedPlayers.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">No players selected</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Height</TableHead>
                  <TableHead>Jersey Size</TableHead>
                  <TableHead>Pronouns</TableHead>
                  <TableHead>Womens+</TableHead>
                  <TableHead>Off/Def Capt Experience</TableHead>
                  <TableHead>Off/Def Capt Interest</TableHead>
                  <TableHead>Social Capt Interest</TableHead>
                  <TableHead>NGFFL Exp</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Agility</TableHead>
                  <TableHead>Hand Eye Coordination</TableHead>
                  <TableHead>Competitiveness</TableHead>
                  <TableHead>Football Exp</TableHead>
                  <TableHead>Off Knowledge</TableHead>
                  <TableHead>Def Knowledge</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>QB</TableHead>
                  <TableHead>Blocker</TableHead>
                  <TableHead>WR</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Rusher</TableHead>
                  <TableHead>Safety</TableHead>
                  <TableHead>Corner</TableHead>
                  <TableHead>Linebacker</TableHead>
                  <TableHead>Missing Weeks</TableHead>
                  <TableHead>Which Weeks</TableHead>
                  <TableHead>Additional Context</TableHead>
                  <TableHead>Other Exp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      {player.firstName} {player.lastName}
                    </TableCell>
                    <TableCell>{player.height}</TableCell>
                    <TableCell>{player.jerseySize}</TableCell>
                    <TableCell>{player.pronouns}</TableCell>
                    <TableCell>{player.womens ? "Yes" : "No"}</TableCell>
                    <TableCell>{player.offDefCaptainExperience}</TableCell>
                    <TableCell>{player.offDefCaptainInterest}</TableCell>
                    <TableCell>
                      {player.socialCaptainInterest ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>{player.ngffl ? "Yes" : "No"}</TableCell>
                    <TableCell>{player.speed}</TableCell>
                    <TableCell>{player.agility}</TableCell>
                    <TableCell>{player.handEyeCoordination}</TableCell>
                    <TableCell>{player.competitiveness}</TableCell>
                    <TableCell>{player.footballExperience}</TableCell>
                    <TableCell>{player.offensiveKnowledge}</TableCell>
                    <TableCell>{player.defensiveKnowledge}</TableCell>
                    <TableCell>{player.totalScore}</TableCell>
                    <TableCell>{player.qb}</TableCell>
                    <TableCell>{player.blocker}</TableCell>
                    <TableCell>{player.wr}</TableCell>
                    <TableCell>{player.slot}</TableCell>
                    <TableCell>{player.rusher}</TableCell>
                    <TableCell>{player.safety}</TableCell>
                    <TableCell>{player.corner}</TableCell>
                    <TableCell>{player.linebacker}</TableCell>
                    <TableCell>{player.missingWeeks ? "Yes" : "No"}</TableCell>
                    <TableCell>{player.whichWeeks}</TableCell>
                    <TableCell>{player.additionalContext}</TableCell>
                    <TableCell>{player.otherExperience}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
