import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { MuscleGroup } from "@prisma/client";

const QuerySchema = z.object({
  muscleGroup: z.nativeEnum(MuscleGroup).optional(),
  q: z.string().optional(),
});

export const listHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const query = QuerySchema.safeParse(request.query);
  if (!query.success) {
    reply.status(400).send({
      error: { code: "VALIDATION_ERROR", message: "Invalid query params", statusCode: 400 },
    });
    return;
  }

  const { muscleGroup, q } = query.data;

  const exercises = await request.server.prisma.exercise.findMany({
    where: {
      ...(muscleGroup ? { muscleGroup } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      muscleGroup: true,
      equipment: true,
      description: true,
    },
  });

  reply.send({ data: exercises });
};
