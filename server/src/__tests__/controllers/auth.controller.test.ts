import { Request, Response } from "express";
import * as authController from "../../controllers/auth.controller";
import { prisma } from "../../db";
import { getAuth } from "../../config/firebase";
import jwt from "jsonwebtoken";

jest.mock("../../config/firebase");

describe("Auth Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let cookieMock: jest.Mock;
  let clearCookieMock: jest.Mock;
  const mockFirebaseUID = "firebase-test-uid-123";
  const mockEmail = "test@example.com";

  beforeEach(() => {
    jsonMock = jest.fn();
    cookieMock = jest.fn();
    clearCookieMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({
      json: jsonMock,
    });
    mockResponse = {
      json: jsonMock,
      status: statusMock,
      cookie: cookieMock,
      clearCookie: clearCookieMock,
    };

    (getAuth as jest.Mock).mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: mockFirebaseUID,
        email: mockEmail,
        name: "John Doe",
      }),
    });
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const requestData = {
        idToken: "valid-firebase-token",
        firstName: "John",
        lastName: "Doe",
      };

      mockRequest = { body: requestData };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User registered successfully",
          user: expect.objectContaining({
            userId: mockFirebaseUID,
            firstName: "John",
            lastName: "Doe",
          }),
        })
      );
      expect(cookieMock).toHaveBeenCalled();
    });

    it("should parse name from Firebase if firstName and lastName not provided", async () => {
      const requestData = {
        idToken: "valid-firebase-token",
      };

      mockRequest = { body: requestData };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            firstName: "John",
            lastName: "Doe",
          }),
        })
      );
    });

    it("should return 400 when idToken is missing", async () => {
      mockRequest = { body: {} };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "VALIDATION_ERROR",
        })
      );
    });

    it("should return 401 when Firebase token is invalid", async () => {
      (getAuth as jest.Mock).mockReturnValue({
        verifyIdToken: jest.fn().mockRejectedValue(new Error("Invalid token")),
      });

      mockRequest = { body: { idToken: "invalid-token" } };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "UNAUTHORIZED",
          message: "Invalid or expired Firebase token",
        })
      );
    });

    it("should return 409 when user already exists", async () => {
      await prisma.userProfile.create({
        data: {
          userId: mockFirebaseUID,
          firstName: "Existing",
          lastName: "User",
        },
      });

      mockRequest = { body: { idToken: "valid-token" } };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "DUPLICATE_ENTRY",
        })
      );
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await prisma.userProfile.create({
        data: {
          userId: mockFirebaseUID,
          firstName: "John",
          lastName: "Doe",
        },
      });
    });

    it("should login successfully", async () => {
      mockRequest = { body: { idToken: "valid-firebase-token" } };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login successful",
          user: expect.objectContaining({
            userId: mockFirebaseUID,
            firstName: "John",
            lastName: "Doe",
          }),
        })
      );
      expect(cookieMock).toHaveBeenCalled();
    });

    it("should return 400 when idToken is missing", async () => {
      mockRequest = { body: {} };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "VALIDATION_ERROR",
        })
      );
    });

    it("should return 401 when Firebase token is invalid", async () => {
      (getAuth as jest.Mock).mockReturnValue({
        verifyIdToken: jest.fn().mockRejectedValue(new Error("Invalid token")),
      });

      mockRequest = { body: { idToken: "invalid-token" } };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "UNAUTHORIZED",
        })
      );
    });

    it("should return 404 when user profile not found", async () => {
      (getAuth as jest.Mock).mockReturnValue({
        verifyIdToken: jest.fn().mockResolvedValue({
          uid: "non-existent-uid",
          email: "nonexistent@example.com",
        }),
      });

      mockRequest = { body: { idToken: "valid-token" } };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "NOT_FOUND",
          message: "User profile not found. Please register first.",
        })
      );
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      mockRequest = {};

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Logout successful",
        })
      );
      expect(clearCookieMock).toHaveBeenCalled();
    });
  });
});
