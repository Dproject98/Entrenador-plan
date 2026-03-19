import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

function computeMacros(entries: Array<{ quantityG: number; food: { caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number } }>) {
  return entries.reduce(
    (acc, entry) => {
      const ratio = entry.quantityG / 100;
      return {
        calories: acc.calories + entry.food.caloriesPer100g * ratio,
        protein: acc.protein + entry.food.proteinPer100g * ratio,
        carbs: acc.carbs + entry.food.carbsPer100g * ratio,
        fat: acc.fat + entry.food.fatPer100g * ratio,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export const getMealHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id } = request.params as { id: string };
  const userId = (request.user as { sub: string }).sub;

  const meal = await request.server.prisma.mealLog.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      date: true,
      mealType: true,
      createdAt: true,
      updatedAt: true,
      entries: {
        orderBy: { createdAt: "asc" },
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
      },
    },
  });

  if (!meal) {
    notFound(reply, "Meal log not found");
    return;
  }

  if (meal.userId !== userId) {
    forbidden(reply);
    return;
  }

  const { userId: _, ...mealData } = meal;
  reply.send({ data: { ...mealData, macros: computeMacros(meal.entries) } });
};
