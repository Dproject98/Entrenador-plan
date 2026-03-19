import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export const listSessionsHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const query = QuerySchema.safeParse(request.query);
  if (!query.success) {
    reply.status(400).send({
      error: { code: "VALIDATION_ERROR", message: "Invalid query params", statusCode: 400 },
    });
    return;
  }

  const { page, limit, from, to } = query.data;
  const userId = (request.user as { sub: string }).sub;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(from || to
      ? {
          startedAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [sessions, total] = await Promise.all([
    request.server.prisma.workoutSession.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        name: true,
        startedAt: true,
        endedAt: true,
        notes: true,
        planWorkoutId: true,
        _count: { select: { sets: true } },
      },
    }),
    request.server.prisma.workoutSession.count({ where }),
  ]);

  reply.send({
    data: sessions,
    meta: { page, limit, total },
  });
};
