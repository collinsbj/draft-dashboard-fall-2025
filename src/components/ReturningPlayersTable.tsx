"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Filter } from "lucide-react";
import { toast } from "sonner";
import { usePlayers } from "@/app/hooks/usePlayers";
import { Player } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";

export function ReturningPlayersTable() {
  const [hideTaken, setHideTaken] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  const { returningPlayers, isLoadingReturning, updatePlayer } = usePlayers();

  const filteredPlayers = returningPlayers.filter((player) => {
    const matchesSearch =
      `${player.firstName?.toLowerCase()} ${player.lastName?.toLowerCase()}`.includes(
        searchValue.toLowerCase()
      );
    if (!matchesSearch) return false;
    if (hideTaken) {
      return !player.taken && !player.selected;
    }
    return true;
  });

  // Toggle favorite status
  const toggleFavorite = async (player: Player) => {
    await updatePlayer({
      id: player.id,
      data: { favorite: !player.favorite },
    });

    toast(`${player.firstName}'s favorite status has been updated`);
  };

  // Toggle selected status
  const toggleSelected = async (player: Player) => {
    await updatePlayer({
      id: player.id,
      data: { selected: !player.selected },
    });

    toast(`${player.firstName}'s selection status has been updated`);
  };

  // Toggle taken status
  const toggleTaken = async (player: Player) => {
    await updatePlayer({
      id: player.id,
      data: { taken: !player.taken },
    });

    toast(`${player.firstName}'s taken status has been updated`);
  };

  // Toggle filter for taken players
  const toggleHideTaken = () => {
    setHideTaken(!hideTaken);
  };

  return (
    <Card className="h-100 overflow-y-auto">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Returning Players</CardTitle>

        <div className="flex items-center space-x-2 w-full justify-end max-w-100">
          <Input
            placeholder="Search players..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="max-w-200 w-full"
          />
          <Button
            variant={hideTaken ? "default" : "outline"}
            size="sm"
            onClick={toggleHideTaken}
          >
            <Filter className="h-4 w-4 mr-2" />
            {hideTaken ? "Show All" : "Show Available"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingReturning ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">No players found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Favorite</TableHead>
                  <TableHead>Select</TableHead>
                  <TableHead>Taken</TableHead>
                  <TableHead>Bucket</TableHead>
                  <TableHead>Group</TableHead>
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
                {filteredPlayers.map((player) => (
                  <TableRow
                    key={player.id}
                    className={cn(player.favorite && "bg-yellow-100")}
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(player)}
                        className={
                          player.favorite
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                        }
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={!!player.selected}
                        onCheckedChange={() => toggleSelected(player)}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={!!player.taken}
                        onCheckedChange={() => toggleTaken(player)}
                      />
                    </TableCell>
                    <TableCell>{player.bucket}</TableCell>
                    <TableCell>{player.group}</TableCell>
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
