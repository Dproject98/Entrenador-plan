import type { FastifyRequest, FastifyReply } from "fastify";

export async function likeDeleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const sessionId = request.params.id;

  await request.server.prisma.workoutLike.deleteMany({
    where: { userId, sessionId },
  });

  return reply.status(200).send({ data: { liked: false } });
}
