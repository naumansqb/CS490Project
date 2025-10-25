import { Request, Response } from "express";
import * as certificationController from "../../controllers/certification.controller";
import { prisma } from "../../db";

describe("Certification Controller", () => {
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
        userId: "123e4567-e89b-12d3-a456-426614174400",
        firstName: "Test",
        lastName: "User",
      },
    });
    userProfileId = userProfile.id;
  });

  describe("createCertification", () => {
    it("should create a certification successfully", async () => {
      const certData = {
        userId: userProfileId,
        name: "AWS Certified Developer",
        issuingOrganization: "Amazon Web Services",
        issueDate: new Date("2023-01-15"),
        expirationDate: new Date("2026-01-15"),
      };

      mockRequest = { body: certData };

      await certificationController.createCertification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: certData.name,
          issuingOrganization: certData.issuingOrganization,
        })
      );
    });

    it("should return 404 when user profile not found", async () => {
      const certData = {
        userId: "123e4567-e89b-12d3-a456-426614174999",
        name: "Test Cert",
        issuingOrganization: "Test Org",
        issueDate: new Date("2023-01-01"),
      };

      mockRequest = { body: certData };

      await certificationController.createCertification(
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
      const certData = {
        userId: userProfileId,
        name: "",
        issuingOrganization: "Test Org",
      };

      mockRequest = { body: certData };

      await certificationController.createCertification(
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

    it("should create certification with doesNotExpire flag", async () => {
      const certData = {
        userId: userProfileId,
        name: "CompTIA A+",
        issuingOrganization: "CompTIA",
        issueDate: new Date("2022-06-01"),
        doesNotExpire: true,
      };

      mockRequest = { body: certData };

      await certificationController.createCertification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: certData.name,
          doesNotExpire: true,
        })
      );
    });
  });

  describe("getCertification", () => {
    it("should get a certification by id", async () => {
      const cert = await prisma.certification.create({
        data: {
          userId: userProfileId,
          name: "Google Cloud Professional",
          issuingOrganization: "Google",
          issueDate: new Date("2023-03-01"),
        },
      });

      mockRequest = { params: { id: cert.id } };

      await certificationController.getCertification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: cert.id,
          name: "Google Cloud Professional",
        })
      );
    });

    it("should return 404 when certification not found", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await certificationController.getCertification(
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

  describe("getCertificationsByUserId", () => {
    it("should get all certifications for a user", async () => {
      await prisma.certification.createMany({
        data: [
          {
            userId: userProfileId,
            name: "Certification A",
            issuingOrganization: "Org A",
            issueDate: new Date("2023-01-01"),
          },
          {
            userId: userProfileId,
            name: "Certification B",
            issuingOrganization: "Org B",
            issueDate: new Date("2022-06-01"),
          },
        ],
      });

      mockRequest = { params: { userId: userProfileId } };

      await certificationController.getCertificationsByUserId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: "Certification A" }),
          expect.objectContaining({ name: "Certification B" }),
        ])
      );
    });
  });

  describe("updateCertification", () => {
    it("should update a certification", async () => {
      const cert = await prisma.certification.create({
        data: {
          userId: userProfileId,
          name: "Old Cert Name",
          issuingOrganization: "Test Org",
          issueDate: new Date("2023-01-01"),
        },
      });

      const updateData = { name: "Updated Cert Name" };
      mockRequest = { params: { id: cert.id }, body: updateData };

      await certificationController.updateCertification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: cert.id,
          name: "Updated Cert Name",
        })
      );
    });

    it("should return 404 when updating non-existent certification", async () => {
      mockRequest = {
        params: { id: "123e4567-e89b-12d3-a456-426614174999" },
        body: { name: "Test" },
      };

      await certificationController.updateCertification(
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

  describe("deleteCertification", () => {
    it("should delete a certification", async () => {
      const cert = await prisma.certification.create({
        data: {
          userId: userProfileId,
          name: "Delete Me",
          issuingOrganization: "Test Org",
          issueDate: new Date("2023-01-01"),
        },
      });

      mockRequest = { params: { id: cert.id } };

      await certificationController.deleteCertification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent certification", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await certificationController.deleteCertification(
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
