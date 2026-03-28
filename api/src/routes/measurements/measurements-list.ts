import type { FastifyRequest, FastifyReply } from "fastify";

export async function measurementsListHandler(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string; from?: string; to?: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const page = Math.max(1, parseInt(request.query.page ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(request.query.limit ?? "30")));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };
  if (request.query.from || request.query.to) {
    where.date = {
      ...(request.query.from ? { gte: new Date(request.query.from) } : {}),
      ...(request.query.to ? { lte: new Date(request.query.to) } : {}),
    };
  }

  const [items, total] = await Promise.all([
    request.server.prisma.bodyMeasurement.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip,
    }),
    request.server.prisma.bodyMeasurement.count({ where }),
  ]);

  return reply.send({ data: items, meta: { page, limit, total } });
}
