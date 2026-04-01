import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { badRequest, unauthorized } from "../../lib/errors.js";
import { issueTokenPair, hashToken } from "./token-utils.js";

const RefreshBody = z.object({
  refreshToken: z.string().min(1),
});

export const refreshHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const result = RefreshBody.safeParse(request.body);
  if (!result.success) {
    badRequest(reply, "refreshToken is required");
    return;
  }

  const { refreshToken } = result.data;

  let payload: { sub: string };
  try {
    payload = await request.refreshVerify();
  } catch {
    unauthorized(reply, "Invalid or expired refresh token");
    return;
  }

  const tokenHash = hashToken(refreshToken);

  const storedToken = await request.server.prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!storedToken || storedToken.userId !== payload.sub) {
    unauthorized(reply, "Refresh token not found or already used");
    return;
  }

  if (storedToken.expiresAt < new Date()) {
    await request.server.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    unauthorized(reply, "Refresh token expired");
    return;
  }

  // Rotate: delete old token, issue new pair
  await request.server.prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(
    request.server,
    storedToken.userId
  );

  reply.send({
    data: { accessToken, refreshToken: newRefreshToken },
  });
};
