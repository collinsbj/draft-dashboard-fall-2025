"use client";

import { Prisma, ReturningPlayer } from "@/generated/prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const queryKey = ["returningPlayers"] as const;

async function getReturningPlayers(): Promise<ReturningPlayer[]> {
  const response = await fetch("/api/returning-players");
  if (!response.ok) throw new Error("Failed to fetch returning players");
  return response.json();
}

async function updateReturningPlayerMutation({
  id,
  data,
}: {
  id: number;
  data: Prisma.ReturningPlayerUpdateInput;
}) {
  const response = await fetch(`/api/returning-players/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!response.ok) throw new Error("Failed to update returning player");
  return response.json();
}

export function useReturningPlayers() {
  const queryClient = useQueryClient();
  const playersQuery = useQuery({ queryKey, queryFn: getReturningPlayers });

  const updateMutation = useMutation({
    mutationFn: updateReturningPlayerMutation,
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ReturningPlayer[]>(queryKey);

      queryClient.setQueryData<ReturningPlayer[]>(queryKey, (old = []) =>
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

          return next as ReturningPlayer;
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

  return {
    returningPlayers: playersQuery.data ?? [],
    isLoadingReturningPlayers: playersQuery.isLoading,
    errorReturningPlayers: playersQuery.error,
    refetchReturningPlayers: playersQuery.refetch,
    updateReturningPlayer: updateMutation.mutateAsync,
  };
}
