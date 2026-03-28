import type { FastifyRequest, FastifyReply } from "fastify";

type Period = "week" | "month" | "3months";

function periodToDate(period: Period): Date {
  const now = new Date();
  if (period === "week") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === "month") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
}

// ISO week string e.g. "2025-W12"
function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function trainingLoadHandler(
  request: FastifyRequest<{ Querystring: { period?: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const period = (request.query.period ?? "month") as Period;
  const since = periodToDate(period);

  // Fetch all completed sets within the period with exercise muscle group
  const sets = await request.server.prisma.workoutSet.findMany({
    where: {
      completed: true,
      session: {
        userId,
        startedAt: { gte: since },
      },
    },
    include: {
      exercise: { select: { muscleGroup: true } },
      session: { select: { startedAt: true } },
    },
  });

  // Sessions count
  const sessionIds = new Set(sets.map((s) => s.sessionId));

  // Aggregate by muscle group
  const muscleMap = new Map<string, { volume: number; sets: number }>();
  // Weekly trend: week → { volume, sessions set }
  const weekMap = new Map<string, { volume: number; sessionIds: Set<string> }>();

  let totalVolume = 0;

  for (const set of sets) {
    const reps = set.reps ?? 0;
    const weight = set.weightKg ?? 0;
    const volume = reps * weight;
    const mg = set.exercise.muscleGroup;
    const week = isoWeek(set.session.startedAt);

    // By muscle group
    const mgEntry = muscleMap.get(mg) ?? { volume: 0, sets: 0 };
    mgEntry.volume += volume;
    mgEntry.sets += 1;
    muscleMap.set(mg, mgEntry);

    // By week
    const weekEntry = weekMap.get(week) ?? { volume: 0, sessionIds: new Set() };
    weekEntry.volume += volume;
    weekEntry.sessionIds.add(set.sessionId);
    weekMap.set(week, weekEntry);

    totalVolume += volume;
  }

  const byMuscleGroup = Array.from(muscleMap.entries())
    .map(([muscleGroup, v]) => ({ muscleGroup, volume: Math.round(v.volume), sets: v.sets }))
    .sort((a, b) => b.volume - a.volume);

  const weeklyTrend = Array.from(weekMap.entries())
    .map(([week, v]) => ({
      week,
      volume: Math.round(v.volume),
      sessions: v.sessionIds.size,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  return reply.send({
    data: {
      period,
      totalVolume: Math.round(totalVolume),
      totalSets: sets.length,
      sessionsCount: sessionIds.size,
      byMuscleGroup,
      weeklyTrend,
    },
  });
}
