import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { authenticate } from "../../hooks/authenticate.js";
import { listSessionsHandler } from "./sessions-list.js";
import { createSessionHandler } from "./sessions-create.js";
import { getSessionHandler } from "./sessions-get.js";
import { updateSessionHandler } from "./sessions-update.js";
import { deleteSessionHandler } from "./sessions-delete.js";
import { createSetHandler } from "./sets-create.js";
import { updateSetHandler } from "./sets-update.js";
import { deleteSetHandler } from "./sets-delete.js";

const auth = { preHandler: [authenticate] };

async function workoutRoutes(fastify: FastifyInstance): Promise<void> {
  // Sessions
  fastify.get("/sessions", auth, listSessionsHandler);
  fastify.post("/sessions", auth, createSessionHandler);
  fastify.get("/sessions/:id", auth, getSessionHandler);
  fastify.patch("/sessions/:id", auth, updateSessionHandler);
  fastify.delete("/sessions/:id", auth, deleteSessionHandler);

  // Sets (nested under session)
  fastify.post("/sessions/:id/sets", auth, createSetHandler);
  fastify.patch("/sessions/:id/sets/:setId", auth, updateSetHandler);
  fastify.delete("/sessions/:id/sets/:setId", auth, deleteSetHandler);
}

export default fp(workoutRoutes, { name: "workout-routes" });
