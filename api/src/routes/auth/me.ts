import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound } from "../../lib/errors.js";

export const meHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const jwtPayload = request.user as { sub: string };

  const user = await request.server.prisma.user.findUnique({
    where: { id: jwtPayload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    notFound(reply, "User not found");
    return;
  }

  reply.send({ data: user });
};
