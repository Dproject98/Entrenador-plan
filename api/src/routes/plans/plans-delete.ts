import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

export const deletePlanHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id } = request.params as { id: string };
  const userId = (request.user as { sub: string }).sub;

  const existing = await request.server.prisma.trainingPlan.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing) {
    notFound(reply, "Plan not found");
    return;
  }

  if (existing.userId !== userId) {
    forbidden(reply);
    return;
  }

  await request.server.prisma.trainingPlan.delete({ where: { id } });

  reply.status(204).send();
};
