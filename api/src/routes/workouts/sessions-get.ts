import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

export const getSessionHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id } = request.params as { id: string };
  const userId = (request.user as { sub: string }).sub;

  const session = await request.server.prisma.workoutSession.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      name: true,
      startedAt: true,
      endedAt: true,
      notes: true,
      planWorkoutId: true,
      createdAt: true,
      updatedAt: true,
      sets: {
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
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
      },
    },
  });

  if (!session) {
    notFound(reply, "Session not found");
    return;
  }

  if (session.userId !== userId) {
    forbidden(reply);
    return;
  }

  const { userId: _, ...sessionData } = session;
  reply.send({ data: sessionData });
};
