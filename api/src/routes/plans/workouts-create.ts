import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { notFound, forbidden, badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  name: z.string().max(100).optional(),
});

export const createWorkoutHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: trainingPlanId, weekId } = request.params as { id: string; weekId: string };
  const userId = (request.user as { sub: string }).sub;

  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  // Verify plan ownership and week belongs to plan
  const week = await request.server.prisma.planWeek.findFirst({
    where: { id: weekId, trainingPlanId },
    select: { id: true, trainingPlan: { select: { userId: true } } },
  });

  if (!week) {
    notFound(reply, "Week not found");
    return;
  }

  if (week.trainingPlan.userId !== userId) {
    forbidden(reply);
    return;
  }

  const workout = await request.server.prisma.planWorkout.create({
    data: { planWeekId: weekId, dayOfWeek: body.data.dayOfWeek, name: body.data.name },
    select: {
      id: true,
      dayOfWeek: true,
      name: true,
      createdAt: true,
    },
  });

  reply.status(201).send({ data: workout });
};
