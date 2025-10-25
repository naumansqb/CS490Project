import { Response } from "express";
import * as userController from "../../controllers/user.controller";
import { prisma } from "../../db";
import { AuthRequest } from "../../middleware/auth.middleware";

describe("User Controller", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let userProfileId: string;
  const mockFirebaseUID = "firebase-test-uid-456";

  beforeEach(async () => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({
      json: jsonMock,
    });
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    const userProfile = await prisma.userProfile.create({
      data: {
        userId: mockFirebaseUID,
        firstName: "Jane",
        lastName: "Smith",
        headline: "Software Engineer",
      },
    });
    userProfileId = userProfile.userId;
  });

  describe("getCurrentUser", () => {
    it("should get current user with all relations", async () => {
      await prisma.workExperience.create({
        data: {
          userId: userProfileId,
          companyName: "Tech Corp",
          positionTitle: "Developer",
          startDate: new Date("2023-01-01"),
        },
      });

      await prisma.skill.create({
        data: {
          userId: mockFirebaseUID,
          skillName: "JavaScript",
        },
      });

      mockRequest = { userId: mockFirebaseUID };

      await userController.getCurrentUser(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockFirebaseUID,
          firstName: "Jane",
          lastName: "Smith",
          workExperiences: expect.arrayContaining([
            expect.objectContaining({ companyName: "Tech Corp" }),
          ]),
          skills: expect.arrayContaining([
            expect.objectContaining({ skillName: "JavaScript" }),
          ]),
        })
      );
    });

    it("should return 401 when userId not in request", async () => {
      mockRequest = {};

      await userController.getCurrentUser(
        mockRequest as AuthRequest,
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
      mockRequest = { userId: "non-existent-uid" };

      await userController.getCurrentUser(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "NOT_FOUND",
        })
      );
    });
  });

  describe("updateCurrentUser", () => {
    it("should update current user successfully", async () => {
      const updateData = {
        headline: "Senior Software Engineer",
        bio: "Experienced developer",
      };

      mockRequest = {
        userId: mockFirebaseUID,
        body: updateData,
      };

      await userController.updateCurrentUser(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          headline: "Senior Software Engineer",
          bio: "Experienced developer",
        })
      );
    });

    it("should return 401 when userId not in request", async () => {
      mockRequest = { body: { headline: "Test" } };

      await userController.updateCurrentUser(
        mockRequest as AuthRequest,
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
      mockRequest = {
        userId: "non-existent-uid",
        body: { headline: "Test" },
      };

      await userController.updateCurrentUser(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "NOT_FOUND",
        })
      );
    });

    it("should return 400 for validation errors", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        body: {
          yearsOfExperience: 999, // Invalid
        },
      };

      await userController.updateCurrentUser(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "VALIDATION_ERROR",
        })
      );
    });
  });
});
