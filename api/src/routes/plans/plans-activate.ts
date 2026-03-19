import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

export const activatePlanHandler: RouteHandler = async (
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

  // Deactivate all, then activate this one — atomic transaction
  const [, plan] = await request.server.prisma.$transaction([
    request.server.prisma.trainingPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    }),
    request.server.prisma.trainingPlan.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, name: true, isActive: true, updatedAt: true },
    }),
  ]);

  reply.send({ data: plan });
};
