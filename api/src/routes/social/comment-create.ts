import type { FastifyRequest, FastifyReply } from "fastify";

export async function commentCreateHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: { body: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const sessionId = request.params.id;
  const { body } = request.body;

  if (!body?.trim()) {
    return reply.status(400).send({
      error: { code: "VALIDATION_ERROR", message: "Comment body is required", statusCode: 400 },
    });
  }

  const session = await request.server.prisma.workoutSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });
  if (!session) {
    return reply.status(404).send({
      error: { code: "NOT_FOUND", message: "Session not found", statusCode: 404 },
    });
  }

  const comment = await request.server.prisma.workoutComment.create({
    data: { userId, sessionId, body: body.trim() },
    include: { user: { select: { id: true, name: true } } },
  });

  return reply.status(201).send({ data: comment });
}
