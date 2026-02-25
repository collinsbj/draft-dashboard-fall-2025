"use client";

import { Prisma, Qb } from "@/generated/prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const queryKey = ["qbs"] as const;

async function getQbs(): Promise<Qb[]> {
  const response = await fetch("/api/qbs");
  if (!response.ok) throw new Error("Failed to fetch QBs");
  return response.json();
}

async function updateQbMutation({
  id,
  data,
}: {
  id: number;
  data: Prisma.QbUpdateInput;
}) {
  const response = await fetch(`/api/qbs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!response.ok) throw new Error("Failed to update QB");
  return response.json();
}

async function reorderQbsMutation(updates: Array<{ id: number; sortOrder: number }>) {
  const response = await fetch("/api/qbs/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  if (!response.ok) throw new Error("Failed to reorder QBs");
  return response.json();
}

export function useQbs() {
  const queryClient = useQueryClient();
  const qbsQuery = useQuery({ queryKey, queryFn: getQbs });

  const updateMutation = useMutation({
    mutationFn: updateQbMutation,
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Qb[]>(queryKey);

      queryClient.setQueryData<Qb[]>(queryKey, (old = []) =>
        old.map((player) => {
          if (player.id !== id) return player;

          const next = { ...player } as Record<string, unknown>;
          Object.entries(data).forEach(([key, value]) => {
            if (typeof value === "object" && value && "set" in value) {
              next[key] = (value as { set: unknown }).set;
            } else {
              next[key] = value;
            }
          });
          return next as Qb;
        })
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderQbsMutation,
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Qb[]>(queryKey);
      const updateMap = new Map(updates.map((item) => [item.id, item.sortOrder]));
      queryClient.setQueryData<Qb[]>(queryKey, (old = []) =>
        [...old]
          .map((row) =>
            updateMap.has(row.id)
              ? { ...row, sortOrder: updateMap.get(row.id) ?? row.sortOrder }
              : row
          )
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    qbs: qbsQuery.data ?? [],
    isLoadingQbs: qbsQuery.isLoading,
    errorQbs: qbsQuery.error,
    refetchQbs: qbsQuery.refetch,
    updateQb: updateMutation.mutateAsync,
    reorderQbs: reorderMutation.mutateAsync,
  };
}
