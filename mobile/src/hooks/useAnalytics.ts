import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/services/api";
import type { AnalyticsPeriod } from "@/types/api.types";

const BASE = ["analytics"] as const;

export const analyticsKeys = {
  all: BASE,
  trainingLoad: (period?: AnalyticsPeriod) => [...BASE, "trainingLoad", period] as const,
  muscleBalance: [...BASE, "muscleBalance"] as const,
  personalRecords: [...BASE, "personalRecords"] as const,
  exerciseProgression: (exerciseId: string) => [...BASE, "progression", exerciseId] as const,
};

export function useTrainingLoad(period?: AnalyticsPeriod) {
  return useQuery({
    queryKey: analyticsKeys.trainingLoad(period),
    queryFn: () => analyticsApi.trainingLoad(period),
  });
}

export function useMuscleBalance() {
  return useQuery({
    queryKey: analyticsKeys.muscleBalance,
    queryFn: () => analyticsApi.muscleBalance(),
  });
}

export function usePersonalRecords() {
  return useQuery({
    queryKey: analyticsKeys.personalRecords,
    queryFn: () => analyticsApi.personalRecords(),
  });
}

export function useExerciseProgression(exerciseId: string | null) {
  return useQuery({
    queryKey: analyticsKeys.exerciseProgression(exerciseId ?? ""),
    queryFn: () => analyticsApi.exerciseProgression(exerciseId!),
    enabled: !!exerciseId,
  });
}
