import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { notFound, forbidden, badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.string().min(1).max(20), // e.g. "8-12", "AMRAP", "5"
  restSeconds: z.number().int().nonnegative().optional(),
  notes: z.string().max(500).optional(),
  orderIndex: z.number().int().nonnegative(),
});

export const createPlannedExerciseHandler: RouteHandler = async (
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

  // Verify exercise exists
  const exercise = await request.server.prisma.exercise.findUnique({
    where: { id: body.data.exerciseId },
    select: { id: true },
  });

  if (!exercise) {
    notFound(reply, "Exercise not found");
    return;
  }

  const planned = await request.server.prisma.plannedExercise.create({
    data: { planWorkoutId: workoutId, ...body.data },
    select: {
      id: true,
      sets: true,
      reps: true,
      restSeconds: true,
      notes: true,
      orderIndex: true,
      exercise: {
        select: { id: true, name: true, muscleGroup: true, equipment: true },
      },
    },
  });

  reply.status(201).send({ data: planned });
};
