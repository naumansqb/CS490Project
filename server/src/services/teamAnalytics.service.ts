import { prisma } from "../db";
import {
  TeamAnalytics,
  AnonymizedMemberStats,
  TeamDashboardStats,
  TeamMilestone,
  MenteeProgress,
} from "../types/team.types";
import crypto from "crypto";

export const calculateTeamDashboard = async (
  teamId: string
): Promise<TeamDashboardStats> => {
  const [members, jobs, memberStats] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId, isActive: true },
      include: { user: true },
    }),
    prisma.sharedJobOpportunity.findMany({
      where: { teamId },
      include: {
        job: {
          include: {
            applicationHistory: true,
            interviews: true,
          },
        },
      },
    }),
    prisma.teamMember.groupBy({
      by: ["role"],
      where: { teamId, isActive: true },
      _count: true,
    }),
  ]);

  const totalApplications = jobs.reduce(
    (sum, sj) =>
      sum +
      sj.job.applicationHistory.filter((ah) => ah.status === "applied").length,
    0
  );

  const totalInterviews = jobs.reduce(
    (sum, sj) => sum + sj.job.interviews.length,
    0
  );

  const totalOffers = jobs.reduce(
    (sum, sj) =>
      sum + sj.job.applicationHistory.filter((ah) => ah.status === "offer").length,
    0
  );

  const applicationSuccessRate =
    totalApplications > 0 ? (totalOffers / totalApplications) * 100 : 0;

  const recentActivities = await prisma.teamActivity.findMany({
    where: {
      teamId,
      activityType: "milestone_reached",
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentMilestones: TeamMilestone[] = recentActivities.map((activity) => ({
    id: activity.id,
    type: activity.activityType,
    description: (activity.metadata as any)?.milestone || "Milestone achieved",
    achievedBy: activity.userId,
    achievedByName: `${activity.user.firstName || ""} ${activity.user.lastName || ""}`.trim(),
    achievedAt: activity.createdAt,
  }));

  const memberBreakdown = {
    owners: memberStats.find((s) => s.role === "owner")?._count || 0,
    mentors: memberStats.find((s) => s.role === "mentor")?._count || 0,
    coaches: memberStats.find((s) => s.role === "coach")?._count || 0,
    members: memberStats.find((s) => s.role === "member")?._count || 0,
    viewers: memberStats.find((s) => s.role === "viewer")?._count || 0,
  };

  return {
    totalMembers: members.length,
    totalJobsTracked: jobs.length,
    totalApplications,
    totalInterviews,
    applicationSuccessRate: Math.round(applicationSuccessRate * 100) / 100,
    recentMilestones,
    memberBreakdown,
  };
};

export const calculateMenteeProgress = async (
  teamId: string,
  userId: string
): Promise<MenteeProgress> => {
  const [user, jobs, tasks, activities] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId },
    }),
    prisma.jobOpportunity.findMany({
      where: { userId },
      include: {
        applicationHistory: true,
        interviews: true,
      },
    }),
    prisma.teamTask.findMany({
      where: { teamId, assignedTo: userId },
    }),
    prisma.teamActivity.findMany({
      where: { teamId, userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const totalApplications = jobs.reduce(
    (sum, job) =>
      sum + job.applicationHistory.filter((ah) => ah.status === "applied").length,
    0
  );

  const interviewsScheduled = jobs.reduce(
    (sum, job) => sum + job.interviews.length,
    0
  );

  const offersReceived = jobs.reduce(
    (sum, job) =>
      sum + job.applicationHistory.filter((ah) => ah.status === "offer").length,
    0
  );

  const activeJobs = jobs.filter(
    (job) =>
      job.currentStatus !== "rejected" && job.currentStatus !== "offer"
  ).length;

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  ).length;

  const skillsGaps = await prisma.skills_gap_analysis.findMany({
    where: { user_id: userId },
  });

  const totalGaps = skillsGaps.reduce(
    (sum, gap) => sum + (gap.missing_skills as any[]).length,
    0
  );

  const gapsAddressed = skillsGaps.reduce(
    (sum, gap) => sum + (gap.matched_skills as any[]).length,
    0
  );

  const progressPercentage =
    totalGaps + gapsAddressed > 0
      ? (gapsAddressed / (totalGaps + gapsAddressed)) * 100
      : 0;

  return {
    userId,
    userName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Unknown User",
    stats: {
      totalApplications,
      interviewsScheduled,
      offersReceived,
      activeJobs,
      completedTasks,
      pendingTasks,
    },
    recentActivity: activities.map((a) => ({
      type: a.activityType,
      description: (a.metadata as any)?.description || a.activityType,
      timestamp: a.createdAt,
    })),
    skillsGapProgress: {
      totalGaps,
      gapsAddressed,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
    },
  };
};

export const calculateTeamAnalytics = async (
  teamId: string
): Promise<TeamAnalytics> => {
  const members = await prisma.teamMember.findMany({
    where: { teamId, isActive: true },
    include: {
      user: {
        include: {
          jobOpportunities: {
            include: {
              applicationHistory: true,
              interviews: true,
            },
          },
        },
      },
    },
  });

  const memberStats: AnonymizedMemberStats[] = await Promise.all(
    members.map(async (member) => {
      const jobs = member.user.jobOpportunities;
      const applications = jobs.reduce(
        (sum, job) =>
          sum + job.applicationHistory.filter((ah) => ah.status === "applied").length,
        0
      );
      const interviews = jobs.reduce(
        (sum, job) => sum + job.interviews.length,
        0
      );
      const offers = jobs.reduce(
        (sum, job) =>
          sum + job.applicationHistory.filter((ah) => ah.status === "offer").length,
        0
      );

      const tasks = await prisma.teamTask.findMany({
        where: { teamId, assignedTo: member.userId },
      });

      const completedTasks = tasks.filter((t) => t.status === "completed").length;

      const avgResponseTime = jobs.length > 0
        ? jobs.reduce((sum, job) => {
            const history = job.applicationHistory.sort(
              (a, b) => a.timestamp!.getTime() - b.timestamp!.getTime()
            );
            if (history.length > 1) {
              const diff =
                history[1].timestamp!.getTime() - history[0].timestamp!.getTime();
              return sum + diff / (1000 * 60 * 60 * 24);
            }
            return sum;
          }, 0) / jobs.length
        : 0;

      const collaborationScore = Math.min(
        100,
        (completedTasks * 10 + applications * 5 + interviews * 15 + offers * 25)
      );

      const anonymizedId = crypto
        .createHash("sha256")
        .update(member.userId + teamId)
        .digest("hex")
        .substring(0, 8);

      return {
        memberId: anonymizedId,
        role: member.role,
        applicationsSubmitted: applications,
        interviewsScheduled: interviews,
        offersReceived: offers,
        averageResponseTime: Math.round(avgResponseTime * 100) / 100,
        tasksCompleted: completedTasks,
        collaborationScore: Math.round(collaborationScore),
      };
    })
  );

  const avgApplications =
    memberStats.reduce((sum, m) => sum + m.applicationsSubmitted, 0) /
    (memberStats.length || 1);

  const avgInterviews =
    memberStats.reduce((sum, m) => sum + m.interviewsScheduled, 0) /
    (memberStats.length || 1);

  const avgResponseTime =
    memberStats.reduce((sum, m) => sum + m.averageResponseTime, 0) /
    (memberStats.length || 1);

  const avgCollaborationScore =
    memberStats.reduce((sum, m) => sum + m.collaborationScore, 0) /
    (memberStats.length || 1);

  const bestPerformers = memberStats
    .sort((a, b) => b.collaborationScore - a.collaborationScore)
    .slice(0, 3);

  return {
    teamStats: {
      averageApplicationsPerMember: Math.round(avgApplications * 100) / 100,
      averageInterviewsPerMember: Math.round(avgInterviews * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      collaborationScore: Math.round(avgCollaborationScore),
    },
    performanceComparison: memberStats,
    successPatterns: {
      bestPerformingStrategies: [
        "Regular application submissions",
        "Active task completion",
        "Timely interview follow-ups",
      ],
      commonSuccessFactors: [
        "Consistent engagement with team",
        "Leveraging mentor feedback",
        "Completing preparation tasks",
      ],
      recommendedActions: [
        "Submit at least 3 applications per week",
        "Complete all assigned tasks before due date",
        "Engage with shared job opportunities",
      ],
    },
  };
};
