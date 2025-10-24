import { Request, Response } from "express";
import * as workExperienceController from "../../controllers/workExperience.controller";
import { prisma } from "../../db";

describe("WorkExperience Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  let userProfileId: string;

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
        userId: "123e4567-e89b-12d3-a456-426614174100",
        firstName: "Test",
        lastName: "User",
      },
    });
    userProfileId = userProfile.id;
  });

  describe("createWorkExperience", () => {
    it("should create a work experience successfully", async () => {
      const workExpData = {
        userId: userProfileId,
        companyName: "Tech Corp",
        positionTitle: "Software Engineer",
        startDate: new Date("2020-01-01"),
        isCurrent: true,
      };

      mockRequest = { body: workExpData };

      await workExperienceController.createWorkExperience(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: workExpData.companyName,
          positionTitle: workExpData.positionTitle,
        })
      );
    });

    it("should return 404 when user profile not found", async () => {
      const workExpData = {
        userId: "123e4567-e89b-12d3-a456-426614174999",
        companyName: "Tech Corp",
        positionTitle: "Software Engineer",
        startDate: new Date("2020-01-01"),
      };

      mockRequest = { body: workExpData };

      await workExperienceController.createWorkExperience(
        mockRequest as Request,
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

    it("should return 400 for validation errors", async () => {
      const workExpData = {
        userId: userProfileId,
        companyName: "",
      };

      mockRequest = { body: workExpData };

      await workExperienceController.createWorkExperience(
        mockRequest as Request,
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

  describe("getWorkExperience", () => {
    it("should get a work experience by id", async () => {
      const workExp = await prisma.workExperience.create({
        data: {
          userId: userProfileId,
          companyName: "Acme Inc",
          positionTitle: "Developer",
          startDate: new Date("2019-06-01"),
        },
      });

      mockRequest = { params: { id: workExp.id } };

      await workExperienceController.getWorkExperience(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: workExp.id,
          companyName: "Acme Inc",
        })
      );
    });

    it("should return 404 when work experience not found", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await workExperienceController.getWorkExperience(
        mockRequest as Request,
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

  describe("getWorkExperiencesByUserId", () => {
    it("should get all work experiences for a user", async () => {
      await prisma.workExperience.createMany({
        data: [
          {
            userId: userProfileId,
            companyName: "Company A",
            positionTitle: "Role A",
            startDate: new Date("2020-01-01"),
            isCurrent: true,
          },
          {
            userId: userProfileId,
            companyName: "Company B",
            positionTitle: "Role B",
            startDate: new Date("2018-01-01"),
            endDate: new Date("2019-12-31"),
          },
        ],
      });

      mockRequest = { params: { userId: userProfileId } };

      await workExperienceController.getWorkExperiencesByUserId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            companyName: "Company A",
            isCurrent: true,
          }),
          expect.objectContaining({ companyName: "Company B" }),
        ])
      );
    });
  });

  describe("updateWorkExperience", () => {
    it("should update a work experience", async () => {
      const workExp = await prisma.workExperience.create({
        data: {
          userId: userProfileId,
          companyName: "Old Company",
          positionTitle: "Old Role",
          startDate: new Date("2020-01-01"),
        },
      });

      const updateData = { companyName: "New Company" };
      mockRequest = { params: { id: workExp.id }, body: updateData };

      await workExperienceController.updateWorkExperience(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: workExp.id,
          companyName: "New Company",
        })
      );
    });

    it("should return 404 when updating non-existent work experience", async () => {
      mockRequest = {
        params: { id: "123e4567-e89b-12d3-a456-426614174999" },
        body: { companyName: "Test" },
      };

      await workExperienceController.updateWorkExperience(
        mockRequest as Request,
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

  describe("deleteWorkExperience", () => {
    it("should delete a work experience", async () => {
      const workExp = await prisma.workExperience.create({
        data: {
          userId: userProfileId,
          companyName: "Delete Me",
          positionTitle: "Test Role",
          startDate: new Date("2020-01-01"),
        },
      });

      mockRequest = { params: { id: workExp.id } };

      await workExperienceController.deleteWorkExperience(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent work experience", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await workExperienceController.deleteWorkExperience(
        mockRequest as Request,
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
