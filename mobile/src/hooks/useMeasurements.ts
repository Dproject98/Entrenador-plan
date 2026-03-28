import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { measurementsApi } from "@/services/api";
import type { CreateMeasurementBody } from "@/types/api.types";

const BASE = ["measurements"] as const;

export const measurementKeys = {
  all: BASE,
  list: (params?: object) => [...BASE, "list", params] as const,
  latest: [...BASE, "latest"] as const,
};

export function useMeasurements(params?: { page?: number; limit?: number; from?: string; to?: string }) {
  return useQuery({
    queryKey: measurementKeys.list(params),
    queryFn: () => measurementsApi.list(params),
  });
}

export function useLatestMeasurement() {
  return useQuery({
    queryKey: measurementKeys.latest,
    queryFn: () => measurementsApi.latest(),
  });
}

export function useCreateMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMeasurementBody) => measurementsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: measurementKeys.all }),
  });
}

export function useDeleteMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => measurementsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: measurementKeys.all }),
  });
}
