import type { FastifyInstance } from "fastify";
import { registerHandler } from "./register.js";
import { loginHandler } from "./login.js";
import { refreshHandler } from "./refresh.js";
import { meHandler } from "./me.js";
import { authenticate } from "../../hooks/authenticate.js";

async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/register", registerHandler);
  fastify.post("/login", loginHandler);
  fastify.post("/refresh", refreshHandler);
  fastify.get("/me", { preHandler: [authenticate] }, meHandler);
}

export default authRoutes;
