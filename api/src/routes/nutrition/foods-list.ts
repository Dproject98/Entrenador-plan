import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";

const QuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const listFoodsHandler: RouteHandler = async (
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

  const { q, page, limit } = query.data;
  const userId = (request.user as { sub: string } | undefined)?.sub;
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      // Public foods OR user's private foods
      {
        OR: [
          { isPrivate: false },
          ...(userId ? [{ isPrivate: true, userId }] : []),
        ],
      },
      // Name/brand search
      ...(q
        ? [
            {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { brandName: { contains: q, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  };

  const [foods, total] = await Promise.all([
    request.server.prisma.food.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        brandName: true,
        caloriesPer100g: true,
        proteinPer100g: true,
        carbsPer100g: true,
        fatPer100g: true,
        isPrivate: true,
        userId: true,
      },
    }),
    request.server.prisma.food.count({ where }),
  ]);

  reply.send({ data: foods, meta: { page, limit, total } });
};
