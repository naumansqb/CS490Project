import { Request, Response } from "express";
import * as specialProjectController from "../../controllers/specialProject.controller";
import { prisma } from "../../db";

describe("SpecialProject Controller", () => {
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
        userId: "123e4567-e89b-12d3-a456-426614174500",
        firstName: "Test",
        lastName: "User",
      },
    });
    userProfileId = userProfile.id;
  });

  describe("createSpecialProject", () => {
    it("should create a special project successfully", async () => {
      const projectData = {
        userId: userProfileId,
        projectName: "E-Commerce Platform",
        description: "Built a full-stack e-commerce application",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2023-06-01"),
        status: "completed",
        projectUrl: "https://example.com",
        repositoryUrl: "https://github.com/user/project",
        skillsDemonstrated: ["React", "Node.js", "PostgreSQL"],
      };

      mockRequest = { body: projectData };

      await specialProjectController.createSpecialProject(
        mockRequest as Request,
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
        userId: "123e4567-e89b-12d3-a456-426614174999",
        projectName: "Test Project",
        description: "Test description",
      };

      mockRequest = { body: projectData };

      await specialProjectController.createSpecialProject(
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
      const projectData = {
        userId: userProfileId,
        projectName: "",
        description: "",
      };

      mockRequest = { body: projectData };

      await specialProjectController.createSpecialProject(
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

    it("should create project with skillsDemonstrated array", async () => {
      const projectData = {
        userId: userProfileId,
        projectName: "AI Chatbot",
        description: "Built an AI-powered chatbot",
        skillsDemonstrated: ["Python", "TensorFlow", "NLP"],
      };

      mockRequest = { body: projectData };

      await specialProjectController.createSpecialProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          skillsDemonstrated: expect.arrayContaining([
            "Python",
            "TensorFlow",
            "NLP",
          ]),
        })
      );
    });
  });

  describe("getSpecialProject", () => {
    it("should get a special project by id", async () => {
      const project = await prisma.specialProject.create({
        data: {
          userId: userProfileId,
          projectName: "Mobile App",
          description: "Developed a mobile application",
          status: "in-progress",
        },
      });

      mockRequest = { params: { id: project.id } };

      await specialProjectController.getSpecialProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: project.id,
          projectName: "Mobile App",
        })
      );
    });

    it("should return 404 when special project not found", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await specialProjectController.getSpecialProject(
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

  describe("getSpecialProjectsByUserId", () => {
    it("should get all special projects for a user", async () => {
      await prisma.specialProject.createMany({
        data: [
          {
            userId: userProfileId,
            projectName: "Project A",
            description: "Description A",
            status: "completed",
          },
          {
            userId: userProfileId,
            projectName: "Project B",
            description: "Description B",
            status: "in-progress",
          },
        ],
      });

      mockRequest = { params: { userId: userProfileId }, query: {} };

      await specialProjectController.getSpecialProjectsByUserId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ projectName: "Project A" }),
          expect.objectContaining({ projectName: "Project B" }),
        ])
      );
    });

    it("should filter projects by status", async () => {
      await prisma.specialProject.createMany({
        data: [
          {
            userId: userProfileId,
            projectName: "Completed Project",
            description: "Done",
            status: "completed",
          },
          {
            userId: userProfileId,
            projectName: "Active Project",
            description: "Ongoing",
            status: "in-progress",
          },
        ],
      });

      mockRequest = {
        params: { userId: userProfileId },
        query: { status: "completed" },
      };

      await specialProjectController.getSpecialProjectsByUserId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            projectName: "Completed Project",
            status: "completed",
          }),
        ])
      );
    });
  });

  describe("updateSpecialProject", () => {
    it("should update a special project", async () => {
      const project = await prisma.specialProject.create({
        data: {
          userId: userProfileId,
          projectName: "Old Name",
          description: "Old description",
          status: "in-progress",
        },
      });

      const updateData = { projectName: "New Name", status: "completed" };
      mockRequest = { params: { id: project.id }, body: updateData };

      await specialProjectController.updateSpecialProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: project.id,
          projectName: "New Name",
          status: "completed",
        })
      );
    });

    it("should return 404 when updating non-existent project", async () => {
      mockRequest = {
        params: { id: "123e4567-e89b-12d3-a456-426614174999" },
        body: { projectName: "Test" },
      };

      await specialProjectController.updateSpecialProject(
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

  describe("deleteSpecialProject", () => {
    it("should delete a special project", async () => {
      const project = await prisma.specialProject.create({
        data: {
          userId: userProfileId,
          projectName: "Delete Me",
          description: "Test project",
        },
      });

      mockRequest = { params: { id: project.id } };

      await specialProjectController.deleteSpecialProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent project", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await specialProjectController.deleteSpecialProject(
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
