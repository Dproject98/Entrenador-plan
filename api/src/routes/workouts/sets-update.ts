import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { notFound, forbidden, badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  reps: z.number().int().positive().optional(),
  weightKg: z.number().nonnegative().nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  completed: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const updateSetHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: sessionId, setId } = request.params as { id: string; setId: string };
  const userId = (request.user as { sub: string }).sub;

  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  // Verify session ownership
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

  const existingSet = await request.server.prisma.workoutSet.findFirst({
    where: { id: setId, sessionId },
    select: { id: true },
  });

  if (!existingSet) {
    notFound(reply, "Set not found");
    return;
  }

  const set = await request.server.prisma.workoutSet.update({
    where: { id: setId },
    data: body.data,
    select: {
      id: true,
      setNumber: true,
      reps: true,
      weightKg: true,
      rpe: true,
      completed: true,
      notes: true,
      updatedAt: true,
      exercise: {
        select: { id: true, name: true, muscleGroup: true, equipment: true },
      },
    },
  });

  reply.send({ data: set });
};
