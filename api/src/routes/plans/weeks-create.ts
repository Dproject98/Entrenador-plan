import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { notFound, forbidden, badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  weekNumber: z.number().int().positive(),
});

export const createWeekHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: trainingPlanId } = request.params as { id: string };
  const userId = (request.user as { sub: string }).sub;

  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const plan = await request.server.prisma.trainingPlan.findUnique({
    where: { id: trainingPlanId },
    select: { userId: true },
  });

  if (!plan) {
    notFound(reply, "Plan not found");
    return;
  }

  if (plan.userId !== userId) {
    forbidden(reply);
    return;
  }

  try {
    const week = await request.server.prisma.planWeek.create({
      data: { trainingPlanId, weekNumber: body.data.weekNumber },
      select: { id: true, weekNumber: true, createdAt: true },
    });

    reply.status(201).send({ data: week });
  } catch (err: unknown) {
    // Unique constraint: @@unique([trainingPlanId, weekNumber])
    if ((err as { code?: string }).code === "P2002") {
      badRequest(reply, `Week ${body.data.weekNumber} already exists in this plan`);
      return;
    }
    throw err;
  }
};
