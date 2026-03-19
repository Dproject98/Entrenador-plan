import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

export const deleteFoodHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id } = request.params as { id: string };
  const userId = (request.user as { sub: string }).sub;

  const existing = await request.server.prisma.food.findUnique({
    where: { id },
    select: { userId: true, isPrivate: true },
  });

  if (!existing || !existing.isPrivate) {
    notFound(reply, "Food not found");
    return;
  }

  if (existing.userId !== userId) {
    forbidden(reply);
    return;
  }

  await request.server.prisma.food.delete({ where: { id } });

  reply.status(204).send();
};
