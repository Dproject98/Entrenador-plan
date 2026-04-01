import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
});

export const createPlanHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const userId = (request.user as { sub: string }).sub;

  const plan = await request.server.prisma.trainingPlan.create({
    data: { userId, name: body.data.name, description: body.data.description ?? null },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
    },
  });

  reply.status(201).send({ data: plan });
};
