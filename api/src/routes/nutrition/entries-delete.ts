import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

export const deleteEntryHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: mealLogId, entryId } = request.params as { id: string; entryId: string };
  const userId = (request.user as { sub: string }).sub;

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

  await request.server.prisma.mealEntry.delete({ where: { id: entryId } });

  reply.status(204).send();
};
