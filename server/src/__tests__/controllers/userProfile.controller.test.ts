import { Request, Response } from "express";
import * as userProfileController from "../../controllers/userProfile.controller";
import { prisma } from "../../db";

describe("UserProfile Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

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
  });

  describe("createUserProfile", () => {
    it("should create a user profile successfully", async () => {
      const userData = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        firstName: "John",
        lastName: "Doe",
        headline: "Software Engineer",
      };

      mockRequest = { body: userData };

      await userProfileController.createUserProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userData.userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
        })
      );
    });

    it("should return 409 when user profile already exists", async () => {
      const userData = {
        userId: "123e4567-e89b-12d3-a456-426614174001",
        firstName: "Jane",
        lastName: "Smith",
      };

      await prisma.userProfile.create({ data: userData });
      mockRequest = { body: userData };

      await userProfileController.createUserProfile(
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

    it("should return 400 for validation errors", async () => {
      const userData = {
        firstName: "Test",
      };

      mockRequest = { body: userData };

      await userProfileController.createUserProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "userId",
              message: expect.any(String),
            }),
          ]),
        })
      );
    });
  });

  describe("getUserProfile", () => {
    it("should get a user profile by id", async () => {
      const userData = {
        userId: "123e4567-e89b-12d3-a456-426614174002",
        firstName: "Alice",
        lastName: "Johnson",
      };

      const created = await prisma.userProfile.create({ data: userData });
      mockRequest = { params: { id: created.id } };

      await userProfileController.getUserProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: created.id,
          firstName: userData.firstName,
        })
      );
    });

    it("should return 404 when user profile not found", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await userProfileController.getUserProfile(
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

  describe("getUserProfileByUserId", () => {
    it("should get a user profile by userId", async () => {
      const userData = {
        userId: "123e4567-e89b-12d3-a456-426614174003",
        firstName: "Bob",
        lastName: "Wilson",
      };

      await prisma.userProfile.create({ data: userData });
      mockRequest = { params: { userId: userData.userId } };

      await userProfileController.getUserProfileByUserId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userData.userId,
          firstName: userData.firstName,
        })
      );
    });
  });

  describe("updateUserProfile", () => {
    it("should update a user profile", async () => {
      const userData = {
        userId: "123e4567-e89b-12d3-a456-426614174004",
        firstName: "Charlie",
        lastName: "Brown",
      };

      const created = await prisma.userProfile.create({ data: userData });
      const updateData = { firstName: "Charles" };
      mockRequest = { params: { id: created.id }, body: updateData };

      await userProfileController.updateUserProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: created.id,
          firstName: "Charles",
        })
      );
    });

    it("should return 404 when updating non-existent profile", async () => {
      mockRequest = {
        params: { id: "123e4567-e89b-12d3-a456-426614174999" },
        body: { firstName: "Test" },
      };

      await userProfileController.updateUserProfile(
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

    it("should return 400 for invalid update data", async () => {
      const userData = {
        userId: "123e4567-e89b-12d3-a456-426614174005",
        firstName: "Test",
      };

      const created = await prisma.userProfile.create({ data: userData });
      mockRequest = {
        params: { id: created.id },
        body: { yearsOfExperience: "invalid" },
      };

      await userProfileController.updateUserProfile(
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

  describe("deleteUserProfile", () => {
    it("should delete a user profile", async () => {
      const userData = {
        userId: "123e4567-e89b-12d3-a456-426614174006",
        firstName: "David",
        lastName: "Miller",
      };

      const created = await prisma.userProfile.create({ data: userData });
      mockRequest = { params: { id: created.id } };

      await userProfileController.deleteUserProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 404 when deleting non-existent profile", async () => {
      mockRequest = { params: { id: "123e4567-e89b-12d3-a456-426614174999" } };

      await userProfileController.deleteUserProfile(
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

  describe("listUserProfiles", () => {
    it("should list user profiles with pagination", async () => {
      await prisma.userProfile.createMany({
        data: [
          {
            userId: "123e4567-e89b-12d3-a456-426614174010",
            firstName: "User1",
          },
          {
            userId: "123e4567-e89b-12d3-a456-426614174011",
            firstName: "User2",
          },
        ],
      });

      mockRequest = { query: { limit: "10", offset: "0" } };

      await userProfileController.listUserProfiles(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ firstName: "User1" }),
          expect.objectContaining({ firstName: "User2" }),
        ])
      );
    });
  });
});
