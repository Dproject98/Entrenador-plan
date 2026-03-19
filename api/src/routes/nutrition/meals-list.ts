import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export const listMealsHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const query = QuerySchema.safeParse(request.query);
  if (!query.success) {
    reply.status(400).send({
      error: { code: "VALIDATION_ERROR", message: query.error.issues[0]?.message ?? "Invalid query", statusCode: 400 },
    });
    return;
  }

  const userId = (request.user as { sub: string }).sub;
  const date = new Date(query.data.date);

  const meals = await request.server.prisma.mealLog.findMany({
    where: { userId, date },
    orderBy: { mealType: "asc" },
    select: {
      id: true,
      date: true,
      mealType: true,
      createdAt: true,
      _count: { select: { entries: true } },
    },
  });

  reply.send({ data: meals });
};
