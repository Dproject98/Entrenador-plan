import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import { config } from "../config.js";

async function jwtPlugin(fastify: FastifyInstance): Promise<void> {
  // Access token — short-lived (15 minutes)
  await fastify.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: "15m" },
    namespace: "access",
    jwtVerify: "accessVerify",
    jwtSign: "accessSign",
  });

  // Refresh token — long-lived (30 days)
  await fastify.register(fastifyJwt, {
    secret: config.JWT_REFRESH_SECRET,
    sign: { expiresIn: "30d" },
    namespace: "refresh",
    jwtVerify: "refreshVerify",
    jwtSign: "refreshSign",
  });
}

export default fp(jwtPlugin, {
  name: "jwt",
  fastify: "5.x",
});

declare module "fastify" {
  interface FastifyRequest {
    accessVerify(): Promise<{ sub: string }>;
    refreshVerify(): Promise<{ sub: string }>;
  }
  interface FastifyInstance {
    accessSign(payload: { sub: string }): string;
    refreshSign(payload: { sub: string }): string;
  }
}
