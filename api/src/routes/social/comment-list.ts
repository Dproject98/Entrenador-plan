import type { FastifyRequest, FastifyReply } from "fastify";

export async function commentListHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const sessionId = request.params.id;

  const comments = await request.server.prisma.workoutComment.findMany({
    where: { sessionId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return reply.send({ data: comments });
}
