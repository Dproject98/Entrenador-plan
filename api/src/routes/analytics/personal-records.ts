import type { FastifyRequest, FastifyReply } from "fastify";

// Epley formula: estimated 1RM = weight × (1 + reps/30)
function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export async function personalRecordsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;

  // Get all completed sets with weight > 0 grouped by exercise
  const sets = await request.server.prisma.workoutSet.findMany({
    where: {
      completed: true,
      weightKg: { gt: 0 },
      reps: { gt: 0 },
      session: { userId },
    },
    include: {
      exercise: { select: { id: true, name: true, muscleGroup: true } },
      session: { select: { startedAt: true } },
    },
    orderBy: { session: { startedAt: "asc" } },
  });

  // Aggregate PRs per exercise
  const exerciseMap = new Map<
    string,
    {
      exercise: { id: string; name: string; muscleGroup: string };
      maxWeightKg: number;
      maxWeightReps: number;
      maxReps: number;
      maxRepsWeight: number;
      best1RM: number;
      best1RMWeight: number;
      best1RMReps: number;
      achievedAt: Date;
      totalSets: number;
    }
  >();

  for (const set of sets) {
    const exId = set.exercise.id;
    const weight = set.weightKg!;
    const reps = set.reps!;
    const orm = epley1RM(weight, reps);
    const date = set.session.startedAt;

    const entry = exerciseMap.get(exId);
    if (!entry) {
      exerciseMap.set(exId, {
        exercise: set.exercise,
        maxWeightKg: weight,
        maxWeightReps: reps,
        maxReps: reps,
        maxRepsWeight: weight,
        best1RM: orm,
        best1RMWeight: weight,
        best1RMReps: reps,
        achievedAt: date,
        totalSets: 1,
      });
    } else {
      entry.totalSets += 1;
      if (weight > entry.maxWeightKg || (weight === entry.maxWeightKg && reps > entry.maxWeightReps)) {
        entry.maxWeightKg = weight;
        entry.maxWeightReps = reps;
        entry.achievedAt = date;
      }
      if (reps > entry.maxReps || (reps === entry.maxReps && weight > entry.maxRepsWeight)) {
        entry.maxReps = reps;
        entry.maxRepsWeight = weight;
      }
      if (orm > entry.best1RM) {
        entry.best1RM = orm;
        entry.best1RMWeight = weight;
        entry.best1RMReps = reps;
        entry.achievedAt = date;
      }
    }
  }

  const records = Array.from(exerciseMap.values())
    .map((e) => ({
      exercise: e.exercise,
      maxWeightKg: e.maxWeightKg,
      maxWeightReps: e.maxWeightReps,
      maxReps: e.maxReps,
      maxRepsWeight: e.maxRepsWeight,
      estimated1RM: e.best1RM,
      best1RMWeight: e.best1RMWeight,
      best1RMReps: e.best1RMReps,
      achievedAt: e.achievedAt.toISOString(),
      totalSets: e.totalSets,
    }))
    .sort((a, b) => b.estimated1RM - a.estimated1RM);

  return reply.send({ data: records });
}
