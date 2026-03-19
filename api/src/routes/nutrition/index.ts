import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { authenticate } from "../../hooks/authenticate.js";
import { listFoodsHandler } from "./foods-list.js";
import { createFoodHandler } from "./foods-create.js";
import { getFoodHandler } from "./foods-get.js";
import { updateFoodHandler } from "./foods-update.js";
import { deleteFoodHandler } from "./foods-delete.js";
import { listMealsHandler } from "./meals-list.js";
import { createMealHandler } from "./meals-create.js";
import { getMealHandler } from "./meals-get.js";
import { deleteMealHandler } from "./meals-delete.js";
import { createEntryHandler } from "./entries-create.js";
import { updateEntryHandler } from "./entries-update.js";
import { deleteEntryHandler } from "./entries-delete.js";
import { summaryHandler } from "./summary.js";

const auth = { preHandler: [authenticate] };

async function nutritionRoutes(fastify: FastifyInstance): Promise<void> {
  // Foods — search is public, mutations require auth
  fastify.get("/foods", listFoodsHandler);
  fastify.post("/foods", auth, createFoodHandler);
  fastify.get("/foods/:id", getFoodHandler);
  fastify.patch("/foods/:id", auth, updateFoodHandler);
  fastify.delete("/foods/:id", auth, deleteFoodHandler);

  // Meal logs (protected)
  fastify.get("/meals", auth, listMealsHandler);
  fastify.post("/meals", auth, createMealHandler);
  fastify.get("/meals/:id", auth, getMealHandler);
  fastify.delete("/meals/:id", auth, deleteMealHandler);

  // Meal entries (nested under meal log, protected)
  fastify.post("/meals/:id/entries", auth, createEntryHandler);
  fastify.patch("/meals/:id/entries/:entryId", auth, updateEntryHandler);
  fastify.delete("/meals/:id/entries/:entryId", auth, deleteEntryHandler);

  // Nutrition summary (protected)
  fastify.get("/nutrition/summary", auth, summaryHandler);
}

export default fp(nutritionRoutes, { name: "nutrition-routes" });
