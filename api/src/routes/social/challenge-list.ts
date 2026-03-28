import type { FastifyRequest, FastifyReply } from "fastify";

export async function challengeListHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const now = new Date();

  const challenges = await request.server.prisma.challenge.findMany({
    where: {
      OR: [
        { isPublic: true },
        { participants: { some: { userId } } },
        { creatorId: userId },
      ],
    },
    include: {
      creator: { select: { id: true, name: true } },
      _count: { select: { participants: true } },
      participants: { where: { userId }, select: { joinedAt: true } },
    },
    orderBy: { startDate: "asc" },
  });

  const data = challenges.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    type: c.type,
    goal: c.goal,
    startDate: c.startDate,
    endDate: c.endDate,
    isPublic: c.isPublic,
    creatorId: c.creatorId,
    creator: c.creator,
    participantsCount: c._count.participants,
    joinedByMe: c.participants.length > 0,
    status:
      c.endDate < now ? "finished" :
      c.startDate <= now ? "active" :
      "upcoming",
  }));

  return reply.send({ data });
}
