import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { foodsApi, mealsApi, entriesApi, nutritionApi } from "@/services/api";
import type { MealType } from "@/types/api.types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const nutritionKeys = {
  foods: (q?: string) => ["foods", q] as const,
  food: (id: string) => ["food", id] as const,
  meals: (date: string) => ["meals", date] as const,
  meal: (id: string) => ["meal", id] as const,
  summary: (date: string) => ["nutrition-summary", date] as const,
};

// ─── Foods ────────────────────────────────────────────────────────────────────

export function useFoods(q?: string) {
  return useQuery({
    queryKey: nutritionKeys.foods(q),
    queryFn: () => foodsApi.list({ q }),
    enabled: (q?.length ?? 0) > 1,
    staleTime: 60_000,
  });
}

export function useCreateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: foodsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
}

export function useDeleteFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => foodsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
}

// ─── Meal logs ────────────────────────────────────────────────────────────────

export function useMeals(date: string) {
  return useQuery({
    queryKey: nutritionKeys.meals(date),
    queryFn: () => mealsApi.list(date),
    enabled: !!date,
  });
}

export function useMealDetail(id: string) {
  return useQuery({
    queryKey: nutritionKeys.meal(id),
    queryFn: () => mealsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { date: string; mealType: MealType }) => mealsApi.create(body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: nutritionKeys.meals(vars.date) });
    },
  });
}

export function useDeleteMeal(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mealsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.meals(date) });
      qc.invalidateQueries({ queryKey: nutritionKeys.summary(date) });
    },
  });
}

// ─── Meal entries ─────────────────────────────────────────────────────────────

export function useAddEntry(mealLogId: string, date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { foodId: string; quantityG: number }) =>
      entriesApi.create(mealLogId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.meal(mealLogId) });
      qc.invalidateQueries({ queryKey: nutritionKeys.summary(date) });
    },
  });
}

export function useUpdateEntry(mealLogId: string, date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, quantityG }: { entryId: string; quantityG: number }) =>
      entriesApi.update(mealLogId, entryId, quantityG),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.meal(mealLogId) });
      qc.invalidateQueries({ queryKey: nutritionKeys.summary(date) });
    },
  });
}

export function useDeleteEntry(mealLogId: string, date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => entriesApi.delete(mealLogId, entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.meal(mealLogId) });
      qc.invalidateQueries({ queryKey: nutritionKeys.summary(date) });
    },
  });
}

// ─── Daily summary ────────────────────────────────────────────────────────────

export function useNutritionSummary(date: string) {
  return useQuery({
    queryKey: nutritionKeys.summary(date),
    queryFn: () => nutritionApi.summary(date),
    enabled: !!date,
  });
}
