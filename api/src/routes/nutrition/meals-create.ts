import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { MealType } from "@prisma/client";
import { badRequest } from "../../lib/errors.js";

const BodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  mealType: z.nativeEnum(MealType),
});

export const createMealHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const body = BodySchema.safeParse(request.body);
  if (!body.success) {
    badRequest(reply, body.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const userId = (request.user as { sub: string }).sub;
  const date = new Date(body.data.date);

  // Upsert: create or return existing meal log for that slot
  const meal = await request.server.prisma.mealLog.upsert({
    where: {
      userId_date_mealType: {
        userId,
        date,
        mealType: body.data.mealType,
      },
    },
    create: { userId, date, mealType: body.data.mealType },
    update: {},
    select: {
      id: true,
      date: true,
      mealType: true,
      createdAt: true,
    },
  });

  reply.status(201).send({ data: meal });
};
