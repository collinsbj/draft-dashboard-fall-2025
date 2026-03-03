"use client";

import { useMemo } from "react";
import { ReturningPlayer } from "@/generated/prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useLocalDraftState } from "./useLocalDraftState";

const queryKey = ["returningPlayers"] as const;

type PlayerLocalState = {
  favorite: boolean;
  selected: boolean;
  drafted: boolean;
  rejected: boolean;
  notes: string | null;
};

const PLAYER_LOCAL_DEFAULTS: PlayerLocalState = {
  favorite: false,
  selected: false,
  drafted: false,
  rejected: false,
  notes: null,
};

export type ReturningPlayerRow = ReturningPlayer &
  PlayerLocalState & {
    displayName: string;
  };

async function getReturningPlayers(): Promise<ReturningPlayer[]> {
  const response = await fetch("/api/returning-players");
  if (!response.ok) throw new Error("Failed to fetch returning players");
  return response.json();
}

export function useReturningPlayers() {
  const playersQuery = useQuery({ queryKey, queryFn: getReturningPlayers });
  const rawPlayers = useMemo(
    () => playersQuery.data ?? [],
    [playersQuery.data],
  );
  const dbIds = useMemo(() => rawPlayers.map((p) => p.id), [rawPlayers]);

  const { getState, setState } = useLocalDraftState<PlayerLocalState>(
    "dglffl:returning-players:local-state",
    dbIds,
    PLAYER_LOCAL_DEFAULTS,
  );

  const returningPlayers = useMemo<ReturningPlayerRow[]>(
    () =>
      rawPlayers.map((p) => {
        const local = getState(p.id);
        return {
          ...p,
          ...local,
          displayName: `${p.firstName} ${p.lastName}`,
        } as ReturningPlayerRow;
      }),
    [rawPlayers, getState],
  );

  const updateReturningPlayer = useMemo(
    () => ({
      mutateAsync: ({
        id,
        data,
      }: {
        id: number;
        data: Partial<PlayerLocalState>;
      }) => {
        setState(id, data);
        return Promise.resolve();
      },
    }),
    [setState],
  );

  return {
    returningPlayers,
    isLoadingReturningPlayers: playersQuery.isLoading,
    errorReturningPlayers: playersQuery.error,
    refetchReturningPlayers: playersQuery.refetch,
    updateReturningPlayer: updateReturningPlayer.mutateAsync,
  };
}
