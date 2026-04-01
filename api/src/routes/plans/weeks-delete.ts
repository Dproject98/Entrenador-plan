import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

export const deleteWeekHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: trainingPlanId, weekId } = request.params as {
    id: string;
    weekId: string;
  };
  const userId = (request.user as { sub: string }).sub;

  const week = await request.server.prisma.planWeek.findFirst({
    where: { id: weekId, trainingPlanId },
    select: {
      id: true,
      trainingPlan: { select: { userId: true } },
    },
  });

  if (!week) {
    notFound(reply, "Week not found");
    return;
  }

  if (week.trainingPlan.userId !== userId) {
    forbidden(reply);
    return;
  }

  await request.server.prisma.planWeek.delete({ where: { id: weekId } });

  reply.status(204).send();
};
