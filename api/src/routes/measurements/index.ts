import type { FastifyInstance, RouteHandlerMethod } from "fastify";
import { authenticate } from "../../hooks/authenticate.js";
import { measurementsListHandler } from "./measurements-list.js";
import { measurementsLatestHandler } from "./measurements-latest.js";
import { measurementsCreateHandler } from "./measurements-create.js";
import { measurementsDeleteHandler } from "./measurements-delete.js";

const auth = { preHandler: [authenticate] };
const h = <T>(fn: T) => fn as RouteHandlerMethod;

async function measurementsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/", auth, h(measurementsListHandler));
  fastify.get("/latest", auth, h(measurementsLatestHandler));
  fastify.post("/", auth, h(measurementsCreateHandler));
  fastify.delete("/:id", auth, h(measurementsDeleteHandler));
}

export default measurementsRoutes;
