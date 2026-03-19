import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

export const deleteSetHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: sessionId, setId } = request.params as { id: string; setId: string };
  const userId = (request.user as { sub: string }).sub;

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

  await request.server.prisma.workoutSet.delete({ where: { id: setId } });

  reply.status(204).send();
};
