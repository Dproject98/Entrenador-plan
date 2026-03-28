import type { FastifyRequest, FastifyReply } from "fastify";

export async function commentDeleteHandler(
  request: FastifyRequest<{ Params: { id: string; commentId: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const { commentId } = request.params;

  const comment = await request.server.prisma.workoutComment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true },
  });

  if (!comment) {
    return reply.status(404).send({
      error: { code: "NOT_FOUND", message: "Comment not found", statusCode: 404 },
    });
  }

  if (comment.userId !== userId) {
    return reply.status(403).send({
      error: { code: "FORBIDDEN", message: "Cannot delete another user's comment", statusCode: 403 },
    });
  }

  await request.server.prisma.workoutComment.delete({ where: { id: commentId } });

  return reply.status(204).send();
}
