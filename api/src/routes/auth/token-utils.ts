import type { FastifyInstance } from "fastify";
import { createHash } from "crypto";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueTokenPair(
  fastify: FastifyInstance,
  userId: string
): Promise<TokenPair> {
  const accessToken = fastify.accessSign({ sub: userId });
  const refreshToken = fastify.refreshSign({ sub: userId });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await fastify.prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}
