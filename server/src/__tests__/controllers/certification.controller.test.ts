import { Response } from "express";
import * as certificationController from "../../controllers/certification.controller";
import { prisma } from "../../db";
import { AuthRequest } from "../../middleware/auth.middleware";
import { Prisma } from "@prisma/client";

jest.mock("../../db", () => ({
  prisma: {
    certification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("Certification Controller", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  const mockFirebaseUID = "firebase-test-uid-cert-789";

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
    jest.clearAllMocks();
  });

  describe("createCertification", () => {
    it("should create a certification successfully", async () => {
      const certData = {
        name: "AWS Certified Solutions Architect",
        issuingOrganization: "Amazon Web Services",
        issueDate: new Date("2023-01-15"),
        expirationDate: new Date("2026-01-15"),
      };

      const mockCreatedCert = {
        id: "cert-123",
        userId: mockFirebaseUID,
        ...certData,
        doesNotExpire: false,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest = { userId: mockFirebaseUID, body: certData };
      (prisma.certification.create as jest.Mock).mockResolvedValue(
        mockCreatedCert
      );

      await certificationController.createCertification(
        mockRequest as AuthRequest,
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
        name: "Test Cert",
        issuingOrganization: "Test Org",
        issueDate: new Date("2023-01-01"),
      };

      mockRequest = { userId: mockFirebaseUID, body: certData };

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed",
        { code: "P2003", clientVersion: "5.0.0" }
      );
      (prisma.certification.create as jest.Mock).mockRejectedValue(prismaError);

      await certificationController.createCertification(
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

    it("should return 400 for validation errors", async () => {
      const certData = {
        name: "",
        issuingOrganization: "Test Org",
      };

      mockRequest = { userId: mockFirebaseUID, body: certData };

      await certificationController.createCertification(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: expect.any(Array),
        })
      );
    });

    it("should create certification with doesNotExpire flag", async () => {
      const certData = {
        name: "CompTIA A+",
        issuingOrganization: "CompTIA",
        issueDate: new Date("2022-06-01"),
        doesNotExpire: true,
      };

      const mockCreatedCert = {
        id: "cert-456",
        userId: mockFirebaseUID,
        ...certData,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest = { userId: mockFirebaseUID, body: certData };
      (prisma.certification.create as jest.Mock).mockResolvedValue(
        mockCreatedCert
      );

      await certificationController.createCertification(
        mockRequest as AuthRequest,
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
      const mockCert = {
        id: "cert-123",
        userId: mockFirebaseUID,
        name: "Google Cloud Professional",
        issuingOrganization: "Google",
        issueDate: new Date("2023-03-01"),
        expirationDate: null,
        doesNotExpire: false,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        userProfile: {
          userId: mockFirebaseUID,
          firstName: "Test",
          lastName: "User",
        },
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "cert-123" } };
      (prisma.certification.findUnique as jest.Mock).mockResolvedValue(
        mockCert
      );

      await certificationController.getCertification(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "cert-123",
          name: "Google Cloud Professional",
        })
      );
    });

    it("should return 404 when certification not found", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "non-existent-id" },
      };
      (prisma.certification.findUnique as jest.Mock).mockResolvedValue(null);

      await certificationController.getCertification(
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

    it("should return 403 when user not authorized", async () => {
      const mockCert = {
        id: "cert-123",
        userId: "different-user-id",
        name: "Test Cert",
        issuingOrganization: "Test Org",
        issueDate: new Date(),
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "cert-123" } };
      (prisma.certification.findUnique as jest.Mock).mockResolvedValue(
        mockCert
      );

      await certificationController.getCertification(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "FORBIDDEN",
          message: expect.any(String),
        })
      );
    });
  });

  describe("getCertificationsByUserId", () => {
    it("should get all certifications for a user", async () => {
      const mockCerts = [
        {
          id: "cert-1",
          userId: mockFirebaseUID,
          name: "Certification A",
          issuingOrganization: "Org A",
          issueDate: new Date("2023-01-01"),
          expirationDate: null,
          doesNotExpire: false,
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "cert-2",
          userId: mockFirebaseUID,
          name: "Certification B",
          issuingOrganization: "Org B",
          issueDate: new Date("2022-06-01"),
          expirationDate: null,
          doesNotExpire: true,
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: mockFirebaseUID },
      };
      (prisma.certification.findMany as jest.Mock).mockResolvedValue(mockCerts);

      await certificationController.getCertificationsByUserId(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: "Certification A" }),
          expect.objectContaining({ name: "Certification B" }),
        ])
      );
    });

    it("should return 403 when accessing another user's certifications", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: "different-user-id" },
      };

      await certificationController.getCertificationsByUserId(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "FORBIDDEN",
          message: expect.any(String),
        })
      );
      expect(prisma.certification.findMany).not.toHaveBeenCalled();
    });
  });

  describe("updateCertification", () => {
    it("should update a certification", async () => {
      const existingCert = {
        id: "cert-123",
        userId: mockFirebaseUID,
        name: "Old Cert Name",
        issuingOrganization: "Test Org",
        issueDate: new Date("2023-01-01"),
      };

      const updatedCert = {
        ...existingCert,
        name: "Updated Cert Name",
        updatedAt: new Date(),
      };

      const updateData = { name: "Updated Cert Name" };
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "cert-123" },
        body: updateData,
      };

      (prisma.certification.findUnique as jest.Mock).mockResolvedValue(
        existingCert
      );
      (prisma.certification.update as jest.Mock).mockResolvedValue(updatedCert);

      await certificationController.updateCertification(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "cert-123",
          name: "Updated Cert Name",
        })
      );
    });

    it("should return 404 when updating non-existent certification", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "non-existent-id" },
        body: { name: "Test" },
      };

      (prisma.certification.findUnique as jest.Mock).mockResolvedValue(null);

      await certificationController.updateCertification(
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

    it("should return 403 when user not authorized to update", async () => {
      const existingCert = {
        id: "cert-123",
        userId: "different-user-id",
        name: "Test Cert",
      };

      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "cert-123" },
        body: { name: "Updated Name" },
      };

      (prisma.certification.findUnique as jest.Mock).mockResolvedValue(
        existingCert
      );

      await certificationController.updateCertification(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "FORBIDDEN",
          message: expect.any(String),
        })
      );
      expect(prisma.certification.update).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid update data", async () => {
      const existingCert = {
        id: "cert-123",
        userId: mockFirebaseUID,
        name: "Test Cert",
      };

      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "cert-123" },
        body: { name: "" },
      };

      (prisma.certification.findUnique as jest.Mock).mockResolvedValue(
        existingCert
      );

      await certificationController.updateCertification(
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

  describe("deleteCertification", () => {
    it("should delete a certification", async () => {
      const existingCert = {
        id: "cert-123",
        userId: mockFirebaseUID,
        name: "Delete Me",
        issuingOrganization: "Test Org",
        issueDate: new Date("2023-01-01"),
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "cert-123" } };

      (prisma.certification.findUnique as jest.Mock).mockResolvedValue(
        existingCert
      );
      (prisma.certification.delete as jest.Mock).mockResolvedValue(
        existingCert
      );

      await certificationController.deleteCertification(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent certification", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "non-existent-id" },
      };

      (prisma.certification.findUnique as jest.Mock).mockResolvedValue(null);

      await certificationController.deleteCertification(
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

    it("should return 403 when user not authorized to delete", async () => {
      const existingCert = {
        id: "cert-123",
        userId: "different-user-id",
        name: "Test Cert",
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "cert-123" } };

      (prisma.certification.findUnique as jest.Mock).mockResolvedValue(
        existingCert
      );

      await certificationController.deleteCertification(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "FORBIDDEN",
          message: expect.any(String),
        })
      );
      expect(prisma.certification.delete).not.toHaveBeenCalled();
    });
  });
});