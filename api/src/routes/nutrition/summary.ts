import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export const summaryHandler: RouteHandler = async (
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
    select: {
      mealType: true,
      entries: {
        select: {
          quantityG: true,
          food: {
            select: {
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

  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const byMeal: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};

  for (const meal of meals) {
    const mealTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const entry of meal.entries) {
      const ratio = entry.quantityG / 100;
      mealTotals.calories += entry.food.caloriesPer100g * ratio;
      mealTotals.protein += entry.food.proteinPer100g * ratio;
      mealTotals.carbs += entry.food.carbsPer100g * ratio;
      mealTotals.fat += entry.food.fatPer100g * ratio;
    }
    byMeal[meal.mealType] = mealTotals;
    totals.calories += mealTotals.calories;
    totals.protein += mealTotals.protein;
    totals.carbs += mealTotals.carbs;
    totals.fat += mealTotals.fat;
  }

  // Round to 2 decimal places
  const round = (n: number) => Math.round(n * 100) / 100;
  const roundObj = (o: typeof totals) => ({
    calories: round(o.calories),
    protein: round(o.protein),
    carbs: round(o.carbs),
    fat: round(o.fat),
  });

  reply.send({
    data: {
      date: query.data.date,
      totals: roundObj(totals),
      byMeal: Object.fromEntries(
        Object.entries(byMeal).map(([k, v]) => [k, roundObj(v)])
      ),
    },
  });
};
