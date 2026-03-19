import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { notFound, forbidden, badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  quantityG: z.number().positive(),
});

export const updateEntryHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: mealLogId, entryId } = request.params as { id: string; entryId: string };
  const userId = (request.user as { sub: string }).sub;

  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const meal = await request.server.prisma.mealLog.findUnique({
    where: { id: mealLogId },
    select: { userId: true },
  });

  if (!meal) {
    notFound(reply, "Meal log not found");
    return;
  }

  if (meal.userId !== userId) {
    forbidden(reply);
    return;
  }

  const existingEntry = await request.server.prisma.mealEntry.findFirst({
    where: { id: entryId, mealLogId },
    select: { id: true },
  });

  if (!existingEntry) {
    notFound(reply, "Entry not found");
    return;
  }

  const entry = await request.server.prisma.mealEntry.update({
    where: { id: entryId },
    data: { quantityG: body.data.quantityG },
    select: {
      id: true,
      quantityG: true,
      updatedAt: true,
      food: {
        select: {
          id: true,
          name: true,
          brandName: true,
          caloriesPer100g: true,
          proteinPer100g: true,
          carbsPer100g: true,
          fatPer100g: true,
        },
      },
    },
  });

  reply.send({ data: entry });
};
