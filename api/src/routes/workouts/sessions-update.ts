import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { notFound, forbidden, badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  name: z.string().max(100).optional(),
  endedAt: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const updateSessionHandler: RouteHandler = async (
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

  const existing = await request.server.prisma.workoutSession.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing) {
    notFound(reply, "Session not found");
    return;
  }

  if (existing.userId !== userId) {
    forbidden(reply);
    return;
  }

  const { endedAt, name, notes } = body.data;

  const updateData: { name?: string | null; notes?: string | null; endedAt?: Date | null } = {};
  if (name !== undefined) updateData.name = name ?? null;
  if (notes !== undefined) updateData.notes = notes ?? null;
  if (endedAt !== undefined) updateData.endedAt = endedAt ? new Date(endedAt) : null;

  const session = await request.server.prisma.workoutSession.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      startedAt: true,
      endedAt: true,
      notes: true,
      planWorkoutId: true,
      updatedAt: true,
    },
  });

  reply.send({ data: session });
};
