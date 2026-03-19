import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

export const getFoodHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id } = request.params as { id: string };
  const userId = (request.user as { sub: string } | undefined)?.sub;

  const food = await request.server.prisma.food.findUnique({
    where: { id },
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
      updatedAt: true,
    },
  });

  if (!food) {
    notFound(reply, "Food not found");
    return;
  }

  // Private foods only visible to their owner
  if (food.isPrivate && food.userId !== userId) {
    notFound(reply, "Food not found");
    return;
  }

  reply.send({ data: food });
};
