import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

export const deleteWorkoutHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: trainingPlanId, weekId, workoutId } = request.params as {
    id: string;
    weekId: string;
    workoutId: string;
  };
  const userId = (request.user as { sub: string }).sub;

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

  await request.server.prisma.planWorkout.delete({ where: { id: workoutId } });

  reply.status(204).send();
};
