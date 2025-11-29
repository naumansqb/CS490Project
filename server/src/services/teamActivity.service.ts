import { prisma } from "../db";
import { activity_type } from "@prisma/client";

export interface CreateActivityParams {
  teamId: string;
  userId: string;
  activityType: activity_type;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export const createTeamActivity = async (
  params: CreateActivityParams
): Promise<void> => {
  try {
    await prisma.teamActivity.create({
      data: {
        teamId: params.teamId,
        userId: params.userId,
        activityType: params.activityType,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata,
      },
    });
  } catch (error) {
    console.error("Failed to create team activity:", error);
  }
};

export const getActivityDescription = (
  activityType: activity_type,
  userName: string,
  metadata?: Record<string, any>
): string => {
  switch (activityType) {
    case "team_created":
      return `${userName} created the team`;
    case "member_joined":
      return `${userName} joined the team`;
    case "member_left":
      return `${userName} left the team`;
    case "job_shared":
      return `${userName} shared a job: ${metadata?.jobTitle || "Untitled"}`;
    case "comment_added":
      return `${userName} commented on a shared job`;
    case "task_assigned":
      return `${userName} assigned a task: ${metadata?.taskTitle || "Untitled"}`;
    case "task_completed":
      return `${userName} completed a task: ${metadata?.taskTitle || "Untitled"}`;
    case "feedback_given":
      return `${userName} provided ${metadata?.feedbackType || "feedback"}`;
    case "milestone_reached":
      return `${userName} reached a milestone: ${metadata?.milestone || "Achievement"}`;
    case "application_submitted":
      return `${userName} submitted an application to ${metadata?.company || "a company"}`;
    case "interview_scheduled":
      return `${userName} scheduled an interview with ${metadata?.company || "a company"}`;
    default:
      return `${userName} performed an action`;
  }
};
