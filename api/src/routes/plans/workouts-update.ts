import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { notFound, forbidden, badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7).optional(),
  name: z.string().max(100).nullable().optional(),
});

export const updateWorkoutHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: trainingPlanId, weekId, workoutId } = request.params as {
    id: string;
    weekId: string;
    workoutId: string;
  };
  const userId = (request.user as { sub: string }).sub;

  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const workout = await request.server.prisma.planWorkout.findFirst({
    where: { id: workoutId, planWeekId: weekId, planWeek: { trainingPlanId } },
    select: { id: true, planWeek: { select: { trainingPlan: { select: { userId: true } } } } },
  });

  if (!workout) {
    notFound(reply, "Workout not found");
    return;
  }

  if (workout.planWeek.trainingPlan.userId !== userId) {
    forbidden(reply);
    return;
  }

  const updated = await request.server.prisma.planWorkout.update({
    where: { id: workoutId },
    data: body.data,
    select: { id: true, dayOfWeek: true, name: true, updatedAt: true },
  });

  reply.send({ data: updated });
};
