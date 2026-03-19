// Mirrors api/src/schemas/ types — keep in sync with backend

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

// ─── Exercises ─────────────────────────────────────────────────────────────

export type MuscleGroup =
  | "CHEST" | "BACK" | "SHOULDERS" | "BICEPS" | "TRICEPS"
  | "FOREARMS" | "CORE" | "GLUTES" | "QUADS" | "HAMSTRINGS"
  | "CALVES" | "FULL_BODY" | "CARDIO";

export type Equipment =
  | "BARBELL" | "DUMBBELL" | "CABLE" | "MACHINE" | "BODYWEIGHT"
  | "KETTLEBELL" | "RESISTANCE_BAND" | "SMITH_MACHINE" | "OTHER";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  description?: string | null;
}

// ─── Workout Sessions ───────────────────────────────────────────────────────

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps?: number | null;
  weightKg?: number | null;
  rpe?: number | null;
  completed: boolean;
  notes?: string | null;
  exercise: Pick<Exercise, "id" | "name" | "muscleGroup" | "equipment">;
}

export interface WorkoutSession {
  id: string;
  name?: string | null;
  startedAt: string;
  endedAt?: string | null;
  notes?: string | null;
  planWorkoutId?: string | null;
}

export interface WorkoutSessionDetail extends WorkoutSession {
  sets: WorkoutSet[];
}

// ─── Nutrition ──────────────────────────────────────────────────────────────

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface Food {
  id: string;
  name: string;
  brandName?: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  isPrivate: boolean;
  userId?: string | null;
}

export interface MealEntry {
  id: string;
  quantityG: number;
  food: Food;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealLog {
  id: string;
  date: string;
  mealType: MealType;
  createdAt: string;
}

export interface MealLogDetail extends MealLog {
  entries: MealEntry[];
  macros: Macros;
}

export interface NutritionSummary {
  date: string;
  totals: Macros;
  byMeal: Partial<Record<MealType, Macros>>;
}

// ─── Training Plans ─────────────────────────────────────────────────────────

export interface PlannedExercise {
  id: string;
  sets: number;
  reps: string;
  restSeconds?: number | null;
  notes?: string | null;
  orderIndex: number;
  exercise: Pick<Exercise, "id" | "name" | "muscleGroup" | "equipment">;
}

export interface PlanWorkout {
  id: string;
  dayOfWeek: number;
  name?: string | null;
  plannedExercises: PlannedExercise[];
}

export interface PlanWeek {
  id: string;
  weekNumber: number;
  workouts: PlanWorkout[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface TrainingPlanDetail extends TrainingPlan {
  weeks: PlanWeek[];
  updatedAt: string;
}

// ─── API Response envelopes ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface ApiError {
  error: { code: string; message: string; statusCode: number };
}
