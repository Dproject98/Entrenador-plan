-- CreateEnum
CREATE TYPE "cardio_type" AS ENUM ('RUNNING', 'CYCLING', 'SWIMMING', 'ROWING', 'ELLIPTICAL', 'WALKING', 'HIIT', 'OTHER');

-- CreateTable
CREATE TABLE "cardio_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "cardio_type" NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "distance_km" DOUBLE PRECISION,
    "calories_burned" INTEGER,
    "avg_heart_rate" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cardio_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cardio_logs_user_id_date_idx" ON "cardio_logs"("user_id", "date");

-- AddForeignKey
ALTER TABLE "cardio_logs" ADD CONSTRAINT "cardio_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
