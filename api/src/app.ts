import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import sensible from "@fastify/sensible";
import prismaPlugin from "./plugins/prisma.js";
import jwtPlugin from "./plugins/jwt.js";
import corsPlugin from "./plugins/cors.js";
import authRoutes from "./routes/auth/index.js";
import exerciseRoutes from "./routes/exercises/index.js";
import workoutRoutes from "./routes/workouts/index.js";
import nutritionRoutes from "./routes/nutrition/index.js";
import planRoutes from "./routes/plans/index.js";
import { config } from "./config.js";

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger:
      config.NODE_ENV === "production"
        ? { level: "info" }
        : config.NODE_ENV === "test"
          ? false
          : { level: "debug", transport: { target: "pino-pretty" } },
  });

  // --- Plugins ---
  await fastify.register(sensible);
  await fastify.register(corsPlugin);
  await fastify.register(prismaPlugin);
  await fastify.register(jwtPlugin);

  // --- Routes ---
  await fastify.register(authRoutes, { prefix: "/api/v1/auth" });
  await fastify.register(exerciseRoutes, { prefix: "/api/v1/exercises" });
  await fastify.register(workoutRoutes, { prefix: "/api/v1" });
  await fastify.register(nutritionRoutes, { prefix: "/api/v1" });
  await fastify.register(planRoutes, { prefix: "/api/v1" });

  // --- Global error handler ---
  fastify.setErrorHandler(async (error, request, reply) => {
    if (error.validation) {
      reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          statusCode: 400,
        },
      });
      return;
    }

    request.log.error({ err: error }, "Unhandled error");

    reply.status(error.statusCode ?? 500).send({
      error: {
        code: "INTERNAL_ERROR",
        message:
          config.NODE_ENV === "production"
            ? "Internal server error"
            : error.message,
        statusCode: error.statusCode ?? 500,
      },
    });
  });

  // --- 404 handler ---
  fastify.setNotFoundHandler(async (_request, reply) => {
    reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
        statusCode: 404,
      },
    });
  });

  return fastify;
}
