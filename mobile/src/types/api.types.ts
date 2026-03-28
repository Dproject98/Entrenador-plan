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

// ─── Social ──────────────────────────────────────────────────────────────────

export type ChallengeType = "VOLUME_KG" | "SESSIONS_COUNT" | "STREAK_DAYS";
export type ChallengeStatus = "active" | "upcoming" | "finished";

export interface FeedPost {
  id: string;
  name?: string | null;
  startedAt: string;
  endedAt: string;
  notes?: string | null;
  user: { id: string; name: string };
  setsCount: number;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
}

export interface LeaderboardVolumeEntry {
  rank: number;
  userId: string;
  name: string;
  totalVolume: number;
  sessionsCount: number;
}

export interface LeaderboardStreakEntry {
  rank: number;
  userId: string;
  name: string;
  streakDays: number;
}

export interface WorkoutComment {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string };
}

// ─── Body Measurements ───────────────────────────────────────────────────────

export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  muscleMassPct?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface CreateMeasurementBody {
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
  muscleMassPct?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export type AnalyticsPeriod = "week" | "month" | "3months";

export interface PersonalRecord {
  exercise: Pick<Exercise, "id" | "name" | "muscleGroup">;
  maxWeightKg: number;
  maxWeightReps: number;
  maxReps: number;
  maxRepsWeight: number;
  estimated1RM: number;
  best1RMWeight: number;
  best1RMReps: number;
  achievedAt: string;
  totalSets: number;
}

export interface ProgressionEntry {
  date: string;
  weightKg: number;
  reps: number;
  estimated1RM: number;
}

export interface ExerciseProgression {
  exercise: Pick<Exercise, "id" | "name" | "muscleGroup">;
  progression: ProgressionEntry[];
}

export interface MuscleGroupVolume {
  muscleGroup: MuscleGroup;
  volume: number;
  sets: number;
}

export interface WeeklyTrendEntry {
  week: string;
  volume: number;
  sessions: number;
}

export interface TrainingLoad {
  period: AnalyticsPeriod;
  totalVolume: number;
  totalSets: number;
  sessionsCount: number;
  byMuscleGroup: MuscleGroupVolume[];
  weeklyTrend: WeeklyTrendEntry[];
}

export interface MuscleDistributionEntry {
  muscleGroup: MuscleGroup;
  sets: number;
  pct: number;
}

// ─── Cardio ──────────────────────────────────────────────────────────────────

export type CardioType =
  | "RUNNING" | "CYCLING" | "SWIMMING" | "ROWING"
  | "ELLIPTICAL" | "WALKING" | "HIIT" | "OTHER";

export interface CardioLog {
  id: string;
  date: string;
  type: CardioType;
  durationMin: number;
  distanceKm?: number | null;
  caloriesBurned?: number | null;
  avgHeartRate?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface CreateCardioBody {
  date: string;
  type: CardioType;
  durationMin: number;
  distanceKm?: number;
  caloriesBurned?: number;
  avgHeartRate?: number;
  notes?: string;
}

export interface CardioStats {
  totalSessions: number;
  totalMinutes: number;
  totalDistanceKm: number;
  totalCalories: number;
  byType: Partial<Record<CardioType, number>>;
}

// ─── Goals & Streak ──────────────────────────────────────────────────────────

export interface UserGoal {
  weeklySessionsTarget: number;
  weeklyVolumeKgTarget: number | null;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
  thisWeekSessions: number;
  thisWeekDays: string[];
}

export interface Challenge {
  id: string;
  name: string;
  description?: string | null;
  type: ChallengeType;
  goal: number;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  status: ChallengeStatus;
  creatorId: string;
  creator: { id: string; name: string };
  participantsCount: number;
  joinedByMe: boolean;
}
