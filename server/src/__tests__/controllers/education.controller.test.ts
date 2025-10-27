import { Response } from "express";
import * as educationController from "../../controllers/education.controller";
import { prisma } from "../../db";
import { AuthRequest } from "../../middleware/auth.middleware";

describe("Education Controller", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  let userProfileId: string;
  const mockFirebaseUID = "firebase-test-uid-edu-789";

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

  describe("createEducation", () => {
    it("should create an education entry successfully", async () => {
      const eduData = {
        institutionName: "Stanford University",
        degreeType: "Bachelor of Science",
        major: "Computer Science",
        startDate: new Date("2018-09-01"),
        endDate: new Date("2022-06-15"),
        gpa: 3.8,
      };

      mockRequest = { userId: mockFirebaseUID, body: eduData };

      await educationController.createEducation(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          institutionName: eduData.institutionName,
          major: eduData.major,
        })
      );
    });

    it("should return 404 when user profile not found", async () => {
      const eduData = {
        institutionName: "Test University",
        degreeType: "Bachelor",
      };

      mockRequest = { userId: "non-existent-user", body: eduData };

      await educationController.createEducation(
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
      const eduData = {
        institutionName: "",
        degreeType: "Bachelor",
      };

      mockRequest = { userId: mockFirebaseUID, body: eduData };

      await educationController.createEducation(
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

    it("should create education with current flag", async () => {
      const eduData = {
        institutionName: "MIT",
        degreeType: "Master of Science",
        major: "Artificial Intelligence",
        startDate: new Date("2023-09-01"),
        isCurrent: true,
      };

      mockRequest = { userId: mockFirebaseUID, body: eduData };

      await educationController.createEducation(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          isCurrent: true,
        })
      );
    });
  });

  describe("getEducation", () => {
    it("should get education by id", async () => {
      const edu = await prisma.education.create({
        data: {
          userId: userProfileId,
          institutionName: "Harvard University",
          degreeType: "PhD",
          major: "Physics",
          startDate: new Date("2020-09-01"),
        },
      });

      mockRequest = { userId: mockFirebaseUID, params: { id: edu.id } };

      await educationController.getEducation(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: edu.id,
          institutionName: "Harvard University",
        })
      );
    });

    it("should return 404 when education not found", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      };

      await educationController.getEducation(
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

  describe("getEducationsByUserId", () => {
    it("should get all education entries for a user", async () => {
      await prisma.education.createMany({
        data: [
          {
            userId: userProfileId,
            institutionName: "University A",
            degreeType: "Bachelor",
            major: "Math",
            startDate: new Date("2015-09-01"),
          },
          {
            userId: userProfileId,
            institutionName: "University B",
            degreeType: "Master",
            major: "Statistics",
            startDate: new Date("2019-09-01"),
          },
        ],
      });

      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: userProfileId },
      };

      await educationController.getEducationsByUserId(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ institutionName: "University A" }),
          expect.objectContaining({ institutionName: "University B" }),
        ])
      );
    });
  });

  describe("updateEducation", () => {
    it("should update an education entry", async () => {
      const edu = await prisma.education.create({
        data: {
          userId: userProfileId,
          institutionName: "Old University",
          degreeType: "Bachelor",
          major: "Biology",
          startDate: new Date("2018-09-01"),
        },
      });

      const updateData = { institutionName: "Updated University" };
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: edu.id },
        body: updateData,
      };

      await educationController.updateEducation(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: edu.id,
          institutionName: "Updated University",
        })
      );
    });

    it("should return 404 when updating non-existent education", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "123e4567-e89b-12d3-a456-426614174001" },
        body: { institutionName: "Test" },
      };

      await educationController.updateEducation(
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

  describe("deleteEducation", () => {
    it("should delete an education entry", async () => {
      const edu = await prisma.education.create({
        data: {
          userId: userProfileId,
          institutionName: "Delete University",
          degreeType: "Bachelor",
          major: "History",
          startDate: new Date("2017-09-01"),
        },
      });

      mockRequest = { userId: mockFirebaseUID, params: { id: edu.id } };

      await educationController.deleteEducation(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent education", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "123e4567-e89b-12d3-a456-426614174002" },
      };

      await educationController.deleteEducation(
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