import { Response } from "express";
import * as userProfileController from "../../controllers/userProfile.controller";
import { prisma } from "../../db";
import { AuthRequest } from "../../middleware/auth.middleware";

describe("UserProfile Controller", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  const mockFirebaseUID = "firebase-test-uid-456";

  beforeEach(() => {
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({
      json: jsonMock,
      send: sendMock,
    });
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe("createUserProfile", () => {
    it("should create a user profile successfully", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        headline: "Software Engineer",
      };

      mockRequest = { userId: mockFirebaseUID, body: userData };

      await userProfileController.createUserProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: userData.firstName,
          lastName: userData.lastName,
        })
      );
    });

    it("should return 409 when user profile already exists", async () => {
      const userData = {
        firstName: "Jane",
        lastName: "Smith",
      };

      await prisma.userProfile.create({
        data: { ...userData, userId: mockFirebaseUID },
      });
      mockRequest = { userId: mockFirebaseUID, body: userData };

      await userProfileController.createUserProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "DUPLICATE_ENTRY",
          message: expect.any(String),
        })
      );
    });

    it("should return 400 for validation errors", async () => {
      const userData = {
        firstName: "Test",
      };

      mockRequest = { body: userData };

      await userProfileController.createUserProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "userId",
              message: expect.any(String),
            }),
          ]),
        })
      );
    });
  });

  describe("getUserProfileByUserId", () => {
    it("should get a user profile by userId", async () => {
      const userData = {
        firstName: "Bob",
        lastName: "Wilson",
      };

      await prisma.userProfile.create({
        data: { ...userData, userId: mockFirebaseUID },
      });
      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: mockFirebaseUID },
      };

      await userProfileController.getUserProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockFirebaseUID,
          firstName: userData.firstName,
        })
      );
    });
  });

  describe("updateUserProfile", () => {
    it("should update a user profile", async () => {
      const userData = {
        firstName: "Charlie",
        lastName: "Brown",
      };

      const created = await prisma.userProfile.create({
        data: { ...userData, userId: mockFirebaseUID },
      });

      const updateData = { firstName: "Charles" };
      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: created.userId },
        body: updateData,
      };

      await userProfileController.updateUserProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: created.userId,
          firstName: "Charles",
        })
      );
    });

    it("should return 404 when updating non-existent profile", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: mockFirebaseUID },
        body: { firstName: "Test" },
      };

      await userProfileController.updateUserProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "NOT_FOUND",
          message: expect.any(String),
        })
      );
    });

    it("should return 400 for invalid update data", async () => {
      const userData = {
        firstName: "Test",
      };

      const created = await prisma.userProfile.create({
        data: { ...userData, userId: mockFirebaseUID },
      });

      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: created.userId },
        body: { yearsOfExperience: "invalid" },
      };

      await userProfileController.updateUserProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "VALIDATION_ERROR",
          details: expect.any(Array),
        })
      );
    });
  });

  describe("deleteUserProfile", () => {
    it("should delete a user profile", async () => {
      const userData = {
        firstName: "David",
        lastName: "Miller",
      };

      const created = await prisma.userProfile.create({
        data: { ...userData, userId: mockFirebaseUID },
      });

      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: created.userId },
      };

      await userProfileController.deleteUserProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent profile", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: mockFirebaseUID },
      };

      await userProfileController.deleteUserProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "NOT_FOUND",
          message: expect.any(String),
        })
      );
    });
  });
});
