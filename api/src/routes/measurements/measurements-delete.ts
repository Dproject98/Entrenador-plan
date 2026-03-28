import type { FastifyRequest, FastifyReply } from "fastify";

export async function measurementsDeleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const { id } = request.params;

  const measurement = await request.server.prisma.bodyMeasurement.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!measurement) {
    return reply.status(404).send({
      error: { code: "NOT_FOUND", message: "Measurement not found", statusCode: 404 },
    });
  }

  if (measurement.userId !== userId) {
    return reply.status(403).send({
      error: { code: "FORBIDDEN", message: "Cannot delete another user's measurement", statusCode: 403 },
    });
  }

  await request.server.prisma.bodyMeasurement.delete({ where: { id } });

  return reply.status(204).send();
}
