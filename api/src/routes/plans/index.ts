import type { FastifyInstance } from "fastify";
import { authenticate } from "../../hooks/authenticate.js";
import { listPlansHandler } from "./plans-list.js";
import { createPlanHandler } from "./plans-create.js";
import { getPlanHandler } from "./plans-get.js";
import { updatePlanHandler } from "./plans-update.js";
import { deletePlanHandler } from "./plans-delete.js";
import { activatePlanHandler } from "./plans-activate.js";
import { createWeekHandler } from "./weeks-create.js";
import { createWorkoutHandler } from "./workouts-create.js";
import { updateWorkoutHandler } from "./workouts-update.js";
import { deleteWorkoutHandler } from "./workouts-delete.js";
import { createPlannedExerciseHandler } from "./exercises-create.js";

const auth = { preHandler: [authenticate] };

async function planRoutes(fastify: FastifyInstance): Promise<void> {
  // Training plans
  fastify.get("/plans", auth, listPlansHandler);
  fastify.post("/plans", auth, createPlanHandler);
  fastify.get("/plans/:id", auth, getPlanHandler);
  fastify.patch("/plans/:id", auth, updatePlanHandler);
  fastify.delete("/plans/:id", auth, deletePlanHandler);
  fastify.post("/plans/:id/activate", auth, activatePlanHandler);

  // Weeks
  fastify.post("/plans/:id/weeks", auth, createWeekHandler);

  // Workouts (nested under week)
  fastify.post("/plans/:id/weeks/:weekId/workouts", auth, createWorkoutHandler);
  fastify.patch("/plans/:id/weeks/:weekId/workouts/:workoutId", auth, updateWorkoutHandler);
  fastify.delete("/plans/:id/weeks/:weekId/workouts/:workoutId", auth, deleteWorkoutHandler);

  // Planned exercises (nested under workout)
  fastify.post(
    "/plans/:id/weeks/:weekId/workouts/:workoutId/exercises",
    auth,
    createPlannedExerciseHandler
  );
}

export default planRoutes;
