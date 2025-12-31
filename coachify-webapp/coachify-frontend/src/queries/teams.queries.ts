import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/api";
import type { Team } from "../components/ui/teams-table";

export const myTeamsKey = ["myTeams"] as const;

export function useMyTeamsQuery() {
    return useQuery<Team[]>({
      queryKey: myTeamsKey,
      queryFn: async () => {
        const res = await api.get<Team[]>("/teams/my-teams");
        return res.data.map(t => ({ ...t, Athletes: t.Athletes ?? [] }));
      },
      staleTime: 60_000,
      retry: false,
      refetchOnWindowFocus: false,
      placeholderData: [], // ✅ ne initialData
    });
}
  

export function useCreateTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post("/teams", { Name: name }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: myTeamsKey });
    },
  });
}

export function useDeleteTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teamId: number) => api.delete(`/teams/${teamId}`),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: myTeamsKey });
    },
  });
}
