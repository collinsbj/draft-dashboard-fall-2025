"use client";

import { Prisma, Rookie } from "@/generated/prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const queryKey = ["rookies"] as const;

async function getRookies(): Promise<Rookie[]> {
  const response = await fetch("/api/rookies");
  if (!response.ok) throw new Error("Failed to fetch rookies");
  return response.json();
}

async function updateRookieMutation({
  id,
  data,
}: {
  id: number;
  data: Prisma.RookieUpdateInput;
}) {
  const response = await fetch(`/api/rookies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!response.ok) throw new Error("Failed to update rookie");
  return response.json();
}

export function useRookies() {
  const queryClient = useQueryClient();
  const rookiesQuery = useQuery({ queryKey, queryFn: getRookies });

  const updateMutation = useMutation({
    mutationFn: updateRookieMutation,
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Rookie[]>(queryKey);

      queryClient.setQueryData<Rookie[]>(queryKey, (old = []) =>
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
          return next as Rookie;
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
    rookies: rookiesQuery.data ?? [],
    isLoadingRookies: rookiesQuery.isLoading,
    errorRookies: rookiesQuery.error,
    refetchRookies: rookiesQuery.refetch,
    updateRookie: updateMutation.mutateAsync,
  };
}
