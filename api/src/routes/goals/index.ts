import type { FastifyInstance, FastifyRequest, FastifyReply, RouteHandlerMethod } from "fastify";
import { authenticate } from "../../hooks/authenticate.js";

const auth = { preHandler: [authenticate] };
const h = <T>(fn: T) => fn as RouteHandlerMethod;

async function getGoalsHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as { sub: string }).sub;
  const goal = await request.server.prisma.userGoal.findUnique({ where: { userId } });
  // Return defaults if no goal set yet
  return reply.send({
    data: goal ?? { weeklySessionsTarget: 3, weeklyVolumeKgTarget: null },
  });
}

async function upsertGoalsHandler(
  request: FastifyRequest<{
    Body: { weeklySessionsTarget?: number; weeklyVolumeKgTarget?: number | null };
  }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const { weeklySessionsTarget, weeklyVolumeKgTarget } = request.body;

  const goal = await request.server.prisma.userGoal.upsert({
    where: { userId },
    create: {
      userId,
      weeklySessionsTarget: weeklySessionsTarget ?? 3,
      weeklyVolumeKgTarget: weeklyVolumeKgTarget ?? null,
    },
    update: {
      ...(weeklySessionsTarget !== undefined ? { weeklySessionsTarget } : {}),
      ...(weeklyVolumeKgTarget !== undefined ? { weeklyVolumeKgTarget } : {}),
    },
  });

  return reply.send({ data: goal });
}

async function goalsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/", auth, h(getGoalsHandler));
  fastify.put("/", auth, h(upsertGoalsHandler));
}

export default goalsRoutes;
