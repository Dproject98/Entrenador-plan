import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi, goalsApi } from "@/services/api";
import type { UserGoal } from "@/types/api.types";

export const goalsKeys = {
  all: ["goals"] as const,
  goal: [...["goals"], "goal"] as const,
  streak: [...["goals"], "streak"] as const,
};

export function useStreak() {
  return useQuery({
    queryKey: goalsKeys.streak,
    queryFn: () => analyticsApi.streak(),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useGoal() {
  return useQuery({
    queryKey: goalsKeys.goal,
    queryFn: () => goalsApi.get(),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<UserGoal>) => goalsApi.update(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: goalsKeys.all }),
  });
}
