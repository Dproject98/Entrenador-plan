import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { listHandler } from "./list.js";
import { getOneHandler } from "./get-one.js";

async function exerciseRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/", listHandler);
  fastify.get("/:id", getOneHandler);
}

export default fp(exerciseRoutes, { name: "exercise-routes" });
