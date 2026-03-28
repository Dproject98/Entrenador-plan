import type { FastifyInstance, RouteHandlerMethod } from "fastify";
import { authenticate } from "../../hooks/authenticate.js";
import { trainingLoadHandler } from "./training-load.js";
import { muscleBalanceHandler } from "./muscle-balance.js";
import { personalRecordsHandler } from "./personal-records.js";
import { exerciseProgressionHandler } from "./exercise-progression.js";
import { streakHandler } from "./streak.js";

const auth = { preHandler: [authenticate] };
const h = <T>(fn: T) => fn as RouteHandlerMethod;

async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/training-load", auth, h(trainingLoadHandler));
  fastify.get("/muscle-balance", auth, h(muscleBalanceHandler));
  fastify.get("/personal-records", auth, h(personalRecordsHandler));
  fastify.get("/exercise-progression/:exerciseId", auth, h(exerciseProgressionHandler));
  fastify.get("/streak", auth, h(streakHandler));
}

export default analyticsRoutes;
