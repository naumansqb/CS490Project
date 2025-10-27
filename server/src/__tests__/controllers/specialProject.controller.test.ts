import { Response } from "express";
import * as specialProjectController from "../../controllers/specialProject.controller";
import { prisma } from "../../db";
import { AuthRequest } from "../../middleware/auth.middleware";
import { Prisma } from "@prisma/client";

jest.mock("../../db", () => ({
  prisma: {
    specialProject: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("Special Project Controller", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  const mockFirebaseUID = "firebase-test-uid-project-303";

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

  describe("createSpecialProject", () => {
    it("should create a special project successfully", async () => {
      const projectData = {
        projectName: "E-Commerce Platform",
        description: "Full-stack e-commerce application with payment integration",
        startDate: new Date("2023-01-15"),
        endDate: new Date("2023-06-30"),
        status: "completed",
        projectUrl: "https://myproject.com",
        repositoryUrl: "https://github.com/user/project",
        skillsDemonstrated: ["React", "Node.js", "PostgreSQL"],
      };

      const mockCreatedProject = {
        id: "project-123",
        userId: mockFirebaseUID,
        ...projectData,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest = { userId: mockFirebaseUID, body: projectData };
      (prisma.specialProject.create as jest.Mock).mockResolvedValue(
        mockCreatedProject
      );

      await specialProjectController.createSpecialProject(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          projectName: projectData.projectName,
          description: projectData.description,
        })
      );
    });

    it("should return 404 when user profile not found", async () => {
      const projectData = {
        projectName: "Test Project",
        description: "Test Description",
      };

      mockRequest = { userId: mockFirebaseUID, body: projectData };

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed",
        { code: "P2003", clientVersion: "5.0.0" }
      );
      (prisma.specialProject.create as jest.Mock).mockRejectedValue(
        prismaError
      );

      await specialProjectController.createSpecialProject(
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
      const projectData = {
        projectName: "",
        description: "Test",
      };

      mockRequest = { userId: mockFirebaseUID, body: projectData };

      await specialProjectController.createSpecialProject(
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

    it("should create project with in-progress status", async () => {
      const projectData = {
        projectName: "Ongoing Project",
        description: "Currently working on this",
        startDate: new Date("2024-01-01"),
        status: "in-progress",
        skillsDemonstrated: ["Python", "Django"],
      };

      const mockCreatedProject = {
        id: "project-456",
        userId: mockFirebaseUID,
        ...projectData,
        endDate: null,
        projectUrl: null,
        repositoryUrl: null,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest = { userId: mockFirebaseUID, body: projectData };
      (prisma.specialProject.create as jest.Mock).mockResolvedValue(
        mockCreatedProject
      );

      await specialProjectController.createSpecialProject(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "in-progress",
          endDate: null,
        })
      );
    });
  });

  describe("getSpecialProject", () => {
    it("should get a special project by id", async () => {
      const mockProject = {
        id: "project-123",
        userId: mockFirebaseUID,
        projectName: "AI Chatbot",
        description: "Machine learning powered chatbot",
        startDate: new Date("2023-03-01"),
        endDate: new Date("2023-08-15"),
        status: "completed",
        projectUrl: "https://chatbot.example.com",
        repositoryUrl: "https://github.com/user/chatbot",
        skillsDemonstrated: ["Python", "TensorFlow", "NLP"],
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        userProfile: {
          userId: mockFirebaseUID,
          firstName: "Test",
          lastName: "User",
        },
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "project-123" } };
      (prisma.specialProject.findUnique as jest.Mock).mockResolvedValue(
        mockProject
      );

      await specialProjectController.getSpecialProject(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "project-123",
          projectName: "AI Chatbot",
        })
      );
    });

    it("should return 404 when special project not found", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "non-existent-id" },
      };
      (prisma.specialProject.findUnique as jest.Mock).mockResolvedValue(null);

      await specialProjectController.getSpecialProject(
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
      const mockProject = {
        id: "project-123",
        userId: "different-user-id",
        projectName: "Test Project",
        description: "Test Description",
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "project-123" } };
      (prisma.specialProject.findUnique as jest.Mock).mockResolvedValue(
        mockProject
      );

      await specialProjectController.getSpecialProject(
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

  describe("getSpecialProjectsByUserId", () => {
    it("should get all special projects for a user", async () => {
      const mockProjects = [
        {
          id: "project-1",
          userId: mockFirebaseUID,
          projectName: "Project Alpha",
          description: "First project",
          startDate: new Date("2023-01-01"),
          endDate: new Date("2023-06-30"),
          status: "completed",
          projectUrl: null,
          repositoryUrl: null,
          skillsDemonstrated: ["React", "Node.js"],
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "project-2",
          userId: mockFirebaseUID,
          projectName: "Project Beta",
          description: "Second project",
          startDate: new Date("2023-07-01"),
          endDate: null,
          status: "in-progress",
          projectUrl: null,
          repositoryUrl: null,
          skillsDemonstrated: ["Python", "FastAPI"],
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
      (prisma.specialProject.findMany as jest.Mock).mockResolvedValue(
        mockProjects
      );

      await specialProjectController.getSpecialProjectsByUserId(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ projectName: "Project Alpha" }),
          expect.objectContaining({ projectName: "Project Beta" }),
        ])
      );
    });

    it("should filter projects by status", async () => {
      const mockProjects = [
        {
          id: "project-1",
          userId: mockFirebaseUID,
          projectName: "Completed Project",
          description: "Done",
          status: "completed",
          skillsDemonstrated: [],
          startDate: new Date("2023-01-01"),
        },
      ];

      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: mockFirebaseUID },
        query: { status: "completed" },
      };
      (prisma.specialProject.findMany as jest.Mock).mockResolvedValue(
        mockProjects
      );

      await specialProjectController.getSpecialProjectsByUserId(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(prisma.specialProject.findMany).toHaveBeenCalledWith({
        where: { userId: mockFirebaseUID, status: "completed" },
        orderBy: [{ startDate: "desc" }],
      });
      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ status: "completed" }),
        ])
      );
    });

    it("should return 403 when accessing another user's projects", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { userId: "different-user-id" },
        query: {},
      };

      await specialProjectController.getSpecialProjectsByUserId(
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
      expect(prisma.specialProject.findMany).not.toHaveBeenCalled();
    });
  });

  describe("updateSpecialProject", () => {
    it("should update a special project", async () => {
      const existingProject = {
        id: "project-123",
        userId: mockFirebaseUID,
        projectName: "Old Project Name",
        description: "Old Description",
      };

      const updatedProject = {
        ...existingProject,
        projectName: "Updated Project Name",
        updatedAt: new Date(),
      };

      const updateData = { projectName: "Updated Project Name" };
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "project-123" },
        body: updateData,
      };

      (prisma.specialProject.findUnique as jest.Mock).mockResolvedValue(
        existingProject
      );
      (prisma.specialProject.update as jest.Mock).mockResolvedValue(
        updatedProject
      );

      await specialProjectController.updateSpecialProject(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "project-123",
          projectName: "Updated Project Name",
        })
      );
    });

    it("should return 404 when updating non-existent project", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "non-existent-id" },
        body: { projectName: "Test" },
      };

      (prisma.specialProject.findUnique as jest.Mock).mockResolvedValue(null);

      await specialProjectController.updateSpecialProject(
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
      const existingProject = {
        id: "project-123",
        userId: "different-user-id",
        projectName: "Test Project",
      };

      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "project-123" },
        body: { projectName: "Updated Name" },
      };

      (prisma.specialProject.findUnique as jest.Mock).mockResolvedValue(
        existingProject
      );

      await specialProjectController.updateSpecialProject(
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
      expect(prisma.specialProject.update).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid update data", async () => {
      const existingProject = {
        id: "project-123",
        userId: mockFirebaseUID,
        projectName: "Test Project",
      };

      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "project-123" },
        body: { projectName: "" },
      };

      (prisma.specialProject.findUnique as jest.Mock).mockResolvedValue(
        existingProject
      );

      await specialProjectController.updateSpecialProject(
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

  describe("deleteSpecialProject", () => {
    it("should delete a special project", async () => {
      const existingProject = {
        id: "project-123",
        userId: mockFirebaseUID,
        projectName: "Delete This Project",
        description: "To be deleted",
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "project-123" } };

      (prisma.specialProject.findUnique as jest.Mock).mockResolvedValue(
        existingProject
      );
      (prisma.specialProject.delete as jest.Mock).mockResolvedValue(
        existingProject
      );

      await specialProjectController.deleteSpecialProject(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent project", async () => {
      mockRequest = {
        userId: mockFirebaseUID,
        params: { id: "non-existent-id" },
      };

      (prisma.specialProject.findUnique as jest.Mock).mockResolvedValue(null);

      await specialProjectController.deleteSpecialProject(
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
      const existingProject = {
        id: "project-123",
        userId: "different-user-id",
        projectName: "Test Project",
      };

      mockRequest = { userId: mockFirebaseUID, params: { id: "project-123" } };

      (prisma.specialProject.findUnique as jest.Mock).mockResolvedValue(
        existingProject
      );

      await specialProjectController.deleteSpecialProject(
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
      expect(prisma.specialProject.delete).not.toHaveBeenCalled();
    });
  });
});