import { Request, Response } from "express";
import { getAuth } from "../config/firebase";
import { prisma } from "../db";
import { sendErrorResponse } from "../utils/errorResponse";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

const createSessionToken = (uid: string): string => {
  return jwt.sign({ uid }, JWT_SECRET, { expiresIn: "7d" });
};

const setSessionCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("session", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, firstName, lastName } = req.body;

    if (!idToken) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Firebase ID token is required",
        [{ field: "idToken", message: "ID token is required" }]
      );
      return;
    }

    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (error) {
      sendErrorResponse(
        res,
        401,
        "UNAUTHORIZED",
        "Invalid or expired Firebase token"
      );
      return;
    }

    const { uid, email, name } = decodedToken;

    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: uid },
    });

    if (existingProfile) {
      sendErrorResponse(
        res,
        409,
        "DUPLICATE_ENTRY",
        "User profile already exists"
      );
      return;
    }

    let parsedFirstName = firstName;
    let parsedLastName = lastName;

    if (!firstName && !lastName && name) {
      const nameParts = name.trim().split(" ");
      parsedFirstName = nameParts[0];
      parsedLastName = nameParts.slice(1).join(" ") || "";
    }

    const userProfile = await prisma.userProfile.create({
      data: {
        userId: uid,
        firstName: parsedFirstName || null,
        lastName: parsedLastName || null,
        email: email || null,
      },
    });

    const sessionToken = createSessionToken(uid);
    setSessionCookie(res, sessionToken);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        userId: userProfile.userId,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: email || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        sendErrorResponse(
          res,
          409,
          "DUPLICATE_ENTRY",
          "User profile already exists"
        );
        return;
      }
    }
    console.error("[Auth Register Error]", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to register user");
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Firebase ID token is required",
        [{ field: "idToken", message: "ID token is required" }]
      );
      return;
    }

    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (error) {
      sendErrorResponse(
        res,
        401,
        "UNAUTHORIZED",
        "Invalid or expired Firebase token"
      );
      return;
    }

    const { uid, email } = decodedToken;

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: uid },
    });

    if (!userProfile) {
      sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "User profile not found. Please register first."
      );
      return;
    }

    const sessionToken = createSessionToken(uid);
    setSessionCookie(res, sessionToken);

    res.status(200).json({
      message: "Login successful",
      user: {
        userId: userProfile.userId,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: email || null,
      },
    });
  } catch (error) {
    console.error("[Auth Login Error]", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to login");
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("[Auth Logout Error]", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to logout");
  }
};
