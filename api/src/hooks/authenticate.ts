import type { FastifyRequest, FastifyReply } from "fastify";
import { unauthorized } from "../lib/errors.js";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.accessVerify();
  } catch {
    unauthorized(reply);
  }
}
