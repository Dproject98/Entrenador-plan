import type { FastifyRequest, FastifyReply } from "fastify";

interface CreateBody {
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
  muscleMassPct?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
}

export async function measurementsCreateHandler(
  request: FastifyRequest<{ Body: CreateBody }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const { date, ...rest } = request.body;

  if (!date) {
    return reply.status(400).send({
      error: { code: "VALIDATION_ERROR", message: "date is required", statusCode: 400 },
    });
  }

  const measurement = await request.server.prisma.bodyMeasurement.upsert({
    where: { userId_date: { userId, date: new Date(date) } },
    create: { userId, date: new Date(date), ...rest },
    update: { ...rest },
  });

  return reply.status(201).send({ data: measurement });
}
