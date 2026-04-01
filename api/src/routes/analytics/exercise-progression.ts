import type { FastifyRequest, FastifyReply } from "fastify";

function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export async function exerciseProgressionHandler(
  request: FastifyRequest<{ Params: { exerciseId: string }; Querystring: { limit?: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const { exerciseId } = request.params;
  const limit = Math.min(100, Math.max(5, parseInt(request.query.limit ?? "30")));

  // Verify exercise exists
  const exercise = await request.server.prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true, name: true, muscleGroup: true },
  });
  if (!exercise) {
    return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Exercise not found", statusCode: 404 } });
  }

  // Get best set per session for this exercise (max estimated 1RM per session day)
  const sets = await request.server.prisma.workoutSet.findMany({
    where: {
      exerciseId,
      completed: true,
      weightKg: { gt: 0 },
      reps: { gt: 0 },
      session: { userId },
    },
    include: { session: { select: { startedAt: true } } },
    orderBy: { session: { startedAt: "asc" } },
    take: limit * 10, // over-fetch to find best per session
  });

  // Group by session date (day), keep best 1RM per day
  const dayMap = new Map<
    string,
    { date: string; weightKg: number; reps: number; estimated1RM: number }
  >();

  for (const set of sets) {
    const day = set.session.startedAt.toISOString().split("T")[0]!;
    const orm = epley1RM(set.weightKg!, set.reps!);
    const existing = dayMap.get(day);
    if (!existing || orm > existing.estimated1RM) {
      dayMap.set(day, {
        date: day,
        weightKg: set.weightKg!,
        reps: set.reps!,
        estimated1RM: orm,
      });
    }
  }

  const progression = Array.from(dayMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);

  return reply.send({ data: { exercise, progression } });
}
