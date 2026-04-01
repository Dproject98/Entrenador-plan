import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { plansApi } from "@/services/api";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const planKeys = {
  all: ["plans"] as const,
  detail: (id: string) => ["plan", id] as const,
};

// ─── Plans ────────────────────────────────────────────────────────────────────

export function usePlans() {
  return useQuery({
    queryKey: planKeys.all,
    queryFn: () => plansApi.list(),
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: () => plansApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string }) => plansApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all }),
  });
}

export function useUpdatePlan(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; description?: string | null }) =>
      plansApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: planKeys.all });
      qc.invalidateQueries({ queryKey: planKeys.detail(id) });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plansApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all }),
  });
}

export function useActivatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plansApi.activate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all }),
  });
}

// ─── Plan structure ───────────────────────────────────────────────────────────

export function useCreateWeek(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weekNumber: number) => plansApi.createWeek(planId, weekNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.detail(planId) }),
  });
}

export function useCreatePlanWorkout(planId: string, weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { dayOfWeek: number; name?: string }) =>
      plansApi.createWorkout(planId, weekId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.detail(planId) }),
  });
}

export function useDeletePlanWorkout(planId: string, weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: string) => plansApi.deleteWorkout(planId, weekId, workoutId),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.detail(planId) }),
  });
}

export function useDeletePlannedExercise(planId: string, weekId: string, workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) =>
      plansApi.deleteExercise(planId, weekId, workoutId, exerciseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.detail(planId) }),
  });
}

export function useCreatePlannedExercise(planId: string, weekId: string, workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      exerciseId: string;
      sets: number;
      reps: string;
      restSeconds?: number;
      notes?: string;
      orderIndex: number;
    }) => plansApi.createExercise(planId, weekId, workoutId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.detail(planId) }),
  });
}
