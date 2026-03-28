import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cardioApi } from "@/services/api";
import type { CreateCardioBody } from "@/types/api.types";

const BASE = ["cardio"] as const;

export const cardioKeys = {
  all: BASE,
  list: (params?: object) => [...BASE, "list", params] as const,
  stats: [...BASE, "stats"] as const,
};

export function useCardioLogs(params?: { page?: number; limit?: number; from?: string; to?: string }) {
  return useQuery({
    queryKey: cardioKeys.list(params),
    queryFn: () => cardioApi.list(params),
  });
}

export function useCardioStats() {
  return useQuery({
    queryKey: cardioKeys.stats,
    queryFn: () => cardioApi.stats(),
  });
}

export function useCreateCardioLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCardioBody) => cardioApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardioKeys.all }),
  });
}

export function useDeleteCardioLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardioApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardioKeys.all }),
  });
}
