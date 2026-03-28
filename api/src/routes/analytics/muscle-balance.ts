import type { FastifyRequest, FastifyReply } from "fastify";

// Returns last 4 weeks of sets per muscle group — used to detect imbalance
export async function muscleBalanceHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const sets = await request.server.prisma.workoutSet.findMany({
    where: {
      completed: true,
      session: { userId, startedAt: { gte: since } },
    },
    include: {
      exercise: { select: { muscleGroup: true } },
    },
  });

  const muscleMap = new Map<string, number>();
  for (const set of sets) {
    const mg = set.exercise.muscleGroup;
    muscleMap.set(mg, (muscleMap.get(mg) ?? 0) + 1);
  }

  const total = sets.length || 1;
  const distribution = Array.from(muscleMap.entries())
    .map(([muscleGroup, count]) => ({
      muscleGroup,
      sets: count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.sets - a.sets);

  return reply.send({ data: distribution });
}
