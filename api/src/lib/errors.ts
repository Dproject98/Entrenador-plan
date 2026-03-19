import type { FastifyReply } from "fastify";

export interface ApiError {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: ErrorCodeValue,
  message: string
): void {
  reply.status(statusCode).send({
    error: { code, message, statusCode },
  } satisfies ApiError);
}

export const badRequest = (reply: FastifyReply, message: string) =>
  sendError(reply, 400, ErrorCode.VALIDATION_ERROR, message);

export const unauthorized = (reply: FastifyReply, message = "Unauthorized") =>
  sendError(reply, 401, ErrorCode.UNAUTHORIZED, message);

export const forbidden = (reply: FastifyReply, message = "Forbidden") =>
  sendError(reply, 403, ErrorCode.FORBIDDEN, message);

export const notFound = (reply: FastifyReply, message = "Not found") =>
  sendError(reply, 404, ErrorCode.NOT_FOUND, message);

export const conflict = (reply: FastifyReply, message: string) =>
  sendError(reply, 409, ErrorCode.CONFLICT, message);
