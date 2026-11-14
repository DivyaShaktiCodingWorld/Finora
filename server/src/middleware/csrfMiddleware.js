
import crypto from "crypto";

export const createCsrfToken = (res) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");

  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return csrfToken;
};

export const verifyCsrfToken = (req, res, next) => {
  const allowedOrigin = process.env.CLIENT_URL;
  const origin = req.get("origin");

  if (!origin || origin !== allowedOrigin) {
    return res.status(403).json({
      message: "Invalid request origin.",
    });
  }

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get("X-CSRF-Token");

  if (
    !cookieToken ||
    !headerToken ||
    cookieToken.length !== headerToken.length
  ) {
    return res.status(403).json({
      message: "CSRF validation failed.",
    });
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (!crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
    return res.status(403).json({
      message: "CSRF validation failed.",
    });
  }

  next();
};
