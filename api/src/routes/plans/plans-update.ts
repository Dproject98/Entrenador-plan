import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { notFound, forbidden, badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const updatePlanHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id } = request.params as { id: string };
  const userId = (request.user as { sub: string }).sub;

  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

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

  const plan = await request.server.prisma.trainingPlan.update({
    where: { id },
    data: body.data,
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      updatedAt: true,
    },
  });

  reply.send({ data: plan });
};
