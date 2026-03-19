import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { hashPassword } from "../../lib/password.js";
import { conflict, badRequest } from "../../lib/errors.js";
import { issueTokenPair } from "./token-utils.js";

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(100),
});

export const registerHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const result = RegisterBody.safeParse(request.body);
  if (!result.success) {
    badRequest(reply, result.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const { email, password, name } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await request.server.prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    conflict(reply, "Email already registered");
    return;
  }

  const passwordHash = await hashPassword(password);

  const user = await request.server.prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name: name.trim(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  const { accessToken, refreshToken } = await issueTokenPair(
    request.server,
    user.id
  );

  reply.status(201).send({
    data: { user, accessToken, refreshToken },
  });
};
