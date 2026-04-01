import type { FastifyInstance, FastifyRequest, FastifyReply, RouteHandlerMethod } from "fastify";
import { authenticate } from "../../hooks/authenticate.js";
import type { CardioType } from "@prisma/client";

const auth = { preHandler: [authenticate] };
const h = <T>(fn: T) => fn as RouteHandlerMethod;

// ─── List ─────────────────────────────────────────────────────────────────────

async function listHandler(
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
    request.server.prisma.cardioLog.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip,
    }),
    request.server.prisma.cardioLog.count({ where }),
  ]);

  return reply.send({ data: items, meta: { page, limit, total } });
}

// ─── Create ───────────────────────────────────────────────────────────────────

async function createHandler(
  request: FastifyRequest<{
    Body: {
      date: string;
      type: CardioType;
      durationMin: number;
      distanceKm?: number;
      caloriesBurned?: number;
      avgHeartRate?: number;
      notes?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const { date, type, durationMin, distanceKm, caloriesBurned, avgHeartRate, notes } = request.body;

  const log = await request.server.prisma.cardioLog.create({
    data: {
      userId,
      date: new Date(date),
      type,
      durationMin,
      distanceKm: distanceKm ?? null,
      caloriesBurned: caloriesBurned ?? null,
      avgHeartRate: avgHeartRate ?? null,
      notes: notes?.trim() ?? null,
    },
  });

  return reply.status(201).send({ data: log });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const log = await request.server.prisma.cardioLog.findUnique({
    where: { id: request.params.id },
  });
  if (!log || log.userId !== userId) {
    return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Log not found", statusCode: 404 } });
  }
  await request.server.prisma.cardioLog.delete({ where: { id: request.params.id } });
  return reply.status(204).send();
}

// ─── Stats ────────────────────────────────────────────────────────────────────

async function statsHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as { sub: string }).sub;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const logs = await request.server.prisma.cardioLog.findMany({
    where: { userId, date: { gte: since } },
  });

  const totalSessions = logs.length;
  const totalMinutes = logs.reduce((s, l) => s + l.durationMin, 0);
  const totalDistanceKm = logs.reduce((s, l) => s + (l.distanceKm ?? 0), 0);
  const totalCalories = logs.reduce((s, l) => s + (l.caloriesBurned ?? 0), 0);

  const byType = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.type] = (acc[l.type] ?? 0) + 1;
    return acc;
  }, {});

  return reply.send({
    data: { totalSessions, totalMinutes, totalDistanceKm, totalCalories, byType },
  });
}

// ─── Register ─────────────────────────────────────────────────────────────────

async function cardioRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/stats", auth, h(statsHandler));   // must be before /:id
  fastify.get("/", auth, h(listHandler));
  fastify.post("/", auth, h(createHandler));
  fastify.delete("/:id", auth, h(deleteHandler));
}

export default cardioRoutes;
