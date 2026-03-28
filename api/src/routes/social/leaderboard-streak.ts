import type { FastifyRequest, FastifyReply } from "fastify";

interface StreakRow {
  userId: string;
  name: string;
  streakDays: number;
}

export async function leaderboardStreakHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Get all users with their workout session dates
  const users = await request.server.prisma.user.findMany({
    select: {
      id: true,
      name: true,
      workoutSessions: {
        where: { endedAt: { not: null } },
        select: { startedAt: true },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  const data: StreakRow[] = users
    .map((u) => {
      // Calculate current streak (consecutive days with at least one session)
      const sessionDates = new Set(
        u.workoutSessions.map((s) => s.startedAt.toISOString().split("T")[0])
      );

      let streak = 0;
      const today = new Date();

      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        if (sessionDates.has(dateStr)) {
          streak++;
        } else if (i > 0) {
          break; // streak broken
        }
      }

      return { userId: u.id, name: u.name, streakDays: streak };
    })
    .filter((u) => u.streakDays > 0)
    .sort((a, b) => b.streakDays - a.streakDays)
    .slice(0, 20)
    .map((u, i) => ({ ...u, rank: i + 1 }));

  return reply.send({ data });
}
