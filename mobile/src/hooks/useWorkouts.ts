import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, setsApi } from "@/services/api";
import type { WorkoutSet } from "@/types/api.types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const sessionKeys = {
  all: ["sessions"] as const,
  list: (params?: object) => [...sessionKeys.all, "list", params] as const,
  detail: (id: string) => [...sessionKeys.all, "detail", id] as const,
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function useSessions(params?: { page?: number; limit?: number; from?: string; to?: string }) {
  return useQuery({
    queryKey: sessionKeys.list(params),
    queryFn: () => sessionsApi.list(params),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => sessionsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; planWorkoutId?: string; notes?: string }) =>
      sessionsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.all }),
  });
}

export function useUpdateSession(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; endedAt?: string | null; notes?: string | null }) =>
      sessionsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.all }),
  });
}

// ─── Sets ──────────────────────────────────────────────────────────────────────

export function useAddSet(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      body: {
        exerciseId: string;
        setNumber: number;
        reps?: number;
        weightKg?: number;
        rpe?: number;
        completed?: boolean;
        notes?: string;
      }
    ) => setsApi.create(sessionId, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: sessionKeys.detail(sessionId) });
      const prev = qc.getQueryData(sessionKeys.detail(sessionId));
      // Optimistically append a temp set so the UI responds immediately
      qc.setQueryData(sessionKeys.detail(sessionId), (old: any) => {
        if (!old) return old;
        const tempSet: WorkoutSet = {
          id: `temp-${Date.now()}`,
          setNumber: body.setNumber,
          reps: body.reps ?? null,
          weightKg: body.weightKg ?? null,
          rpe: body.rpe ?? null,
          completed: body.completed ?? false,
          notes: body.notes ?? null,
          exercise: old.sets.find((s: WorkoutSet) => s.exercise.id === body.exerciseId)?.exercise ?? {
            id: body.exerciseId, name: "...", muscleGroup: "FULL_BODY", equipment: "OTHER",
          },
        };
        return { ...old, sets: [...old.sets, tempSet] };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(sessionKeys.detail(sessionId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) }),
  });
}

export function useUpdateSet(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      setId,
      ...body
    }: {
      setId: string;
      reps?: number;
      weightKg?: number | null;
      rpe?: number | null;
      completed?: boolean;
      notes?: string | null;
    }) => setsApi.update(sessionId, setId, body),
    onMutate: async ({ setId, ...patch }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: sessionKeys.detail(sessionId) });
      const prev = qc.getQueryData(sessionKeys.detail(sessionId));
      qc.setQueryData(sessionKeys.detail(sessionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          sets: old.sets.map((s: WorkoutSet) =>
            s.id === setId ? { ...s, ...patch } : s
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(sessionKeys.detail(sessionId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) }),
  });
}

export function useDeleteSet(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (setId: string) => setsApi.delete(sessionId, setId),
    onMutate: async (setId) => {
      await qc.cancelQueries({ queryKey: sessionKeys.detail(sessionId) });
      const prev = qc.getQueryData(sessionKeys.detail(sessionId));
      qc.setQueryData(sessionKeys.detail(sessionId), (old: any) => {
        if (!old) return old;
        return { ...old, sets: old.sets.filter((s: WorkoutSet) => s.id !== setId) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(sessionKeys.detail(sessionId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) }),
  });
}
