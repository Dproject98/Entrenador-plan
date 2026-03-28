-- CreateEnum
CREATE TYPE "muscle_group" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'CORE', 'GLUTES', 'QUADS', 'HAMSTRINGS', 'CALVES', 'FULL_BODY', 'CARDIO');

-- CreateEnum
CREATE TYPE "equipment" AS ENUM ('BARBELL', 'DUMBBELL', 'CABLE', 'MACHINE', 'BODYWEIGHT', 'KETTLEBELL', 'RESISTANCE_BAND', 'SMITH_MACHINE', 'OTHER');

-- CreateEnum
CREATE TYPE "meal_type" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "muscle_group" "muscle_group" NOT NULL,
    "equipment" "equipment" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_workout_id" TEXT,
    "name" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "reps" INTEGER,
    "weight_kg" DOUBLE PRECISION,
    "rpe" DOUBLE PRECISION,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand_name" TEXT,
    "calories_per_100g" DOUBLE PRECISION NOT NULL,
    "protein_per_100g" DOUBLE PRECISION NOT NULL,
    "carbs_per_100g" DOUBLE PRECISION NOT NULL,
    "fat_per_100g" DOUBLE PRECISION NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "meal_type" "meal_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_entries" (
    "id" TEXT NOT NULL,
    "meal_log_id" TEXT NOT NULL,
    "food_id" TEXT NOT NULL,
    "quantity_g" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_weeks" (
    "id" TEXT NOT NULL,
    "training_plan_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_workouts" (
    "id" TEXT NOT NULL,
    "plan_week_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_exercises" (
    "id" TEXT NOT NULL,
    "plan_workout_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "rest_seconds" INTEGER,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_key" ON "exercises"("name");

-- CreateIndex
CREATE INDEX "exercises_muscle_group_idx" ON "exercises"("muscle_group");

-- CreateIndex
CREATE INDEX "workout_sessions_user_id_started_at_idx" ON "workout_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "workout_sets_session_id_idx" ON "workout_sets"("session_id");

-- CreateIndex
CREATE INDEX "foods_name_idx" ON "foods"("name");

-- CreateIndex
CREATE INDEX "foods_user_id_idx" ON "foods"("user_id");

-- CreateIndex
CREATE INDEX "meal_logs_user_id_date_idx" ON "meal_logs"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "meal_logs_user_id_date_meal_type_key" ON "meal_logs"("user_id", "date", "meal_type");

-- CreateIndex
CREATE INDEX "meal_entries_meal_log_id_idx" ON "meal_entries"("meal_log_id");

-- CreateIndex
CREATE INDEX "training_plans_user_id_idx" ON "training_plans"("user_id");

-- CreateIndex
CREATE INDEX "plan_weeks_training_plan_id_idx" ON "plan_weeks"("training_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_weeks_training_plan_id_week_number_key" ON "plan_weeks"("training_plan_id", "week_number");

-- CreateIndex
CREATE INDEX "plan_workouts_plan_week_id_idx" ON "plan_workouts"("plan_week_id");

-- CreateIndex
CREATE INDEX "planned_exercises_plan_workout_id_idx" ON "planned_exercises"("plan_workout_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_plan_workout_id_fkey" FOREIGN KEY ("plan_workout_id") REFERENCES "plan_workouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_entries" ADD CONSTRAINT "meal_entries_meal_log_id_fkey" FOREIGN KEY ("meal_log_id") REFERENCES "meal_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_entries" ADD CONSTRAINT "meal_entries_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_weeks" ADD CONSTRAINT "plan_weeks_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_workouts" ADD CONSTRAINT "plan_workouts_plan_week_id_fkey" FOREIGN KEY ("plan_week_id") REFERENCES "plan_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_exercises" ADD CONSTRAINT "planned_exercises_plan_workout_id_fkey" FOREIGN KEY ("plan_workout_id") REFERENCES "plan_workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_exercises" ADD CONSTRAINT "planned_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
