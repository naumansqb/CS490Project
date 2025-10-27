import { Response } from "express";
import * as workExperienceController from "../../controllers/workExperience.controller";
import { prisma } from "../../db";
import { AuthRequest } from "../../middleware/auth.middleware";

describe("Work Experience Controller", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  let userProfileId: string;
  const mockFirebaseUID = "firebase-test-uid-work-202";

  beforeEach(async () => {
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

    const userProfile = await prisma.userProfile.create({
      data: {
        userId: mockFirebaseUID,
        firstName: "Test",
        lastName: "User",
      },
    });
    userProfileId = userProfile.userId;
  });

  describe("createWorkExperience", () => {
    it("should create work experience successfully", async () => {
      const workData = {
        companyName: "Tech Corp",
        positionTitle: "Senior Software Engineer",
        employmentType: "Full-time",
        startDate: new Date("2020-01-15"),
        endDate: new Date("2023-06-30"),
        description: "Led development of key features",
      };

      mockRequest = { userId: mockFirebaseUID, body: workData };

      await workExperienceController.createWorkExperience(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: workData.companyName,
          positionTitle: workData.positionTitle,
        })
      );
    });

    it("should return 404 when user profile not found", async () => {
      const workData = {
        companyName: "Test Company",
        positionTitle: "Developer",
        startDate: new Date("2022-01-01"),
      };

      mockRequest = { userId: "non-existent-user", body: workData };

      await workExperienceController.createWorkExperience(
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
      const workData = {
        companyName: "",
        positionTitle: "Developer",
      };

      mockRequest = { userId: mockFirebaseUID, body: workData };

      await workExperienceController.createWorkExperience(
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

    it("should create work experience with current flag", async () => {
      const workData = {
        companyName: "Current Company",
        positionTitle: "Lead Developer",
        employmentType: "Full-time",
        startDate: new Date("2023-03-01"),
        isCurrent: true,
        isRemote: true,
      };

      mockRequest = { userId: mockFirebaseUID, body: workData };

      await workExperienceController.createWorkExperience(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          isCurrent: true,
          isRemote: true,
        })
      );
    });
  });

  describe("getWorkExperience", () => {
    it("should get work experience by id", async () => {
      const workExp = await prisma.workExperience.create({
        data: {
          userId: userProfileId,
          companyName: "Google",
          positionTitle: "Staff Engineer",
          employmentType: "Full-time",
          startDate: new Date("2019-06-01"),
          endDate: new Date("2022-12-31"),
        },
      });

      mockRequest = { userId: mockFirebaseUID, params: { id: workExp.id } };

      await workExperienceController.getWorkExperience(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: workExp.id,
          companyName: "Google",
        })
      );
    });

    it("should return 404 when work experience not found", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "123e4567-e89b-12d3-a456-426614174200" },
      };

      await workExperienceController.getWorkExperience(
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

  describe("getWorkExperiencesByUserId", () => {
    it("should get all work experiences for a user", async () => {
      await prisma.workExperience.createMany({
        data: [
          {
            userId: userProfileId,
            companyName: "Company A",
            positionTitle: "Junior Developer",
            startDate: new Date("2017-01-15"),
            endDate: new Date("2019-03-31"),
          },
          {
            userId: userProfileId,
            companyName: "Company B",
            positionTitle: "Senior Developer",
            startDate: new Date("2019-04-01"),
            isCurrent: true,
          },
        ],
      });

      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: userProfileId },
      };

      await workExperienceController.getWorkExperiencesByUserId(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ companyName: "Company A" }),
          expect.objectContaining({ companyName: "Company B" }),
        ])
      );
    });
  });

  describe("updateWorkExperience", () => {
    it("should update work experience", async () => {
      const workExp = await prisma.workExperience.create({
        data: {
          userId: userProfileId,
          companyName: "Old Company",
          positionTitle: "Developer",
          startDate: new Date("2018-01-01"),
        },
      });

      const updateData = { companyName: "Updated Company" };
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: workExp.id },
        body: updateData,
      };

      await workExperienceController.updateWorkExperience(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: workExp.id,
          companyName: "Updated Company",
        })
      );
    });

    it("should return 404 when updating non-existent work experience", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "123e4567-e89b-12d3-a456-426614174201" },
        body: { companyName: "Test" },
      };

      await workExperienceController.updateWorkExperience(
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

  describe("deleteWorkExperience", () => {
    it("should delete work experience", async () => {
      const workExp = await prisma.workExperience.create({
        data: {
          userId: userProfileId,
          companyName: "Delete Company",
          positionTitle: "Intern",
          startDate: new Date("2016-06-01"),
          endDate: new Date("2016-08-31"),
        },
      });

      mockRequest = { userId: mockFirebaseUID, params: { id: workExp.id } };

      await workExperienceController.deleteWorkExperience(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent work experience", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "123e4567-e89b-12d3-a456-426614174202" },
      };

      await workExperienceController.deleteWorkExperience(
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
});
