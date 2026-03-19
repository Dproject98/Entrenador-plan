import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { notFound, forbidden } from "../../lib/errors.js";

export const getPlanHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id } = request.params as { id: string };
  const userId = (request.user as { sub: string }).sub;

  const plan = await request.server.prisma.trainingPlan.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      weeks: {
        orderBy: { weekNumber: "asc" },
        select: {
          id: true,
          weekNumber: true,
          workouts: {
            orderBy: { dayOfWeek: "asc" },
            select: {
              id: true,
              dayOfWeek: true,
              name: true,
              updatedAt: true,
              plannedExercises: {
                orderBy: { orderIndex: "asc" },
                select: {
                  id: true,
                  sets: true,
                  reps: true,
                  restSeconds: true,
                  notes: true,
                  orderIndex: true,
                  exercise: {
                    select: { id: true, name: true, muscleGroup: true, equipment: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    notFound(reply, "Plan not found");
    return;
  }

  if (plan.userId !== userId) {
    forbidden(reply);
    return;
  }

  const { userId: _, ...planData } = plan;
  reply.send({ data: planData });
};
