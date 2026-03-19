import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { z } from "zod";
import { verifyPassword } from "../../lib/password.js";
import { unauthorized, badRequest } from "../../lib/errors.js";
import { issueTokenPair } from "./token-utils.js";

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// A dummy hash to run bcrypt.compare against when the user doesn't exist,
// preventing timing-based user enumeration attacks.
const DUMMY_HASH =
  "$2b$12$invalidhashpaddingtomatchbcryptlengthXXXXXXXXXXXXXXXX";

export const loginHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const result = LoginBody.safeParse(request.body);
  if (!result.success) {
    badRequest(reply, result.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const { email, password } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await request.server.prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  // Always run bcrypt to prevent timing attacks
  const hashToVerify = user ? user.passwordHash : DUMMY_HASH;
  const isValid = await verifyPassword(password, hashToVerify);

  if (!user || !isValid) {
    unauthorized(reply, "Invalid email or password");
    return;
  }

  const { passwordHash: _, ...safeUser } = user;

  const { accessToken, refreshToken } = await issueTokenPair(
    request.server,
    user.id
  );

  reply.send({
    data: { user: safeUser, accessToken, refreshToken },
  });
};
