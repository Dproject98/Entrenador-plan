import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function registerAndLogin(app: FastifyInstance, suffix: string) {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      email: `social_${suffix}@test.com`,
      password: "password123",
      name: `User ${suffix}`,
    },
  });
  const body = res.json<{ data: { accessToken: string; user: { id: string } } }>();
  return { token: body.data.accessToken, userId: body.data.user.id };
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ─── Auth guards ──────────────────────────────────────────────────────────────

describe("Social — auth guards", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  const protectedEndpoints = [
    { method: "GET", url: "/api/v1/social/feed" },
    { method: "GET", url: "/api/v1/social/challenges" },
    { method: "POST", url: "/api/v1/social/challenges" },
    { method: "GET", url: "/api/v1/social/leaderboard/volume" },
    { method: "GET", url: "/api/v1/social/leaderboard/streak" },
  ] as const;

  for (const { method, url } of protectedEndpoints) {
    it(`${method} ${url} returns 401 without token`, async () => {
      const res = await app.inject({ method, url });
      expect(res.statusCode).toBe(401);
    });
  }
});

// ─── Feed ─────────────────────────────────────────────────────────────────────

describe("GET /api/v1/social/feed", () => {
  let app: FastifyInstance;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    ({ token: tokenA } = await registerAndLogin(app, `feedA_${Date.now()}`));
    ({ token: tokenB } = await registerAndLogin(app, `feedB_${Date.now()}`));
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns empty feed when not following anyone", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/social/feed",
      headers: authHeader(tokenA),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: unknown[]; meta: object }>();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
  });

  it("includes own completed sessions in feed", async () => {
    // Create + complete a session for user A
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/sessions",
      headers: authHeader(tokenA),
      payload: { name: "Morning session" },
    });
    const sessionId = createRes.json<{ data: { id: string } }>().data.id;

    await app.inject({
      method: "PATCH",
      url: `/api/v1/sessions/${sessionId}`,
      headers: authHeader(tokenA),
      payload: { endedAt: new Date().toISOString() },
    });

    const feedRes = await app.inject({
      method: "GET",
      url: "/api/v1/social/feed",
      headers: authHeader(tokenA),
    });
    expect(feedRes.statusCode).toBe(200);
    const feed = feedRes.json<{ data: Array<{ id: string }> }>().data;
    expect(feed.some((s) => s.id === sessionId)).toBe(true);
  });
});

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

describe("Follow / Unfollow", () => {
  let app: FastifyInstance;
  let tokenA: string;
  let tokenB: string;
  let userBId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    ({ token: tokenA } = await registerAndLogin(app, `followA_${Date.now()}`));
    ({ token: tokenB, userId: userBId } = await registerAndLogin(app, `followB_${Date.now()}`));
  });

  afterAll(async () => {
    await app.close();
  });

  it("follows another user", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/social/users/${userBId}/follow`,
      headers: authHeader(tokenA),
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.following).toBe(true);
  });

  it("duplicate follow is idempotent (no error)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/social/users/${userBId}/follow`,
      headers: authHeader(tokenA),
    });
    expect(res.statusCode).toBe(201);
  });

  it("unfollows a user", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/social/users/${userBId}/follow`,
      headers: authHeader(tokenA),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.following).toBe(false);
  });

  it("returns 400 when trying to follow yourself", async () => {
    const meRes = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: authHeader(tokenA),
    });
    const myId = meRes.json<{ data: { id: string } }>().data.id;

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/social/users/${myId}/follow`,
      headers: authHeader(tokenA),
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── Likes ────────────────────────────────────────────────────────────────────

describe("Likes", () => {
  let app: FastifyInstance;
  let tokenA: string;
  let tokenB: string;
  let sessionId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    ({ token: tokenA } = await registerAndLogin(app, `likeA_${Date.now()}`));
    ({ token: tokenB } = await registerAndLogin(app, `likeB_${Date.now()}`));

    // Create and complete a session by A
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/sessions",
      headers: authHeader(tokenA),
      payload: { name: "Session to like" },
    });
    sessionId = createRes.json<{ data: { id: string } }>().data.id;
    await app.inject({
      method: "PATCH",
      url: `/api/v1/sessions/${sessionId}`,
      headers: authHeader(tokenA),
      payload: { endedAt: new Date().toISOString() },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("likes a session", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/social/sessions/${sessionId}/like`,
      headers: authHeader(tokenB),
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.liked).toBe(true);
  });

  it("double-like is idempotent (no error)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/social/sessions/${sessionId}/like`,
      headers: authHeader(tokenB),
    });
    expect(res.statusCode).toBe(201);
  });

  it("unlikes a session", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/social/sessions/${sessionId}/like`,
      headers: authHeader(tokenB),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.liked).toBe(false);
  });

  it("returns 404 when liking a non-existent session", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/social/sessions/nonexistent-id/like",
      headers: authHeader(tokenB),
    });
    expect(res.statusCode).toBe(404);
  });
});

// ─── Comments ─────────────────────────────────────────────────────────────────

describe("Comments", () => {
  let app: FastifyInstance;
  let tokenA: string;
  let tokenB: string;
  let sessionId: string;
  let commentId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    ({ token: tokenA } = await registerAndLogin(app, `cmtA_${Date.now()}`));
    ({ token: tokenB } = await registerAndLogin(app, `cmtB_${Date.now()}`));

    // Create + complete a session by A
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/sessions",
      headers: authHeader(tokenA),
      payload: { name: "Session to comment" },
    });
    sessionId = createRes.json<{ data: { id: string } }>().data.id;
    await app.inject({
      method: "PATCH",
      url: `/api/v1/sessions/${sessionId}`,
      headers: authHeader(tokenA),
      payload: { endedAt: new Date().toISOString() },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("adds a comment", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/social/sessions/${sessionId}/comments`,
      headers: authHeader(tokenB),
      payload: { body: "Great session!" },
    });
    expect(res.statusCode).toBe(201);
    const comment = res.json<{ data: { id: string; body: string; user: { name: string } } }>().data;
    expect(comment.body).toBe("Great session!");
    expect(comment.user).toBeDefined();
    commentId = comment.id;
  });

  it("lists comments for a session", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/social/sessions/${sessionId}/comments`,
      headers: authHeader(tokenA),
    });
    expect(res.statusCode).toBe(200);
    const data = res.json<{ data: Array<{ id: string }> }>().data;
    expect(data.some((c) => c.id === commentId)).toBe(true);
  });

  it("returns 400 for empty comment body", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/social/sessions/${sessionId}/comments`,
      headers: authHeader(tokenB),
      payload: { body: "   " },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 when deleting another user's comment", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/social/sessions/${sessionId}/comments/${commentId}`,
      headers: authHeader(tokenA), // A tries to delete B's comment
    });
    expect(res.statusCode).toBe(403);
  });

  it("deletes own comment", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/social/sessions/${sessionId}/comments/${commentId}`,
      headers: authHeader(tokenB),
    });
    expect(res.statusCode).toBe(204);
  });
});

// ─── Challenges ───────────────────────────────────────────────────────────────

describe("Challenges", () => {
  let app: FastifyInstance;
  let tokenA: string;
  let tokenB: string;
  let challengeId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    ({ token: tokenA } = await registerAndLogin(app, `chalA_${Date.now()}`));
    ({ token: tokenB } = await registerAndLogin(app, `chalB_${Date.now()}`));
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates a challenge", async () => {
    const start = new Date();
    const end = new Date(Date.now() + 7 * 86400000);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/social/challenges",
      headers: authHeader(tokenA),
      payload: {
        name: "5000kg this week",
        type: "VOLUME_KG",
        goal: 5000,
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
        isPublic: true,
      },
    });

    expect(res.statusCode).toBe(201);
    const challenge = res.json<{
      data: {
        id: string;
        goal: number;
        participantsCount: number;
        joinedByMe: boolean;
        status: string;
      };
    }>().data;

    expect(challenge.goal).toBe(5000);
    expect(challenge.participantsCount).toBe(1); // creator auto-joins
    expect(challenge.joinedByMe).toBe(true);
    expect(challenge.status).toBe("active");
    challengeId = challenge.id;
  });

  it("returns 400 if endDate is before startDate", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/social/challenges",
      headers: authHeader(tokenA),
      payload: {
        name: "Bad dates",
        type: "SESSIONS_COUNT",
        startDate: "2026-04-10",
        endDate: "2026-04-01",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("lists challenges including the one created", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/social/challenges",
      headers: authHeader(tokenA),
    });
    expect(res.statusCode).toBe(200);
    const data = res.json<{ data: Array<{ id: string }> }>().data;
    expect(data.some((c) => c.id === challengeId)).toBe(true);
  });

  it("another user joins the challenge", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/social/challenges/${challengeId}/join`,
      headers: authHeader(tokenB),
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.joined).toBe(true);
  });

  it("joining twice is idempotent (no error)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/social/challenges/${challengeId}/join`,
      headers: authHeader(tokenB),
    });
    expect(res.statusCode).toBe(201);
  });
});

// ─── Leaderboard ─────────────────────────────────────────────────────────────

describe("Leaderboard", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    ({ token } = await registerAndLogin(app, `lb_${Date.now()}`));
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /leaderboard/volume returns valid shape", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/social/leaderboard/volume?period=week",
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: unknown[]; period: string }>();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.period).toBe("week");
  });

  it("GET /leaderboard/volume accepts period=month", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/social/leaderboard/volume?period=month",
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
  });

  it("GET /leaderboard/streak returns valid shape", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/social/leaderboard/streak",
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: unknown[] }>();
    expect(Array.isArray(body.data)).toBe(true);
  });
});
