import type { FastifyRequest, FastifyReply } from "fastify";

export async function followCreateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const followerId = (request.user as { sub: string }).sub;
  const followingId = request.params.id;

  if (followerId === followingId) {
    return reply.status(400).send({
      error: { code: "BAD_REQUEST", message: "Cannot follow yourself", statusCode: 400 },
    });
  }

  const target = await request.server.prisma.user.findUnique({
    where: { id: followingId },
    select: { id: true },
  });
  if (!target) {
    return reply.status(404).send({
      error: { code: "NOT_FOUND", message: "User not found", statusCode: 404 },
    });
  }

  await request.server.prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });

  return reply.status(201).send({ data: { following: true } });
}
