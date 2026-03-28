import type { FastifyRequest, FastifyReply } from "fastify";

export async function challengeJoinHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const challengeId = request.params.id;

  const challenge = await request.server.prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { id: true, endDate: true, isPublic: true, creatorId: true },
  });

  if (!challenge) {
    return reply.status(404).send({
      error: { code: "NOT_FOUND", message: "Challenge not found", statusCode: 404 },
    });
  }

  if (challenge.endDate < new Date()) {
    return reply.status(400).send({
      error: { code: "BAD_REQUEST", message: "Challenge has already ended", statusCode: 400 },
    });
  }

  await request.server.prisma.challengeParticipant.upsert({
    where: { challengeId_userId: { challengeId, userId } },
    create: { challengeId, userId },
    update: {},
  });

  return reply.status(201).send({ data: { joined: true } });
}
