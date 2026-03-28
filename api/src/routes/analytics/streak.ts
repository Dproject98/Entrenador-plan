import type { FastifyRequest, FastifyReply } from "fastify";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

export async function streakHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as { sub: string }).sub;

  // Get all distinct session dates sorted desc
  const sessions = await request.server.prisma.workoutSession.findMany({
    where: { userId, endedAt: { not: null } },
    select: { startedAt: true },
    orderBy: { startedAt: "desc" },
  });

  // Distinct days
  const daySet = new Set(sessions.map((s) => toDateStr(s.startedAt)));
  const days = Array.from(daySet).sort().reverse(); // newest first

  if (days.length === 0) {
    return reply.send({
      data: {
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: null,
        thisWeekSessions: 0,
        thisWeekDays: [] as string[],
      },
    });
  }

  // Current streak: count consecutive days backwards from today or yesterday
  const today = toDateStr(new Date());
  const yesterday = toDateStr(addDays(new Date(), -1));

  let currentStreak = 0;
  let cursor = today;

  // Allow gap of 1 day (if last session was yesterday, streak is still alive)
  if (days[0] !== today && days[0] !== yesterday) {
    currentStreak = 0;
  } else {
    cursor = days[0];
    for (const day of days) {
      if (day === cursor) {
        currentStreak++;
        cursor = toDateStr(addDays(new Date(cursor), -1));
      } else {
        break;
      }
    }
  }

  // Longest streak (all time)
  let longestStreak = 0;
  let runStreak = 0;
  let prevDay: string | null = null;
  for (const day of [...days].reverse()) {
    if (!prevDay) {
      runStreak = 1;
    } else {
      const expected = toDateStr(addDays(new Date(prevDay), 1));
      if (day === expected) {
        runStreak++;
      } else {
        runStreak = 1;
      }
    }
    if (runStreak > longestStreak) longestStreak = runStreak;
    prevDay = day;
  }

  // This week sessions (Mon–Sun of current week)
  const now = new Date();
  const dow = now.getUTCDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStart = toDateStr(addDays(now, mondayOffset));
  const weekEnd = toDateStr(addDays(now, mondayOffset + 6));
  const thisWeekDays = days.filter((d) => d >= weekStart && d <= weekEnd);

  return reply.send({
    data: {
      currentStreak,
      longestStreak,
      lastSessionDate: days[0],
      thisWeekSessions: thisWeekDays.length,
      thisWeekDays,
    },
  });
}
