
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import User from "../models/User.js";

import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setAuthCookies,
  clearAuthCookies,
} from "../utils/tokens.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

const safeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const issueTokens = async (user, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);
};

// REGISTER
export const register = async (req, res, next) => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.issues[0].message,
      });
    }

    const { name, email, password } = validation.data;
    const normalizedEmail = email.toLowerCase();

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "Password must not exceed 72 bytes.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await issueTokens(user, res);

    return res.status(201).json({
      message: "Account created successfully.",
      user: safeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    next(error);
  }
};

// LOGIN
export const login = async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.issues[0].message,
      });
    }

    const { email, password } = validation.data;

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password +refreshTokenHash");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    await issueTokens(user, res);

    return res.status(200).json({
      message: "Login successful.",
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// GET CURRENT USER
export const getMe = async (req, res) => {
  return res.status(200).json({
    user: safeUser(req.user),
  });
};

// REFRESH ACCESS TOKEN
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      clearAuthCookies(res);

      return res.status(401).json({
        message: "Refresh token missing.",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded.userId).select(
      "+refreshTokenHash"
    );

    if (!user || !user.isActive || !user.refreshTokenHash) {
      clearAuthCookies(res);

      return res.status(401).json({
        message: "Invalid session.",
      });
    }

    const submittedHash = hashToken(refreshToken);

    const storedBuffer = Buffer.from(user.refreshTokenHash);
    const submittedBuffer = Buffer.from(submittedHash);

    if (
      storedBuffer.length !== submittedBuffer.length ||
      !cryptoSafeEqual(storedBuffer, submittedBuffer)
    ) {
      user.refreshTokenHash = null;
      await user.save();

      clearAuthCookies(res);

      return res.status(401).json({
        message: "Refresh token is no longer valid.",
      });
    }

    await issueTokens(user, res);

    return res.status(200).json({
      message: "Session refreshed.",
    });
  } catch (error) {
    clearAuthCookies(res);

    return res.status(401).json({
      message: "Session expired. Please log in again.",
    });
  }
};

// LOGOUT
export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decoded.userId).select(
          "+refreshTokenHash"
        );

        if (user) {
          const submittedHash = hashToken(refreshToken);

          if (
            user.refreshTokenHash &&
            safeHashCompare(user.refreshTokenHash, submittedHash)
          ) {
            user.refreshTokenHash = null;
            await user.save();
          }
        }
      } catch {
        // The cookies are cleared even if the token has expired.
      }
    }

    clearAuthCookies(res);

    return res.status(200).json({
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// Constant-time hash comparison
import crypto from "crypto";

function cryptoSafeEqual(a, b) {
  return crypto.timingSafeEqual(a, b);
}

function safeHashCompare(a, b) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  return (
    first.length === second.length &&
    crypto.timingSafeEqual(first, second)
  );
}
