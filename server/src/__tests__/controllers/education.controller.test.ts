import { Request, Response } from "express";
import * as educationController from "../../controllers/education.controller";
import { prisma } from "../../db";

describe("Education Controller", () => {
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
        userId: "123e4567-e89b-12d3-a456-426614174200",
        firstName: "Test",
        lastName: "User",
      },
    });
    userProfileId = userProfile.id;
  });

  describe("createEducation", () => {
    it("should create an education record successfully", async () => {
      const educationData = {
        userId: userProfileId,
        institutionName: "MIT",
        degreeType: "Bachelor of Science",
        major: "Computer Science",
        startDate: new Date("2016-09-01"),
        graduationDate: new Date("2020-05-15"),
      };

      mockRequest = { body: educationData };

      await educationController.createEducation(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          institutionName: educationData.institutionName,
          major: educationData.major,
        })
      );
    });

    it("should return 404 when user profile not found", async () => {
      const educationData = {
        userId: "123e4567-e89b-12d3-a456-426614174999",
        institutionName: "MIT",
        degreeType: "Bachelor of Science",
        startDate: new Date("2016-09-01"),
      };

      mockRequest = { body: educationData };

      await educationController.createEducation(
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
      const educationData = {
        userId: userProfileId,
        institutionName: "",
      };

      mockRequest = { body: educationData };

      await educationController.createEducation(
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

  describe("getEducation", () => {
    it("should get an education record by id", async () => {
      const education = await prisma.education.create({
        data: {
          userId: userProfileId,
          institutionName: "Stanford",
          degreeType: "Master of Science",
          major: "Data Science",
          startDate: new Date("2020-09-01"),
        },
      });

      mockRequest = { params: { id: education.id } };

      await educationController.getEducation(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: education.id,
          institutionName: "Stanford",
        })
      );
    });

    it("should return 404 when education not found", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await educationController.getEducation(
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

  describe("getEducationsByUserId", () => {
    it("should get all education records for a user", async () => {
      await prisma.education.createMany({
        data: [
          {
            userId: userProfileId,
            institutionName: "University A",
            degreeType: "Bachelor",
            major: "Physics",
            startDate: new Date("2015-09-01"),
            isCurrent: false,
          },
          {
            userId: userProfileId,
            institutionName: "University B",
            degreeType: "Master",
            major: "Engineering",
            startDate: new Date("2019-09-01"),
            isCurrent: true,
          },
        ],
      });

      mockRequest = { params: { userId: userProfileId } };

      await educationController.getEducationsByUserId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ institutionName: "University A" }),
          expect.objectContaining({
            institutionName: "University B",
            isCurrent: true,
          }),
        ])
      );
    });
  });

  describe("updateEducation", () => {
    it("should update an education record", async () => {
      const education = await prisma.education.create({
        data: {
          userId: userProfileId,
          institutionName: "Old University",
          degreeType: "Bachelor",
          startDate: new Date("2015-09-01"),
        },
      });

      const updateData = {
        institutionName: "New University",
        major: "Biology",
      };
      mockRequest = { params: { id: education.id }, body: updateData };

      await educationController.updateEducation(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: education.id,
          institutionName: "New University",
          major: "Biology",
        })
      );
    });

    it("should return 404 when updating non-existent education", async () => {
      mockRequest = {
        params: { id: "123e4567-e89b-12d3-a456-426614174999" },
        body: { institutionName: "Test" },
      };

      await educationController.updateEducation(
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

  describe("deleteEducation", () => {
    it("should delete an education record", async () => {
      const education = await prisma.education.create({
        data: {
          userId: userProfileId,
          institutionName: "Delete Me University",
          degreeType: "Bachelor",
          startDate: new Date("2015-09-01"),
        },
      });

      mockRequest = { params: { id: education.id } };

      await educationController.deleteEducation(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent education", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await educationController.deleteEducation(
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
