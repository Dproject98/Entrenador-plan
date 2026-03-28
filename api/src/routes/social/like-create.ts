import type { FastifyRequest, FastifyReply } from "fastify";

export async function likeCreateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const sessionId = request.params.id;

  const session = await request.server.prisma.workoutSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });
  if (!session) {
    return reply.status(404).send({
      error: { code: "NOT_FOUND", message: "Session not found", statusCode: 404 },
    });
  }

  await request.server.prisma.workoutLike.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    create: { userId, sessionId },
    update: {},
  });

  return reply.status(201).send({ data: { liked: true } });
}
