"use client";

import { useMemo } from "react";
import { Rookie } from "@/generated/prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useLocalDraftState } from "./useLocalDraftState";

const queryKey = ["rookies"] as const;

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

export type RookieRow = Rookie &
  PlayerLocalState & {
    displayName: string;
  };

async function getRookies(): Promise<Rookie[]> {
  const response = await fetch("/api/rookies");
  if (!response.ok) throw new Error("Failed to fetch rookies");
  return response.json();
}

export function useRookies() {
  const rookiesQuery = useQuery({ queryKey, queryFn: getRookies });
  const rawRookies = useMemo(
    () => rookiesQuery.data ?? [],
    [rookiesQuery.data],
  );
  const dbIds = useMemo(() => rawRookies.map((r) => r.id), [rawRookies]);

  const { getState, setState } = useLocalDraftState<PlayerLocalState>(
    "dglffl:rookies:local-state",
    dbIds,
    PLAYER_LOCAL_DEFAULTS,
  );

  const rookies = useMemo<RookieRow[]>(
    () =>
      rawRookies.map((r) => {
        const local = getState(r.id);
        return {
          ...r,
          ...local,
          displayName: `${r.firstName} ${r.lastName}`,
        } as RookieRow;
      }),
    [rawRookies, getState],
  );

  const updateRookie = useMemo(
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
    rookies,
    isLoadingRookies: rookiesQuery.isLoading,
    errorRookies: rookiesQuery.error,
    refetchRookies: rookiesQuery.refetch,
    updateRookie: updateRookie.mutateAsync,
  };
}
