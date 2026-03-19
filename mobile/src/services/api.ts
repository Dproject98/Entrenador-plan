import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore, getStoredRefreshToken } from "@/store/auth.store";
import type {
  AuthTokens,
  User,
  LoginBody,
  RegisterBody,
  Exercise,
  MuscleGroup,
  WorkoutSession,
  WorkoutSessionDetail,
  WorkoutSet,
  Food,
  MealLog,
  MealLogDetail,
  MealType,
  MealEntry,
  NutritionSummary,
  TrainingPlan,
  TrainingPlanDetail,
  PlannedExercise,
  PlanWeek,
  PlanWorkout,
  ApiResponse,
  ApiListResponse,
} from "@/types/api.types";

// ─── Axios instance ──────────────────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const http: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// Attach access token to every request
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → refresh → retry once
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(http(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post<AuthTokens>(
        `${BASE_URL}/api/v1/auth/refresh`,
        { refreshToken }
      );

      useAuthStore.getState().setAccessToken(data.accessToken);
      await SecureStore.setItemAsync("refresh_token", data.refreshToken);

      refreshQueue.forEach((cb) => cb(data.accessToken));
      refreshQueue = [];

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return http(original);
    } catch {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: RegisterBody) =>
    http.post<AuthTokens & { user: User }>("/auth/register", body).then((r) => r.data),

  login: (body: LoginBody) =>
    http.post<AuthTokens & { user: User }>("/auth/login", body).then((r) => r.data),

  me: () =>
    http.get<ApiResponse<User>>("/auth/me").then((r) => r.data.data),

  logout: () =>
    http.post("/auth/logout").catch(() => undefined), // best-effort
};

// ─── Exercises ───────────────────────────────────────────────────────────────

export const exercisesApi = {
  list: (params?: { muscleGroup?: MuscleGroup; q?: string }) =>
    http.get<ApiResponse<Exercise[]>>("/exercises", { params }).then((r) => r.data.data),

  get: (id: string) =>
    http.get<ApiResponse<Exercise>>(`/exercises/${id}`).then((r) => r.data.data),
};

// ─── Workout Sessions ────────────────────────────────────────────────────────

export const sessionsApi = {
  list: (params?: { page?: number; limit?: number; from?: string; to?: string }) =>
    http.get<ApiListResponse<WorkoutSession>>("/sessions", { params }).then((r) => r.data),

  create: (body: { name?: string; planWorkoutId?: string; notes?: string }) =>
    http.post<ApiResponse<WorkoutSession>>("/sessions", body).then((r) => r.data.data),

  get: (id: string) =>
    http.get<ApiResponse<WorkoutSessionDetail>>(`/sessions/${id}`).then((r) => r.data.data),

  update: (id: string, body: { name?: string; endedAt?: string | null; notes?: string | null }) =>
    http.patch<ApiResponse<WorkoutSession>>(`/sessions/${id}`, body).then((r) => r.data.data),

  delete: (id: string) =>
    http.delete(`/sessions/${id}`),
};

// ─── Workout Sets ────────────────────────────────────────────────────────────

export const setsApi = {
  create: (
    sessionId: string,
    body: {
      exerciseId: string;
      setNumber: number;
      reps?: number;
      weightKg?: number;
      rpe?: number;
      completed?: boolean;
      notes?: string;
    }
  ) =>
    http
      .post<ApiResponse<WorkoutSet>>(`/sessions/${sessionId}/sets`, body)
      .then((r) => r.data.data),

  update: (
    sessionId: string,
    setId: string,
    body: { reps?: number; weightKg?: number | null; rpe?: number | null; completed?: boolean; notes?: string | null }
  ) =>
    http
      .patch<ApiResponse<WorkoutSet>>(`/sessions/${sessionId}/sets/${setId}`, body)
      .then((r) => r.data.data),

  delete: (sessionId: string, setId: string) =>
    http.delete(`/sessions/${sessionId}/sets/${setId}`),
};

// ─── Foods ───────────────────────────────────────────────────────────────────

export const foodsApi = {
  list: (params?: { q?: string; page?: number; limit?: number }) =>
    http.get<ApiListResponse<Food>>("/foods", { params }).then((r) => r.data),

  create: (body: {
    name: string;
    brandName?: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
  }) =>
    http.post<ApiResponse<Food>>("/foods", body).then((r) => r.data.data),

  get: (id: string) =>
    http.get<ApiResponse<Food>>(`/foods/${id}`).then((r) => r.data.data),

  update: (id: string, body: Partial<Parameters<typeof foodsApi.create>[0]>) =>
    http.patch<ApiResponse<Food>>(`/foods/${id}`, body).then((r) => r.data.data),

  delete: (id: string) =>
    http.delete(`/foods/${id}`),
};

// ─── Meals ───────────────────────────────────────────────────────────────────

export const mealsApi = {
  list: (date: string) =>
    http.get<ApiResponse<MealLog[]>>("/meals", { params: { date } }).then((r) => r.data.data),

  create: (body: { date: string; mealType: MealType }) =>
    http.post<ApiResponse<MealLog>>("/meals", body).then((r) => r.data.data),

  get: (id: string) =>
    http.get<ApiResponse<MealLogDetail>>(`/meals/${id}`).then((r) => r.data.data),

  delete: (id: string) =>
    http.delete(`/meals/${id}`),
};

// ─── Meal Entries ─────────────────────────────────────────────────────────────

export const entriesApi = {
  create: (mealLogId: string, body: { foodId: string; quantityG: number }) =>
    http
      .post<ApiResponse<MealEntry>>(`/meals/${mealLogId}/entries`, body)
      .then((r) => r.data.data),

  update: (mealLogId: string, entryId: string, quantityG: number) =>
    http
      .patch<ApiResponse<MealEntry>>(`/meals/${mealLogId}/entries/${entryId}`, { quantityG })
      .then((r) => r.data.data),

  delete: (mealLogId: string, entryId: string) =>
    http.delete(`/meals/${mealLogId}/entries/${entryId}`),
};

// ─── Nutrition Summary ────────────────────────────────────────────────────────

export const nutritionApi = {
  summary: (date: string) =>
    http.get<ApiResponse<NutritionSummary>>("/nutrition/summary", { params: { date } }).then((r) => r.data.data),
};

// ─── Training Plans ───────────────────────────────────────────────────────────

export const plansApi = {
  list: () =>
    http.get<ApiResponse<TrainingPlan[]>>("/plans").then((r) => r.data.data),

  create: (body: { name: string; description?: string }) =>
    http.post<ApiResponse<TrainingPlan>>("/plans", body).then((r) => r.data.data),

  get: (id: string) =>
    http.get<ApiResponse<TrainingPlanDetail>>(`/plans/${id}`).then((r) => r.data.data),

  update: (id: string, body: { name?: string; description?: string | null }) =>
    http.patch<ApiResponse<TrainingPlan>>(`/plans/${id}`, body).then((r) => r.data.data),

  delete: (id: string) =>
    http.delete(`/plans/${id}`),

  activate: (id: string) =>
    http.post<ApiResponse<TrainingPlan>>(`/plans/${id}/activate`).then((r) => r.data.data),

  // Weeks
  createWeek: (planId: string, weekNumber: number) =>
    http
      .post<ApiResponse<PlanWeek>>(`/plans/${planId}/weeks`, { weekNumber })
      .then((r) => r.data.data),

  // Workouts
  createWorkout: (planId: string, weekId: string, body: { dayOfWeek: number; name?: string }) =>
    http
      .post<ApiResponse<PlanWorkout>>(`/plans/${planId}/weeks/${weekId}/workouts`, body)
      .then((r) => r.data.data),

  updateWorkout: (planId: string, weekId: string, workoutId: string, body: { dayOfWeek?: number; name?: string | null }) =>
    http
      .patch<ApiResponse<PlanWorkout>>(`/plans/${planId}/weeks/${weekId}/workouts/${workoutId}`, body)
      .then((r) => r.data.data),

  deleteWorkout: (planId: string, weekId: string, workoutId: string) =>
    http.delete(`/plans/${planId}/weeks/${weekId}/workouts/${workoutId}`),

  // Planned exercises
  createExercise: (
    planId: string,
    weekId: string,
    workoutId: string,
    body: {
      exerciseId: string;
      sets: number;
      reps: string;
      restSeconds?: number;
      notes?: string;
      orderIndex: number;
    }
  ) =>
    http
      .post<ApiResponse<PlannedExercise>>(
        `/plans/${planId}/weeks/${weekId}/workouts/${workoutId}/exercises`,
        body
      )
      .then((r) => r.data.data),
};
