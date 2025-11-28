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

export const linkedinAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

    if (!LINKEDIN_CLIENT_ID) {
      sendErrorResponse(res, 500, "CONFIG_ERROR", "LinkedIn Client ID not configured");
      return;
    }

    const state = Math.random().toString(36).substring(2, 15);
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("linkedin_oauth_state", state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 10 * 60 * 1000,
    });

    const redirectUri = `${process.env.API_URL || "http://localhost:5000"}/api/auth/linkedin/callback`;
    const scope = "openid profile email";
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;

    res.redirect(authUrl);
  } catch (error) {
    console.error("[LinkedIn Auth Error]", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to initiate LinkedIn authentication");
  }
};

export const linkedinCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
    const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
    const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

    if (error) {
      res.redirect(`${CLIENT_URL}/signin?error=linkedin_auth_failed`);
      return;
    }

    if (!code || !state) {
      res.redirect(`${CLIENT_URL}/signin?error=missing_parameters`);
      return;
    }

    const storedState = req.cookies.linkedin_oauth_state;
    if (storedState !== state) {
      res.clearCookie("linkedin_oauth_state");
      res.redirect(`${CLIENT_URL}/signin?error=invalid_state`);
      return;
    }
    res.clearCookie("linkedin_oauth_state");

    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
      res.redirect(`${CLIENT_URL}/signin?error=server_config_error`);
      return;
    }

    const redirectUri = `${process.env.API_URL || "http://localhost:5000"}/api/auth/linkedin/callback`;

    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: redirectUri,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[LinkedIn Token Error]", errorText);
      res.redirect(`${CLIENT_URL}/signin?error=token_exchange_failed`);
      return;
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("[LinkedIn User Info Error]", errorText);
      res.redirect(`${CLIENT_URL}/signin?error=user_info_failed`);
      return;
    }

    const userData = await userResponse.json() as {
      sub: string;
      given_name?: string;
      family_name?: string;
      email?: string;
      picture?: string;
    };
    const { sub, given_name, family_name, email, picture } = userData;

    // Try to fetch additional profile data (requires additional permissions)
    let headline: string | null = null;
    let location: string | null = null;
    let industry: string | null = null;

    try {
      // Try to fetch profile data with more fields
      const profileResponse = await fetch("https://api.linkedin.com/v2/me?projection=(id,localizedHeadline,industry)", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json() as {
          localizedHeadline?: string;
          industry?: string;
        };
        headline = profileData.localizedHeadline || null;
        industry = profileData.industry || null;
      }
    } catch (error) {
      // Additional profile data requires extra permissions - ignore if not available
    }

    const firebaseAuth = getAuth();
    let customToken: string;
    let uid: string;

    try {
      if (!email) {
        throw new Error("Email is required");
      }
      const existingUser = await firebaseAuth.getUserByEmail(email);
      uid = existingUser.uid;
      customToken = await firebaseAuth.createCustomToken(uid);
    } catch (error: any) {
      if (error.code === "auth/user-not-found" || error.message === "Email is required") {
        uid = `linkedin_${sub}`;
        try {
          await firebaseAuth.createUser({
            uid,
            email: email || undefined,
            displayName: `${given_name || ""} ${family_name || ""}`.trim() || undefined,
            photoURL: picture || undefined,
            emailVerified: true,
          });
          customToken = await firebaseAuth.createCustomToken(uid);
        } catch (createError) {
          console.error("[Firebase Create User Error]", createError);
          res.redirect(`${CLIENT_URL}/signin?error=user_creation_failed`);
          return;
        }
      } else {
        console.error("[Firebase Get User Error]", error);
        res.redirect(`${CLIENT_URL}/signin?error=firebase_error`);
        return;
      }
    }

    const linkedinUrl = `https://www.linkedin.com/in/${sub}/`;

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: uid },
    });

    if (!userProfile) {
      await prisma.userProfile.create({
        data: {
          userId: uid,
          firstName: given_name || null,
          lastName: family_name || null,
          email: email || null,
          profilePhotoUrl: picture || null,
          headline: headline || null,
          industry: industry || null,
          linkedinUrl: linkedinUrl,
        },
      });
    } else {
      await prisma.userProfile.update({
        where: { userId: uid },
        data: {
          firstName: given_name || userProfile.firstName,
          lastName: family_name || userProfile.lastName,
          email: email || userProfile.email,
          profilePhotoUrl: picture || userProfile.profilePhotoUrl,
          headline: headline !== null ? headline : userProfile.headline,
          industry: industry !== null ? industry : userProfile.industry,
          linkedinUrl: linkedinUrl,
        },
      });
    }

    // Update Firebase user photoURL to keep it in sync
    try {
      await firebaseAuth.updateUser(uid, {
        photoURL: picture || undefined,
      });
    } catch (error) {
      console.error("[Firebase Update Photo Error]", error);
      // Non-critical, continue anyway
    }

    res.redirect(`${CLIENT_URL}/auth/linkedin/callback?token=${customToken}`);
  } catch (error) {
    console.error("[LinkedIn Callback Error]", error);
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/signin?error=callback_error`);
  }
};
