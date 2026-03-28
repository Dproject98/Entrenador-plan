import type { FastifyRequest, FastifyReply } from "fastify";

export async function followDeleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const followerId = (request.user as { sub: string }).sub;
  const followingId = request.params.id;

  await request.server.prisma.follow.deleteMany({
    where: { followerId, followingId },
  });

  return reply.status(200).send({ data: { following: false } });
}
