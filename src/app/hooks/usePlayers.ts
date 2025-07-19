import { Prisma, Player } from "@/generated/prisma";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const getAllPlayers = async (): Promise<Player[]> => {
  const res = await fetch("/api/players");
  if (!res.ok) throw new Error("Failed to fetch players");
  return res.json();
};

const getAllReturningPlayers = async (): Promise<Player[]> => {
  const res = await fetch("/api/players?rookie=false");
  if (!res.ok) throw new Error("Failed to fetch returning players");
  return res.json();
};

const getAllRookies = async (): Promise<Player[]> => {
  const res = await fetch("/api/players?rookie=true");
  if (!res.ok) throw new Error("Failed to fetch rookies");
  return res.json();
};

const getSelectedPlayers = async (): Promise<Player[]> => {
  const res = await fetch("/api/players?selected=true");
  if (!res.ok) throw new Error("Failed to fetch selected players");
  return res.json();
};

const updatePlayerMutation = async ({
  id,
  data,
}: {
  id: number;
  data: Prisma.PlayerUpdateInput;
}) => {
  const res = await fetch(`/api/players`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, data }),
  });
  if (!res.ok) throw new Error("Failed to update player");
  return res.json();
};

export const usePlayers = () => {
  const queryClient = useQueryClient();

  const {
    data: allPlayers = [],
    isLoading: isLoadingAll,
    error: errorAll,
  } = useQuery({
    queryKey: ["players", "players-all"],
    queryFn: getAllPlayers,
  });

  const {
    data: returningPlayers = [],
    isLoading: isLoadingReturning,
    error: errorReturning,
  } = useQuery({
    queryKey: ["players", "players-returning"],
    queryFn: getAllReturningPlayers,
  });

  const {
    data: rookies = [],
    isLoading: isLoadingRookies,
    error: errorRookies,
  } = useQuery({
    queryKey: ["players", "players-rookies"],
    queryFn: getAllRookies,
  });

  const {
    data: selectedPlayers = [],

    isLoading: isLoadingSelected,
    error: errorSelected,
  } = useQuery({
    queryKey: ["players", "players-selected"],
    queryFn: getSelectedPlayers,
  });

  const { mutateAsync: updatePlayer } = useMutation({
    mutationFn: updatePlayerMutation,
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["players"] });
      const previousPlayers = queryClient.getQueryData<Player[]>([
        "players-all",
      ]);
      queryClient.setQueryData<Player[]>(["players-all"], (old) =>
        old
          ? old.map((player) =>
              player.id === id
                ? {
                    ...player,
                    ...Object.fromEntries(
                      Object.entries(data).map(([key, value]) => [
                        key,
                        typeof value === "object" &&
                        value !== null &&
                        "set" in value
                          ? value.set
                          : value,
                      ])
                    ),
                  }
                : player
            )
          : []
      );
      return { previousPlayers };
    },
    onError: (err, variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(["players-all"], context.previousPlayers);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["players"],
      });
    },
  });

  return {
    allPlayers,
    errorAll,
    errorReturning,
    errorRookies,
    errorSelected,
    isLoadingAll,
    isLoadingReturning,
    isLoadingRookies,
    isLoadingSelected,
    returningPlayers,
    rookies,
    selectedPlayers,
    updatePlayer,
  };
};
