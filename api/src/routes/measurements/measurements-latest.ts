import type { FastifyRequest, FastifyReply } from "fastify";

export async function measurementsLatestHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;

  const latest = await request.server.prisma.bodyMeasurement.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return reply.send({ data: latest ?? null });
}
