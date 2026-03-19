import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { notFound, forbidden, badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  foodId: z.string().min(1),
  quantityG: z.number().positive(),
});

export const createEntryHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: mealLogId } = request.params as { id: string };
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

  // Verify food is accessible (public or owned)
  const food = await request.server.prisma.food.findFirst({
    where: {
      id: body.data.foodId,
      OR: [{ isPrivate: false }, { isPrivate: true, userId }],
    },
    select: { id: true },
  });

  if (!food) {
    notFound(reply, "Food not found");
    return;
  }

  const entry = await request.server.prisma.mealEntry.create({
    data: {
      mealLogId,
      foodId: body.data.foodId,
      quantityG: body.data.quantityG,
    },
    select: {
      id: true,
      quantityG: true,
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

  reply.status(201).send({ data: entry });
};
