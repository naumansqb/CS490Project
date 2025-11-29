import { Response } from "express";
import { prisma } from "../db";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendErrorResponse } from "../utils/errorResponse";
import {
  validateTeamTask,
  validateTaskUpdate,
} from "../validators/teamTask.validator";
import { createTeamActivity } from "../services/teamActivity.service";

export const createTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { teamId } = req.params;
    const validationErrors = validateTeamTask(req.body);

    if (validationErrors.length > 0) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid input data",
        validationErrors
      );
      return;
    }

    const { assignedTo, title, description, dueDate, priority, relatedJobId } =
      req.body;

    const assignee = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: assignedTo,
        isActive: true,
      },
    });

    if (!assignee) {
      sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "Assignee is not a member of this team"
      );
      return;
    }

    const task = await prisma.teamTask.create({
      data: {
        teamId,
        assignedTo,
        assignedBy: userId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "medium",
        relatedJobId,
      },
      include: {
        assignee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assigner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        relatedJob: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
    });

    await createTeamActivity({
      teamId,
      userId,
      activityType: "task_assigned",
      entityType: "team_task",
      entityId: task.id,
      metadata: {
        taskTitle: title,
        assignedTo,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to create task");
  }
};

export const getAllTasks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;
    const { status, assignedTo } = req.query;

    const where: any = { teamId };

    if (status) {
      where.status = status;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const tasks = await prisma.teamTask.findMany({
      where,
      include: {
        assignee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
        assigner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        relatedJob: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to fetch tasks");
  }
};

export const getTasksForUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId, userId: targetUserId } = req.params;

    const tasks = await prisma.teamTask.findMany({
      where: {
        teamId,
        assignedTo: targetUserId,
      },
      include: {
        assigner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        relatedJob: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch user tasks"
    );
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { taskId } = req.params;
    const validationErrors = validateTaskUpdate(req.body);

    if (validationErrors.length > 0) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid input data",
        validationErrors
      );
      return;
    }

    const task = await prisma.teamTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Task not found");
      return;
    }

    const isAssignee = task.assignedTo === userId;
    const isAssigner = task.assignedBy === userId;

    if (!isAssignee && !isAssigner) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "You can only update tasks assigned to you or created by you"
      );
      return;
    }

    const { title, description, status, priority, dueDate } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "completed") {
        updateData.completedAt = new Date();
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const updated = await prisma.teamTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        assigner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        relatedJob: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
    });

    if (status === "completed") {
      await createTeamActivity({
        teamId: task.teamId,
        userId,
        activityType: "task_completed",
        entityType: "team_task",
        entityId: taskId,
        metadata: {
          taskTitle: updated.title,
        },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating task:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to update task");
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { taskId } = req.params;

    const task = await prisma.teamTask.findUnique({
      where: { id: taskId },
      include: { team: true },
    });

    if (!task) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Task not found");
      return;
    }

    const isAssigner = task.assignedBy === userId;
    const isTeamOwner = task.team.ownerId === userId;

    if (!isAssigner && !isTeamOwner) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Only the task creator or team owner can delete tasks"
      );
      return;
    }

    await prisma.teamTask.delete({
      where: { id: taskId },
    });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete task");
  }
};
