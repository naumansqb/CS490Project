import { Response } from "express";
import * as skillController from "../../controllers/skill.controller";
import { prisma } from "../../db";
import { AuthRequest } from "../../middleware/auth.middleware";
import { Prisma } from "@prisma/client";

jest.mock("../../db", () => ({
  prisma: {
    skill: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("Skill Controller", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  const mockFirebaseUID = "firebase-test-uid-skill-202";

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

  describe("createSkill", () => {
    it("should create a skill successfully", async () => {
      const skillData = {
        skillName: "JavaScript",
        skillCategory: "Programming Languages",
        proficiencyLevel: "Expert",
        yearsOfExperience: 5,
      };

      const mockCreatedSkill = {
        id: "skill-123",
        userId: mockFirebaseUID,
        ...skillData,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest = { userId: mockFirebaseUID, body: skillData };
      (prisma.skill.create as jest.Mock).mockResolvedValue(mockCreatedSkill);

      await skillController.createSkill(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          skillName: skillData.skillName,
          proficiencyLevel: skillData.proficiencyLevel,
        })
      );
    });

    it("should return 404 when user profile not found", async () => {
      const skillData = {
        skillName: "Python",
        skillCategory: "Programming",
      };

      mockRequest = { userId: mockFirebaseUID, body: skillData };

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed",
        { code: "P2003", clientVersion: "5.0.0" }
      );
      (prisma.skill.create as jest.Mock).mockRejectedValue(prismaError);

      await skillController.createSkill(
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
      const skillData = {
        skillName: "",
        skillCategory: "Test",
      };

      mockRequest = { userId: mockFirebaseUID, body: skillData };

      await skillController.createSkill(
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

    it("should return 409 for duplicate skill name", async () => {
      const skillData = {
        skillName: "React",
        skillCategory: "Frameworks",
      };

      mockRequest = { userId: mockFirebaseUID, body: skillData };

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        { code: "P2002", clientVersion: "5.0.0" }
      );
      (prisma.skill.create as jest.Mock).mockRejectedValue(prismaError);

      await skillController.createSkill(
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
  });

  describe("getSkill", () => {
    it("should get a skill by id", async () => {
      const mockSkill = {
        id: "skill-123",
        userId: mockFirebaseUID,
        skillName: "TypeScript",
        skillCategory: "Programming Languages",
        proficiencyLevel: "Advanced",
        yearsOfExperience: 3,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        userProfile: {
          userId: mockFirebaseUID,
          firstName: "Test",
          lastName: "User",
        },
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "skill-123" } };
      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(mockSkill);

      await skillController.getSkill(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "skill-123",
          skillName: "TypeScript",
        })
      );
    });

    it("should return 404 when skill not found", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "non-existent-id" },
      };
      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(null);

      await skillController.getSkill(
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
      const mockSkill = {
        id: "skill-123",
        userId: "different-user-id",
        skillName: "Test Skill",
        skillCategory: "Test",
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "skill-123" } };
      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(mockSkill);

      await skillController.getSkill(
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

  describe("getSkillsByUserId", () => {
    it("should get all skills for a user", async () => {
      const mockSkills = [
        {
          id: "skill-1",
          userId: mockFirebaseUID,
          skillName: "Node.js",
          skillCategory: "Backend",
          proficiencyLevel: "Expert",
          yearsOfExperience: 4,
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "skill-2",
          userId: mockFirebaseUID,
          skillName: "PostgreSQL",
          skillCategory: "Databases",
          proficiencyLevel: "Intermediate",
          yearsOfExperience: 2,
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: mockFirebaseUID },
        query: {},
      };
      (prisma.skill.findMany as jest.Mock).mockResolvedValue(mockSkills);

      await skillController.getSkillsByUserId(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ skillName: "Node.js" }),
          expect.objectContaining({ skillName: "PostgreSQL" }),
        ])
      );
    });

    it("should filter skills by category", async () => {
      const mockSkills = [
        {
          id: "skill-1",
          userId: mockFirebaseUID,
          skillName: "Express",
          skillCategory: "Backend",
          proficiencyLevel: "Expert",
          yearsOfExperience: 3,
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: mockFirebaseUID },
        query: { category: "Backend" },
      };
      (prisma.skill.findMany as jest.Mock).mockResolvedValue(mockSkills);

      await skillController.getSkillsByUserId(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(prisma.skill.findMany).toHaveBeenCalledWith({
        where: { userId: mockFirebaseUID, skillCategory: "Backend" },
        orderBy: { displayOrder: "asc" },
      });
      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ skillName: "Express" }),
        ])
      );
    });

    it("should return 403 when accessing another user's skills", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: "different-user-id" },
        query: {},
      };

      await skillController.getSkillsByUserId(
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
      expect(prisma.skill.findMany).not.toHaveBeenCalled();
    });
  });

  describe("updateSkill", () => {
    it("should update a skill", async () => {
      const existingSkill = {
        id: "skill-123",
        userId: mockFirebaseUID,
        skillName: "Docker",
        skillCategory: "DevOps",
        proficiencyLevel: "Beginner",
      };

      const updatedSkill = {
        ...existingSkill,
        proficiencyLevel: "Intermediate",
        updatedAt: new Date(),
      };

      const updateData = { proficiencyLevel: "Intermediate" };
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "skill-123" },
        body: updateData,
      };

      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(existingSkill);
      (prisma.skill.update as jest.Mock).mockResolvedValue(updatedSkill);

      await skillController.updateSkill(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "skill-123",
          proficiencyLevel: "Intermediate",
        })
      );
    });

    it("should return 404 when updating non-existent skill", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "non-existent-id" },
        body: { proficiencyLevel: "Expert" },
      };

      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(null);

      await skillController.updateSkill(
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
      const existingSkill = {
        id: "skill-123",
        userId: "different-user-id",
        skillName: "Test Skill",
      };

      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "skill-123" },
        body: { proficiencyLevel: "Expert" },
      };

      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(existingSkill);

      await skillController.updateSkill(
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
      expect(prisma.skill.update).not.toHaveBeenCalled();
    });

    it("should return 409 when updating to duplicate skill name", async () => {
      const existingSkill = {
        id: "skill-123",
        userId: mockFirebaseUID,
        skillName: "Terraform",
      };

      const updateData = { skillName: "Kubernetes" };
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "skill-123" },
        body: updateData,
      };

      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(existingSkill);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        { code: "P2002", clientVersion: "5.0.0" }
      );
      (prisma.skill.update as jest.Mock).mockRejectedValue(prismaError);

      await skillController.updateSkill(
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

    it("should return 400 for invalid update data", async () => {
      const existingSkill = {
        id: "skill-123",
        userId: mockFirebaseUID,
        skillName: "Test Skill",
      };

      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "skill-123" },
        body: { skillName: "" },
      };

      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(existingSkill);

      await skillController.updateSkill(
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

  describe("deleteSkill", () => {
    it("should delete a skill", async () => {
      const existingSkill = {
        id: "skill-123",
        userId: mockFirebaseUID,
        skillName: "Old Skill",
        skillCategory: "Deprecated",
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "skill-123" } };

      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(existingSkill);
      (prisma.skill.delete as jest.Mock).mockResolvedValue(existingSkill);

      await skillController.deleteSkill(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent skill", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "non-existent-id" },
      };

      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(null);

      await skillController.deleteSkill(
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
      const existingSkill = {
        id: "skill-123",
        userId: "different-user-id",
        skillName: "Test Skill",
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "skill-123" } };

      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(existingSkill);

      await skillController.deleteSkill(
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
      expect(prisma.skill.delete).not.toHaveBeenCalled();
    });
  });
});