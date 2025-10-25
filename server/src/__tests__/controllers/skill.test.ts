import { Request, Response } from "express";
import * as skillController from "../../controllers/skill.controller";
import { prisma } from "../../db";

describe("Skill Controller", () => {
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
        userId: "123e4567-e89b-12d3-a456-426614174300",
        firstName: "Test",
        lastName: "User",
      },
    });
    userProfileId = userProfile.id;
  });

  describe("createSkill", () => {
    it("should create a skill successfully", async () => {
      const skillData = {
        userId: userProfileId,
        skillName: "JavaScript",
        skillCategory: "Programming",
        proficiencyLevel: "Advanced",
        yearsOfExperience: 5.5,
      };

      mockRequest = { body: skillData };

      await skillController.createSkill(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          skillName: skillData.skillName,
          skillCategory: skillData.skillCategory,
        })
      );
    });

    it("should return 404 when user profile not found", async () => {
      const skillData = {
        userId: "123e4567-e89b-12d3-a456-426614174999",
        skillName: "Python",
      };

      mockRequest = { body: skillData };

      await skillController.createSkill(
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
      const skillData = {
        userId: userProfileId,
        skillName: "",
      };

      mockRequest = { body: skillData };

      await skillController.createSkill(
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

    it("should return 409 for duplicate skill name", async () => {
      const skillData = {
        userId: userProfileId,
        skillName: "TypeScript",
      };

      await prisma.skill.create({ data: skillData });
      mockRequest = { body: skillData };

      await skillController.createSkill(
        mockRequest as Request,
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
      const skill = await prisma.skill.create({
        data: {
          userId: userProfileId,
          skillName: "React",
          skillCategory: "Frontend",
        },
      });

      mockRequest = { params: { id: skill.id } };

      await skillController.getSkill(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: skill.id,
          skillName: "React",
        })
      );
    });

    it("should return 404 when skill not found", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await skillController.getSkill(
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

  describe("getSkillsByUserId", () => {
    it("should get all skills for a user", async () => {
      await prisma.skill.createMany({
        data: [
          {
            userId: userProfileId,
            skillName: "Java",
            skillCategory: "Programming",
          },
          {
            userId: userProfileId,
            skillName: "SQL",
            skillCategory: "Database",
          },
        ],
      });

      mockRequest = { params: { userId: userProfileId }, query: {} };

      await skillController.getSkillsByUserId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ skillName: "Java" }),
          expect.objectContaining({ skillName: "SQL" }),
        ])
      );
    });

    it("should filter skills by category", async () => {
      await prisma.skill.createMany({
        data: [
          {
            userId: userProfileId,
            skillName: "Python",
            skillCategory: "Programming",
          },
          {
            userId: userProfileId,
            skillName: "PostgreSQL",
            skillCategory: "Database",
          },
        ],
      });

      mockRequest = {
        params: { userId: userProfileId },
        query: { category: "Programming" },
      };

      await skillController.getSkillsByUserId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            skillName: "Python",
            skillCategory: "Programming",
          }),
        ])
      );
    });
  });

  describe("updateSkill", () => {
    it("should update a skill", async () => {
      const skill = await prisma.skill.create({
        data: {
          userId: userProfileId,
          skillName: "Node.js",
          proficiencyLevel: "Intermediate",
        },
      });

      const updateData = { proficiencyLevel: "Advanced" };
      mockRequest = { params: { id: skill.id }, body: updateData };

      await skillController.updateSkill(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: skill.id,
          proficiencyLevel: "Advanced",
        })
      );
    });

    it("should return 404 when updating non-existent skill", async () => {
      mockRequest = {
        params: { id: "123e4567-e89b-12d3-a456-426614174999" },
        body: { proficiencyLevel: "Expert" },
      };

      await skillController.updateSkill(
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

  describe("deleteSkill", () => {
    it("should delete a skill", async () => {
      const skill = await prisma.skill.create({
        data: {
          userId: userProfileId,
          skillName: "Docker",
        },
      });

      mockRequest = { params: { id: skill.id } };

      await skillController.deleteSkill(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent skill", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await skillController.deleteSkill(
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
