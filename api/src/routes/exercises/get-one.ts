import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound } from "../../lib/errors.js";

export const getOneHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id } = request.params as { id: string };

  const exercise = await request.server.prisma.exercise.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      muscleGroup: true,
      equipment: true,
      description: true,
      createdAt: true,
    },
  });

  if (!exercise) {
    notFound(reply, "Exercise not found");
    return;
  }

  reply.send({ data: exercise });
};
