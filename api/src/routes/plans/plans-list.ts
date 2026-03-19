import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";

export const listPlansHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const userId = (request.user as { sub: string }).sub;

  const plans = await request.server.prisma.trainingPlan.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { weeks: true } },
    },
  });

  reply.send({ data: plans });
};
