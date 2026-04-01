import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { notFound, forbidden, badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  exerciseId: z.string().min(1),
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive().optional(),
  weightKg: z.number().nonnegative().optional(),
  rpe: z.number().min(1).max(10).optional(),
  completed: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const createSetHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: sessionId } = request.params as { id: string };
  const userId = (request.user as { sub: string }).sub;

  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const session = await request.server.prisma.workoutSession.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });

  if (!session) {
    notFound(reply, "Session not found");
    return;
  }

  if (session.userId !== userId) {
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

  const set = await request.server.prisma.workoutSet.create({
    data: {
      sessionId,
      exerciseId: body.data.exerciseId,
      setNumber: body.data.setNumber,
      reps: body.data.reps ?? null,
      weightKg: body.data.weightKg ?? null,
      rpe: body.data.rpe ?? null,
      completed: body.data.completed ?? false,
      notes: body.data.notes ?? null,
    },
    select: {
      id: true,
      setNumber: true,
      reps: true,
      weightKg: true,
      rpe: true,
      completed: true,
      notes: true,
      exercise: {
        select: { id: true, name: true, muscleGroup: true, equipment: true },
      },
    },
  });

  reply.status(201).send({ data: set });
};
