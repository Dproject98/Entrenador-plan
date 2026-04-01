import { useQuery } from "@tanstack/react-query";
import { exercisesApi } from "@/services/api";
import type { MuscleGroup } from "@/types/api.types";

export const exerciseKeys = {
  all: ["exercises"] as const,
  list: (params?: object) => [...exerciseKeys.all, "list", params] as const,
};

export function useExercises(params?: { muscleGroup?: MuscleGroup }) {
  return useQuery({
    queryKey: exerciseKeys.list(params),
    queryFn: () => exercisesApi.list(params),
    staleTime: 1000 * 60 * 30, // exercises are seed data — rarely change
  });
}
