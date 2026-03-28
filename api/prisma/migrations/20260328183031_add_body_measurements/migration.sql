-- CreateTable
CREATE TABLE "body_measurements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weight_kg" DOUBLE PRECISION,
    "body_fat_pct" DOUBLE PRECISION,
    "muscle_mass_pct" DOUBLE PRECISION,
    "chest_cm" DOUBLE PRECISION,
    "waist_cm" DOUBLE PRECISION,
    "hips_cm" DOUBLE PRECISION,
    "arm_cm" DOUBLE PRECISION,
    "thigh_cm" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "body_measurements_user_id_date_idx" ON "body_measurements"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "body_measurements_user_id_date_key" ON "body_measurements"("user_id", "date");

-- AddForeignKey
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
