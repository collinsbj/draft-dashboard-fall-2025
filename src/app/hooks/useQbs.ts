"use client";

import { useMemo } from "react";
import { Qb } from "@/generated/prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useLocalDraftState } from "./useLocalDraftState";
import { useLocalSortOrder } from "./useLocalSortOrder";

const queryKey = ["qbs"] as const;

type QbLocalState = {
  drafted: boolean;
  selected: boolean;
  notes: string | null;
};

const QB_LOCAL_DEFAULTS: QbLocalState = {
  drafted: false,
  selected: false,
  notes: null,
};

export type QbRow = Qb & {
  drafted: boolean;
  selected: boolean;
  notes: string | null;
  displayName: string;
};

async function getQbs(): Promise<Qb[]> {
  const response = await fetch("/api/qbs");
  if (!response.ok) throw new Error("Failed to fetch QBs");
  return response.json();
}

export function useQbs() {
  const qbsQuery = useQuery({ queryKey, queryFn: getQbs });
  const rawQbs = useMemo(() => qbsQuery.data ?? [], [qbsQuery.data]);
  const dbIds = useMemo(() => rawQbs.map((q) => q.id), [rawQbs]);

  const { getState, setState } = useLocalDraftState<QbLocalState>(
    "dglffl:qbs:local-state",
    dbIds,
    QB_LOCAL_DEFAULTS,
  );

  const { orderedIds, reorder } = useLocalSortOrder(
    "dglffl:qbs:sort-order",
    dbIds,
  );

  const qbs = useMemo<QbRow[]>(() => {
    const byId = new Map(rawQbs.map((q) => [q.id, q]));
    return orderedIds
      .map((id) => {
        const q = byId.get(id);
        if (!q) return null;
        const local = getState(id);
        return { ...q, ...local, displayName: q.fullName } as QbRow;
      })
      .filter((row): row is QbRow => row !== null);
  }, [rawQbs, orderedIds, getState]);

  const updateQb = useMemo(
    () => ({
      mutateAsync: ({
        id,
        data,
      }: {
        id: number;
        data: Partial<QbLocalState>;
      }) => {
        setState(id, data);
        return Promise.resolve();
      },
    }),
    [setState],
  );

  return {
    qbs,
    isLoadingQbs: qbsQuery.isLoading,
    errorQbs: qbsQuery.error,
    refetchQbs: qbsQuery.refetch,
    updateQb: updateQb.mutateAsync,
    reorderQbs: async (updates: Array<{ id: number; sortOrder: number }>) => {
      reorder(updates);
    },
  };
}
