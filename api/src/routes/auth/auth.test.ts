import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";

describe("POST /api/v1/auth/register", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates a user and returns token pair", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json<{
      data: {
        accessToken: string;
        refreshToken: string;
        user: { email: string };
      };
    }>();
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.refreshToken).toBeTruthy();
    expect(body.data.user.email).toBe("test@example.com");
    // CRITICAL: password hash must never appear in any response
    expect(JSON.stringify(body)).not.toContain("passwordHash");
    expect(JSON.stringify(body)).not.toContain("password_hash");
  });

  it("returns 409 if email is already registered", async () => {
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "dupe@example.com", password: "password123", name: "Dupe" },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "dupe@example.com", password: "password123", name: "Dupe" },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("CONFLICT");
  });

  it("returns 400 for invalid email", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "not-an-email", password: "password123", name: "Test" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for short password", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "valid@example.com", password: "short", name: "Test" },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("POST /api/v1/auth/login", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Seed a test user
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "login@example.com", password: "password123", name: "Login User" },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns token pair for valid credentials", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "login@example.com", password: "password123" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ data: { accessToken: string } }>();
    expect(body.data.accessToken).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain("passwordHash");
  });

  it("returns 401 for wrong password", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "login@example.com", password: "wrongpassword" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 for unknown email", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "nobody@example.com", password: "password123" },
    });

    expect(response.statusCode).toBe(401);
  });
});
