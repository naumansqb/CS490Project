# Team Collaboration API Documentation

This document describes the server-side implementation of multi-user collaboration features for the job search application. These endpoints enable team accounts, role management, shared resources, mentor/coach collaboration, and team analytics.

## Table of Contents
- [Overview](#overview)
- [Database Schema](#database-schema)
- [Authentication & Permissions](#authentication--permissions)
- [API Endpoints](#api-endpoints)
  - [4.1 Team Account and Role Management](#41-team-account-and-role-management)
  - [4.2 Shared Resources and Coach Collaboration](#42-shared-resources-and-coach-collaboration)
  - [4.3 Team Analytics and Activity Feed](#43-team-analytics-and-activity-feed)
- [Integration Guide](#integration-guide)
- [Demo Scenarios](#demo-scenarios)

---

## Overview

The team collaboration features support three main use cases:
1. **University Career Centers** - Advisors managing student job searches
2. **Job Search Groups** - Peers collaborating on opportunities
3. **Mentorship Programs** - Mentors guiding mentees through the job search process

### Key Features
- ✅ Team creation and management
- ✅ Role-based permissions (Owner, Mentor, Coach, Member, Viewer)
- ✅ Email-based team invitations
- ✅ Job sharing with collaborative comments
- ✅ Mentor/coach dashboards showing mentee progress
- ✅ Task assignment and tracking
- ✅ Feedback system for application materials
- ✅ Real-time activity feeds
- ✅ Team performance analytics with anonymized benchmarking

---

## Database Schema

### New Tables

#### 1. **teams**
Core team/organization entity.
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Team name
- `description` (TEXT) - Team description
- `type` (ENUM) - career_center, job_search_group, mentorship_program
- `owner_id` (VARCHAR) - Foreign key to user_profiles
- `max_members` (INT) - Optional member limit
- `is_active` (BOOLEAN) - Team status
- Timestamps: `created_at`, `updated_at`

#### 2. **team_members**
Team membership with roles.
- `id` (UUID) - Primary key
- `team_id` (UUID) - Foreign key to teams
- `user_id` (VARCHAR) - Foreign key to user_profiles
- `role` (ENUM) - owner, mentor, coach, member, viewer
- `permissions` (JSON) - Optional custom permissions
- `joined_at` (TIMESTAMP) - When user joined
- `is_active` (BOOLEAN) - Membership status
- Unique constraint on (team_id, user_id)

#### 3. **team_invitations**
Invitation management system.
- `id` (UUID) - Primary key
- `team_id` (UUID) - Foreign key to teams
- `email` (VARCHAR) - Invitee email
- `role` (ENUM) - Role to assign
- `invited_by` (VARCHAR) - Foreign key to user_profiles
- `token` (VARCHAR) - Unique invitation token
- `status` (ENUM) - pending, accepted, declined, expired
- `expires_at` (TIMESTAMP) - Expiration date (7 days default)
- `accepted_at` (TIMESTAMP) - When invitation was accepted

#### 4. **shared_job_opportunities**
Shared job postings within teams.
- `id` (UUID) - Primary key
- `team_id` (UUID) - Foreign key to teams
- `job_id` (UUID) - Foreign key to job_opportunity
- `shared_by` (VARCHAR) - Foreign key to user_profiles
- `visibility` (VARCHAR) - all_members, mentors_only, specific_members
- `shared_at` (TIMESTAMP) - When job was shared
- Unique constraint on (team_id, job_id)

#### 5. **job_comments**
Collaborative comments on shared jobs.
- `id` (UUID) - Primary key
- `share_id` (UUID) - Foreign key to shared_job_opportunities
- `user_id` (VARCHAR) - Foreign key to user_profiles
- `content` (TEXT) - Comment content
- `mentions` (VARCHAR[]) - Array of mentioned user IDs
- Timestamps: `created_at`, `updated_at`

#### 6. **team_tasks**
Tasks assigned to team members.
- `id` (UUID) - Primary key
- `team_id` (UUID) - Foreign key to teams
- `assigned_to` (VARCHAR) - Foreign key to user_profiles
- `assigned_by` (VARCHAR) - Foreign key to user_profiles
- `title` (VARCHAR) - Task title
- `description` (TEXT) - Task description
- `due_date` (TIMESTAMP) - Optional due date
- `priority` (ENUM) - low, medium, high, urgent
- `status` (ENUM) - pending, in_progress, completed, cancelled
- `related_job_id` (UUID) - Optional link to job opportunity
- `completed_at` (TIMESTAMP) - Completion timestamp

#### 7. **team_activities**
Activity feed tracking.
- `id` (UUID) - Primary key
- `team_id` (UUID) - Foreign key to teams
- `user_id` (VARCHAR) - Foreign key to user_profiles
- `activity_type` (ENUM) - team_created, member_joined, job_shared, etc.
- `entity_type` (VARCHAR) - Type of entity (job, task, etc.)
- `entity_id` (VARCHAR) - ID of related entity
- `metadata` (JSON) - Additional activity data
- `created_at` (TIMESTAMP)

#### 8. **team_feedback**
Mentor/coach feedback.
- `id` (UUID) - Primary key
- `team_id` (UUID) - Foreign key to teams
- `mentee_id` (VARCHAR) - Foreign key to user_profiles
- `mentor_id` (VARCHAR) - Foreign key to user_profiles
- `feedback_type` (ENUM) - resume_review, cover_letter_review, interview_prep, etc.
- `content` (TEXT) - Feedback content
- `related_entity_type` (VARCHAR) - Optional entity type
- `related_entity_id` (VARCHAR) - Optional entity ID
- Timestamps: `created_at`, `updated_at`

---

## Authentication & Permissions

### Role Hierarchy

| Role | Permissions |
|------|------------|
| **Owner** | Full control - manage team, members, all content |
| **Mentor** | Manage members, assign tasks, provide feedback, view analytics |
| **Coach** | Assign tasks, provide feedback, view analytics (cannot manage members) |
| **Member** | Share jobs, comment, view team content |
| **Viewer** | Read-only access to team content |

### Permission Matrix

| Action | Owner | Mentor | Coach | Member | Viewer |
|--------|-------|--------|-------|--------|--------|
| Delete team | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage members | ✓ | ✓ | ✗ | ✗ | ✗ |
| Assign tasks | ✓ | ✓ | ✓ | ✗ | ✗ |
| Provide feedback | ✓ | ✓ | ✓ | ✗ | ✗ |
| Share jobs | ✓ | ✓ | ✓ | ✓ | ✗ |
| Comment on jobs | ✓ | ✓ | ✓ | ✓ | ✗ |
| View analytics | ✓ | ✓ | ✓ | ✓ | ✓ |

### Middleware

All team endpoints require authentication via `authMiddleware`. Team-specific endpoints also use:
- `checkTeamMembership` - Verifies user is an active team member
- `checkTeamPermission(permission)` - Checks role-based permissions
- `checkTeamOwnership` - Restricts to team owner only
- `checkMentorOrCoachRole` - Requires mentor or coach role

---

## API Endpoints

All endpoints require authentication. Base URL: `/api`

### 4.1 Team Account and Role Management

#### Create Team
```
POST /teams
```
**Request Body:**
```json
{
  "name": "Career Center Team",
  "description": "NJIT Career Services",
  "type": "career_center",
  "maxMembers": 50
}
```
**Response:** Team object with owner details

#### Get My Teams
```
GET /teams/my-teams
```
**Response:** Array of teams user belongs to, with role information

#### Get Team Details
```
GET /teams/:teamId
```
**Response:** Full team details including owner, members, and statistics

#### Update Team
```
PUT /teams/:teamId
```
**Permission:** Owner or Mentor
**Request Body:**
```json
{
  "name": "Updated Team Name",
  "description": "New description",
  "isActive": true
}
```

#### Delete Team
```
DELETE /teams/:teamId
```
**Permission:** Owner only

#### Get Team Members
```
GET /teams/:teamId/members
```
**Response:** Array of team members with user details and roles

#### Update Member Role
```
PUT /teams/:teamId/members/:memberId/role
```
**Permission:** Owner or Mentor
**Request Body:**
```json
{
  "role": "mentor"
}
```

#### Remove Member
```
DELETE /teams/:teamId/members/:memberId
```
**Permission:** Owner/Mentor (or member can remove self)

#### Get Team Dashboard
```
GET /teams/:teamId/dashboard
```
**Response:**
```json
{
  "totalMembers": 15,
  "totalJobsTracked": 45,
  "totalApplications": 120,
  "totalInterviews": 30,
  "applicationSuccessRate": 25.5,
  "recentMilestones": [...],
  "memberBreakdown": {
    "owners": 1,
    "mentors": 3,
    "coaches": 2,
    "members": 9,
    "viewers": 0
  }
}
```

---

### Team Invitations

#### Send Invitation
```
POST /teams/:teamId/invitations
```
**Permission:** Owner or Mentor
**Request Body:**
```json
{
  "email": "mentee@example.com",
  "role": "member"
}
```
**Side Effect:** Sends email with invitation link

#### Get Team Invitations
```
GET /teams/:teamId/invitations
```
**Permission:** Owner or Mentor
**Response:** All invitations for the team

#### Get My Invitations
```
GET /team-invitations/my-invitations
```
**Response:** Pending invitations for authenticated user

#### Accept Invitation
```
POST /team-invitations/:inviteId/accept
```
**Effect:** Adds user to team with assigned role

#### Decline Invitation
```
POST /team-invitations/:inviteId/decline
```

#### Cancel Invitation
```
DELETE /teams/:teamId/invitations/:inviteId
```
**Permission:** Owner or Mentor

---

### 4.2 Shared Resources and Coach Collaboration

#### Share Job with Team
```
POST /teams/:teamId/shared-jobs
```
**Request Body:**
```json
{
  "jobId": "job-uuid",
  "visibility": "all_members"
}
```
**Response:** Shared job object with job details

#### Get Shared Jobs
```
GET /teams/:teamId/shared-jobs
```
**Response:** Array of shared jobs with comments and sharer info

#### Get Shared Job Details
```
GET /teams/:teamId/shared-jobs/:shareId
```
**Response:** Full job details, application history, and comments

#### Unshare Job
```
DELETE /teams/:teamId/shared-jobs/:shareId
```
**Permission:** Job sharer or team owner

#### Add Comment to Shared Job
```
POST /teams/:teamId/shared-jobs/:shareId/comments
```
**Request Body:**
```json
{
  "content": "This looks like a great opportunity!",
  "mentions": ["user-id-1", "user-id-2"]
}
```

#### Get Comments
```
GET /teams/:teamId/shared-jobs/:shareId/comments
```

#### Update Comment
```
PUT /teams/:teamId/shared-jobs/:shareId/comments/:commentId
```
**Permission:** Comment author only

#### Delete Comment
```
DELETE /teams/:teamId/shared-jobs/:shareId/comments/:commentId
```
**Permission:** Comment author or team owner

---

### Mentor/Coach Features

#### Get Mentees
```
GET /teams/:teamId/mentees
```
**Permission:** Owner, Mentor, or Coach
**Response:** List of team members with role "member"

#### Get Mentee Progress
```
GET /teams/:teamId/mentees/:userId/progress
```
**Permission:** Mentor/Coach (or self)
**Response:**
```json
{
  "userId": "user-id",
  "userName": "John Doe",
  "stats": {
    "totalApplications": 25,
    "interviewsScheduled": 6,
    "offersReceived": 2,
    "activeJobs": 10,
    "completedTasks": 8,
    "pendingTasks": 3
  },
  "recentActivity": [...],
  "skillsGapProgress": {
    "totalGaps": 15,
    "gapsAddressed": 8,
    "progressPercentage": 53.33
  }
}
```

#### Provide Feedback
```
POST /teams/:teamId/feedback
```
**Permission:** Owner, Mentor, or Coach
**Request Body:**
```json
{
  "menteeId": "user-id",
  "feedbackType": "resume_review",
  "content": "Great improvements on your resume...",
  "relatedEntityType": "resume",
  "relatedEntityId": "resume-id"
}
```

#### Get Feedback for Mentee
```
GET /teams/:teamId/feedback/mentee/:userId
```
**Permission:** Mentee themselves or Mentor/Coach

#### Get All Team Feedback
```
GET /teams/:teamId/feedback
```
**Query Parameters:**
- `feedbackType` - Filter by type
- `menteeId` - Filter by mentee

---

### Task Management

#### Assign Task
```
POST /teams/:teamId/tasks
```
**Permission:** Owner, Mentor, or Coach
**Request Body:**
```json
{
  "assignedTo": "user-id",
  "title": "Complete resume tailoring for Amazon position",
  "description": "Use the AI tool to tailor your resume",
  "dueDate": "2025-12-15T23:59:59Z",
  "priority": "high",
  "relatedJobId": "job-uuid"
}
```

#### Get All Tasks
```
GET /teams/:teamId/tasks
```
**Query Parameters:**
- `status` - Filter by status
- `assignedTo` - Filter by assignee

#### Get Tasks for User
```
GET /teams/:teamId/tasks/assigned-to/:userId
```

#### Update Task
```
PUT /teams/:teamId/tasks/:taskId
```
**Permission:** Task assignee or assigner
**Request Body:**
```json
{
  "status": "completed",
  "priority": "medium"
}
```

#### Delete Task
```
DELETE /teams/:teamId/tasks/:taskId
```
**Permission:** Task creator or team owner

---

### 4.3 Team Analytics and Activity Feed

#### Get Activity Feed
```
GET /teams/:teamId/activity-feed
```
**Query Parameters:**
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
[
  {
    "id": "activity-id",
    "userId": "user-id",
    "userName": "Jane Doe",
    "userRole": "mentor",
    "activityType": "job_shared",
    "description": "Jane Doe shared a job: Senior Developer at Google",
    "createdAt": "2025-11-29T10:30:00Z",
    "metadata": {...}
  }
]
```

**Activity Types:**
- `team_created` - Team was created
- `member_joined` - New member joined
- `member_left` - Member left/removed
- `job_shared` - Job shared with team
- `comment_added` - Comment on shared job
- `task_assigned` - Task assigned
- `task_completed` - Task completed
- `feedback_given` - Feedback provided
- `milestone_reached` - Achievement milestone
- `application_submitted` - Application submitted
- `interview_scheduled` - Interview scheduled

#### Get Team Milestones
```
GET /teams/:teamId/milestones
```
**Response:** Recent milestone achievements

#### Get Team Analytics
```
GET /teams/:teamId/analytics
```
**Permission:** Requires `canViewAnalytics` permission
**Response:**
```json
{
  "teamStats": {
    "averageApplicationsPerMember": 8.5,
    "averageInterviewsPerMember": 2.1,
    "averageResponseTime": 3.5,
    "collaborationScore": 75
  },
  "performanceComparison": [
    {
      "memberId": "anonymized-id",
      "role": "member",
      "applicationsSubmitted": 12,
      "interviewsScheduled": 3,
      "offersReceived": 1,
      "averageResponseTime": 2.5,
      "tasksCompleted": 8,
      "collaborationScore": 82
    }
  ],
  "successPatterns": {
    "bestPerformingStrategies": [...],
    "commonSuccessFactors": [...],
    "recommendedActions": [...]
  }
}
```

**Note:** Member IDs in analytics are anonymized using SHA-256 hashing for privacy.

---

## Integration Guide

### Initial Setup

1. **Run Database Migration**
   - Execute the SQL migration script (see `TEAM_COLLABORATION_MIGRATION.sql`)
   - Verify all tables and foreign keys are created

2. **Environment Variables**
   - Ensure `FRONTEND_URL` is set for invitation links
   - Email service (Nodemailer) should be configured

3. **Test with Existing Auth**
   - Team endpoints use existing `authMiddleware`
   - User sessions remain unchanged

### For UI Team

#### Creating a Team (Demo 4.1)
```typescript
// POST /api/teams
const response = await fetch('/api/teams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // For session cookies
  body: JSON.stringify({
    name: 'NJIT Career Center',
    description: 'Supporting NJIT students in their job search',
    type: 'career_center'
  })
});
const team = await response.json();
```

#### Inviting Team Members (Demo 4.1)
```typescript
// POST /api/teams/:teamId/invitations
await fetch(`/api/teams/${teamId}/invitations`, {
  method: 'POST',
  credentials: 'include',
  body: JSON.stringify({
    email: 'student@njit.edu',
    role: 'member'
  })
});
// Email will be sent automatically
```

#### Sharing a Job (Demo 4.2)
```typescript
// POST /api/teams/:teamId/shared-jobs
await fetch(`/api/teams/${teamId}/shared-jobs`, {
  method: 'POST',
  credentials: 'include',
  body: JSON.stringify({
    jobId: jobOpportunityId,
    visibility: 'all_members'
  })
});
```

#### Adding Comments (Demo 4.2)
```typescript
// POST /api/teams/:teamId/shared-jobs/:shareId/comments
await fetch(`/api/teams/${teamId}/shared-jobs/${shareId}/comments`, {
  method: 'POST',
  credentials: 'include',
  body: JSON.stringify({
    content: 'Great opportunity! I can refer you.',
    mentions: [menteeUserId]
  })
});
```

#### Viewing Mentee Progress (Demo 4.2)
```typescript
// GET /api/teams/:teamId/mentees/:userId/progress
const progress = await fetch(
  `/api/teams/${teamId}/mentees/${menteeId}/progress`,
  { credentials: 'include' }
).then(r => r.json());

// Display stats: applications, interviews, tasks, skills progress
```

#### Activity Feed (Demo 4.3)
```typescript
// GET /api/teams/:teamId/activity-feed
const activities = await fetch(
  `/api/teams/${teamId}/activity-feed?limit=50`,
  { credentials: 'include' }
).then(r => r.json());

// Real-time updates can be achieved with polling or WebSockets
```

#### Team Analytics (Demo 4.3)
```typescript
// GET /api/teams/:teamId/analytics
const analytics = await fetch(
  `/api/teams/${teamId}/analytics`,
  { credentials: 'include' }
).then(r => r.json());

// Display performance comparison chart
// Show success patterns and recommendations
```

---

## Demo Scenarios

### Demo 4.1: Team Account and Role Management

**Step 1: Create Team**
- Call `POST /api/teams`
- Show team dashboard with stats

**Step 2: Invite Team Member**
- Call `POST /api/teams/:teamId/invitations` with mentor email
- Mentor receives email with invitation link

**Step 3: Accept Invitation**
- Mentor clicks link → redirects to frontend
- Frontend calls `POST /api/team-invitations/:inviteId/accept`

**Step 4: Verify Role Assignment**
- Call `GET /api/teams/:teamId/members`
- Show member list with roles

**Step 5: View Team Dashboard**
- Call `GET /api/teams/:teamId/dashboard`
- Display aggregate statistics

---

### Demo 4.2: Shared Resources and Coach Collaboration

**Step 1: Share Job Posting**
- Member creates job opportunity (existing flow)
- Call `POST /api/teams/:teamId/shared-jobs` with job ID
- Job appears in team's shared jobs feed

**Step 2: Add Comments**
- Mentor views shared job
- Call `POST /api/teams/:teamId/shared-jobs/:shareId/comments`
- Comments appear with user info and timestamps

**Step 3: Switch to Mentor View**
- Call `GET /api/teams/:teamId/mentees`
- Select a mentee

**Step 4: View Mentee Progress**
- Call `GET /api/teams/:teamId/mentees/:userId/progress`
- Display dashboard with stats, recent activity, skills progress

**Step 5: Provide Feedback**
- Call `POST /api/teams/:teamId/feedback`
- Feedback appears in mentee's feedback list

**Step 6: Assign Task**
- Call `POST /api/teams/:teamId/tasks`
- Task appears in mentee's task list

---

### Demo 4.3: Team Analytics and Activity Feed

**Step 1: View Activity Feed**
- Call `GET /api/teams/:teamId/activity-feed`
- Display chronological feed with user names and actions

**Step 2: Real-time Updates**
- Perform action (share job, complete task)
- Activity automatically appears in feed

**Step 3: View Milestones**
- Call `GET /api/teams/:teamId/milestones`
- Display milestone celebrations

**Step 4: Team Performance Dashboard**
- Call `GET /api/teams/:teamId/analytics`
- Display anonymized member comparison chart
- Show success patterns and recommended actions

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": [
    { "field": "fieldName", "message": "Field-specific error" }
  ]
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` (400) - Invalid input
- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource doesn't exist
- `INTERNAL_ERROR` (500) - Server error

---

## Notes for Production

1. **Email Service**: Ensure SMTP credentials are configured in environment variables
2. **Rate Limiting**: Consider rate limiting for invitation endpoints
3. **Real-time Updates**: Current implementation supports polling; consider WebSockets for real-time
4. **File Uploads**: Feedback attachments not yet implemented
5. **Notifications**: Push notifications not included; activity feed provides notification data
6. **Privacy**: Analytics use SHA-256 hashing for anonymization

---

## Support

For questions or issues, contact the backend team or refer to:
- Prisma schema: `server/prisma/schema.prisma`
- Controllers: `server/src/controllers/team*.controller.ts`
- Routes: `server/src/routes/team*.routes.ts`
