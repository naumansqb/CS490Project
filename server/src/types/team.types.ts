// Team-related TypeScript interfaces and types

export interface TeamDashboardStats {
  totalMembers: number;
  totalJobsTracked: number;
  totalApplications: number;
  totalInterviews: number;
  applicationSuccessRate: number;
  recentMilestones: TeamMilestone[];
  memberBreakdown: {
    owners: number;
    mentors: number;
    coaches: number;
    members: number;
    viewers: number;
  };
}

export interface TeamMilestone {
  id: string;
  type: string;
  description: string;
  achievedBy: string;
  achievedByName: string;
  achievedAt: Date;
}

export interface MenteeProgress {
  userId: string;
  userName: string;
  stats: {
    totalApplications: number;
    interviewsScheduled: number;
    offersReceived: number;
    activeJobs: number;
    completedTasks: number;
    pendingTasks: number;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  skillsGapProgress: {
    totalGaps: number;
    gapsAddressed: number;
    progressPercentage: number;
  };
}

export interface TeamAnalytics {
  teamStats: {
    averageApplicationsPerMember: number;
    averageInterviewsPerMember: number;
    averageResponseTime: number;
    collaborationScore: number;
  };
  performanceComparison: AnonymizedMemberStats[];
  successPatterns: {
    bestPerformingStrategies: string[];
    commonSuccessFactors: string[];
    recommendedActions: string[];
  };
}

export interface AnonymizedMemberStats {
  memberId: string; // Anonymized ID
  role: string;
  applicationsSubmitted: number;
  interviewsScheduled: number;
  offersReceived: number;
  averageResponseTime: number;
  tasksCompleted: number;
  collaborationScore: number;
}

export interface ActivityFeedItem {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userRole: string;
  activityType: string;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface TeamPermissions {
  canManageMembers: boolean;
  canAssignTasks: boolean;
  canProvideFeedback: boolean;
  canShareJobs: boolean;
  canViewAnalytics: boolean;
  canDeleteTeam: boolean;
}

export const RolePermissions: Record<string, TeamPermissions> = {
  owner: {
    canManageMembers: true,
    canAssignTasks: true,
    canProvideFeedback: true,
    canShareJobs: true,
    canViewAnalytics: true,
    canDeleteTeam: true,
  },
  mentor: {
    canManageMembers: true,
    canAssignTasks: true,
    canProvideFeedback: true,
    canShareJobs: true,
    canViewAnalytics: true,
    canDeleteTeam: false,
  },
  coach: {
    canManageMembers: false,
    canAssignTasks: true,
    canProvideFeedback: true,
    canShareJobs: true,
    canViewAnalytics: true,
    canDeleteTeam: false,
  },
  member: {
    canManageMembers: false,
    canAssignTasks: false,
    canProvideFeedback: false,
    canShareJobs: true,
    canViewAnalytics: true,
    canDeleteTeam: false,
  },
  viewer: {
    canManageMembers: false,
    canAssignTasks: false,
    canProvideFeedback: false,
    canShareJobs: false,
    canViewAnalytics: true,
    canDeleteTeam: false,
  },
};
