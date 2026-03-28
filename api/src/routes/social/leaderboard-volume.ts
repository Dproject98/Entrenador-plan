import type { FastifyRequest, FastifyReply } from "fastify";

interface VolumeRow {
  userId: string;
  name: string;
  totalVolume: bigint | number;
  sessionsCount: bigint | number;
}

export async function leaderboardVolumeHandler(
  request: FastifyRequest<{ Querystring: { period?: "week" | "month" | "all" } }>,
  reply: FastifyReply
) {
  const period = request.query.period ?? "week";

  let since: Date | undefined;
  const now = new Date();
  if (period === "week") {
    since = new Date(now);
    since.setDate(since.getDate() - since.getDay()); // start of week (Sunday)
    since.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    since = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const whereClause = since
    ? `AND ws.started_at >= '${since.toISOString()}'`
    : "";

  const rows = await request.server.prisma.$queryRawUnsafe<VolumeRow[]>(`
    SELECT
      u.id       AS "userId",
      u.name     AS "name",
      COALESCE(SUM(wset.weight_kg * wset.reps), 0) AS "totalVolume",
      COUNT(DISTINCT ws.id)                         AS "sessionsCount"
    FROM users u
    INNER JOIN workout_sessions ws  ON ws.user_id = u.id AND ws.ended_at IS NOT NULL ${whereClause}
    INNER JOIN workout_sets    wset ON wset.session_id = ws.id AND wset.completed = true
    GROUP BY u.id, u.name
    ORDER BY "totalVolume" DESC
    LIMIT 20
  `);

  const data = rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    name: r.name,
    totalVolume: Number(r.totalVolume),
    sessionsCount: Number(r.sessionsCount),
  }));

  return reply.send({ data, period });
}
