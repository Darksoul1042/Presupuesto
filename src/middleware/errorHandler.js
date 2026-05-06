import { env } from "../config/env.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
}

export function errorHandler(error, req, res, next) {
  const prismaStatus = {
    P2002: 409,
    P2003: 400,
    P2025: 404
  };

  const status = error.status ?? prismaStatus[error.code] ?? 500;
  const message = status === 500 ? "Internal server error" : error.message;

  res.status(status).json({
    error: {
      message,
      details: error.details,
      code: error.code,
      stack: env.NODE_ENV === "development" ? error.stack : undefined
    }
  });
}
