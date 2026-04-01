import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

export const deletePlannedExerciseHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: trainingPlanId, weekId, workoutId, exerciseId } = request.params as {
    id: string;
    weekId: string;
    workoutId: string;
    exerciseId: string;
  };
  const userId = (request.user as { sub: string }).sub;

  // Verify ownership via the plan chain
  const planned = await request.server.prisma.plannedExercise.findFirst({
    where: {
      id: exerciseId,
      planWorkoutId: workoutId,
      planWorkout: {
        planWeekId: weekId,
        planWeek: { trainingPlanId },
      },
    },
    select: {
      id: true,
      planWorkout: {
        select: {
          planWeek: {
            select: { trainingPlan: { select: { userId: true } } },
          },
        },
      },
    },
  });

  if (!planned) {
    notFound(reply, "Planned exercise not found");
    return;
  }

  if (planned.planWorkout.planWeek.trainingPlan.userId !== userId) {
    forbidden(reply);
    return;
  }

  await request.server.prisma.plannedExercise.delete({ where: { id: exerciseId } });

  reply.status(204).send();
};
