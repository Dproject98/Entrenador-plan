import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  name: z.string().min(1).max(200),
  brandName: z.string().max(100).optional(),
  caloriesPer100g: z.number().nonnegative(),
  proteinPer100g: z.number().nonnegative(),
  carbsPer100g: z.number().nonnegative(),
  fatPer100g: z.number().nonnegative(),
});

export const createFoodHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const userId = (request.user as { sub: string }).sub;

  const food = await request.server.prisma.food.create({
    data: {
      ...body.data,
      isPrivate: true,
      userId,
    },
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
      createdAt: true,
    },
  });

  reply.status(201).send({ data: food });
};
