import type { FastifyRequest, FastifyReply } from "fastify";

export async function feedListHandler(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const page = Math.max(1, parseInt(request.query.page ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(request.query.limit ?? "20")));
  const skip = (page - 1) * limit;

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // Get IDs of users this person follows
  const follows = await request.server.prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);

  // Include own posts in feed too
  const feedUserIds = [userId, ...followingIds];

  const [sessions, total] = await Promise.all([
    request.server.prisma.workoutSession.findMany({
      where: {
        userId: { in: feedUserIds },
        endedAt: { not: null },
        startedAt: { gte: twoWeeksAgo },
      },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { sets: true, likes: true, comments: true } },
        likes: { where: { userId }, select: { id: true } },
      },
      orderBy: { startedAt: "desc" },
      take: limit,
      skip,
    }),
    request.server.prisma.workoutSession.count({
      where: {
        userId: { in: feedUserIds },
        endedAt: { not: null },
        startedAt: { gte: twoWeeksAgo },
      },
    }),
  ]);

  const data = sessions.map((s) => ({
    id: s.id,
    name: s.name,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    notes: s.notes,
    user: s.user,
    setsCount: s._count.sets,
    likesCount: s._count.likes,
    commentsCount: s._count.comments,
    likedByMe: s.likes.length > 0,
  }));

  return reply.send({
    data,
    meta: { page, limit, total },
  });
}
