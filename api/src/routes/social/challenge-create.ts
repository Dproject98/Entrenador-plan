import type { FastifyRequest, FastifyReply } from "fastify";
import type { ChallengeType } from "@prisma/client";

interface CreateChallengeBody {
  name: string;
  description?: string;
  type: ChallengeType;
  goal?: number;
  startDate: string;
  endDate: string;
  isPublic?: boolean;
}

export async function challengeCreateHandler(
  request: FastifyRequest<{ Body: CreateChallengeBody }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const { name, description, type, goal, startDate, endDate, isPublic = true } = request.body;

  if (!name?.trim() || !type || !startDate || !endDate) {
    return reply.status(400).send({
      error: { code: "VALIDATION_ERROR", message: "name, type, startDate and endDate are required", statusCode: 400 },
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    return reply.status(400).send({
      error: { code: "VALIDATION_ERROR", message: "endDate must be after startDate", statusCode: 400 },
    });
  }

  const now = new Date();

  const challenge = await request.server.prisma.challenge.create({
    data: {
      creatorId: userId,
      name: name.trim(),
      description: description?.trim() ?? null,
      type,
      goal: goal ?? 0,
      startDate: start,
      endDate: end,
      isPublic,
      // Auto-join creator
      participants: { create: { userId } },
    },
    include: {
      creator: { select: { id: true, name: true } },
      _count: { select: { participants: true } },
    },
  });

  const data = {
    id: challenge.id,
    name: challenge.name,
    description: challenge.description,
    type: challenge.type,
    goal: challenge.goal,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    isPublic: challenge.isPublic,
    creatorId: challenge.creatorId,
    creator: challenge.creator,
    participantsCount: challenge._count.participants,
    joinedByMe: true,
    status:
      challenge.endDate < now ? "finished" :
      challenge.startDate <= now ? "active" :
      "upcoming",
  };

  return reply.status(201).send({ data });
}
