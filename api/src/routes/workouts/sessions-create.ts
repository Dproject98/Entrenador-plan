import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  name: z.string().max(100).optional(),
  planWorkoutId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const createSessionHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const userId = (request.user as { sub: string }).sub;

  const session = await request.server.prisma.workoutSession.create({
    data: {
      userId,
      name: body.data.name ?? null,
      planWorkoutId: body.data.planWorkoutId ?? null,
      notes: body.data.notes ?? null,
    },
    select: {
      id: true,
      name: true,
      startedAt: true,
      endedAt: true,
      notes: true,
      planWorkoutId: true,
    },
  });

  reply.status(201).send({ data: session });
};
