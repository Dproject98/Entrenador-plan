import type { FastifyInstance, RouteHandlerMethod } from "fastify";
import { authenticate } from "../../hooks/authenticate.js";
import { feedListHandler } from "./feed-list.js";
import { followCreateHandler } from "./follow-create.js";
import { followDeleteHandler } from "./follow-delete.js";
import { likeCreateHandler } from "./like-create.js";
import { likeDeleteHandler } from "./like-delete.js";
import { commentListHandler } from "./comment-list.js";
import { commentCreateHandler } from "./comment-create.js";
import { commentDeleteHandler } from "./comment-delete.js";
import { challengeListHandler } from "./challenge-list.js";
import { challengeCreateHandler } from "./challenge-create.js";
import { challengeJoinHandler } from "./challenge-join.js";
import { leaderboardVolumeHandler } from "./leaderboard-volume.js";
import { leaderboardStreakHandler } from "./leaderboard-streak.js";

const auth = { preHandler: [authenticate] };

// Handlers are typed with specific generics internally; cast here to satisfy Fastify's RouteHandlerMethod
const h = <T>(fn: T) => fn as RouteHandlerMethod;

async function socialRoutes(fastify: FastifyInstance): Promise<void> {
  // Feed
  fastify.get("/feed", auth, h(feedListHandler));

  // Follow / Unfollow
  fastify.post("/users/:id/follow", auth, h(followCreateHandler));
  fastify.delete("/users/:id/follow", auth, h(followDeleteHandler));

  // Likes
  fastify.post("/sessions/:id/like", auth, h(likeCreateHandler));
  fastify.delete("/sessions/:id/like", auth, h(likeDeleteHandler));

  // Comments
  fastify.get("/sessions/:id/comments", auth, h(commentListHandler));
  fastify.post("/sessions/:id/comments", auth, h(commentCreateHandler));
  fastify.delete("/sessions/:id/comments/:commentId", auth, h(commentDeleteHandler));

  // Challenges
  fastify.get("/challenges", auth, h(challengeListHandler));
  fastify.post("/challenges", auth, h(challengeCreateHandler));
  fastify.post("/challenges/:id/join", auth, h(challengeJoinHandler));

  // Leaderboard
  fastify.get("/leaderboard/volume", auth, h(leaderboardVolumeHandler));
  fastify.get("/leaderboard/streak", auth, h(leaderboardStreakHandler));
}

export default socialRoutes;
