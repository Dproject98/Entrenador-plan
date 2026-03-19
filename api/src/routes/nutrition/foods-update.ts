import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { notFound, forbidden, badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  brandName: z.string().max(100).nullable().optional(),
  caloriesPer100g: z.number().nonnegative().optional(),
  proteinPer100g: z.number().nonnegative().optional(),
  carbsPer100g: z.number().nonnegative().optional(),
  fatPer100g: z.number().nonnegative().optional(),
});

export const updateFoodHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id } = request.params as { id: string };
  const userId = (request.user as { sub: string }).sub;

  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const existing = await request.server.prisma.food.findUnique({
    where: { id },
    select: { userId: true, isPrivate: true },
  });

  if (!existing || !existing.isPrivate) {
    notFound(reply, "Food not found");
    return;
  }

  if (existing.userId !== userId) {
    forbidden(reply);
    return;
  }

  const food = await request.server.prisma.food.update({
    where: { id },
    data: body.data,
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
      updatedAt: true,
    },
  });

  reply.send({ data: food });
};
