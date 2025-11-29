-- Team Collaboration Features Migration
-- This SQL script creates all necessary tables and enums for team collaboration features
-- Execute this script manually on your PostgreSQL database

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE team_role AS ENUM ('owner', 'mentor', 'coach', 'member', 'viewer');
CREATE TYPE team_type AS ENUM ('career_center', 'job_search_group', 'mentorship_program');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE activity_type AS ENUM (
  'team_created',
  'member_joined',
  'member_left',
  'job_shared',
  'comment_added',
  'task_assigned',
  'task_completed',
  'feedback_given',
  'milestone_reached',
  'application_submitted',
  'interview_scheduled'
);
CREATE TYPE feedback_type AS ENUM (
  'resume_review',
  'cover_letter_review',
  'interview_prep',
  'general_guidance',
  'application_review'
);

-- ============================================
-- TABLES
-- ============================================

-- 1. Teams Table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type team_type NOT NULL DEFAULT 'job_search_group',
  owner_id VARCHAR NOT NULL,
  max_members INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_teams_owner FOREIGN KEY (owner_id)
    REFERENCES user_profiles(user_id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

-- Indexes for teams
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_teams_is_active ON teams(is_active);
CREATE INDEX idx_teams_type ON teams(type);

-- 2. Team Members Table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL,
  user_id VARCHAR NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  permissions JSONB,
  joined_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id)
    REFERENCES teams(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_team_members_user FOREIGN KEY (user_id)
    REFERENCES user_profiles(user_id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT unique_team_user UNIQUE (team_id, user_id)
);

-- Indexes for team_members
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);

-- 3. Team Invitations Table
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  invited_by VARCHAR NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP(6) NOT NULL,
  accepted_at TIMESTAMP(6),
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_team_invitations_team FOREIGN KEY (team_id)
    REFERENCES teams(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_team_invitations_inviter FOREIGN KEY (invited_by)
    REFERENCES user_profiles(user_id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

-- Indexes for team_invitations
CREATE INDEX idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);

-- 4. Shared Job Opportunities Table
CREATE TABLE shared_job_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL,
  job_id UUID NOT NULL,
  shared_by VARCHAR NOT NULL,
  visibility VARCHAR(50) NOT NULL DEFAULT 'all_members',
  shared_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_shared_jobs_team FOREIGN KEY (team_id)
    REFERENCES teams(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_shared_jobs_job FOREIGN KEY (job_id)
    REFERENCES job_opportunity(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_shared_jobs_sharer FOREIGN KEY (shared_by)
    REFERENCES user_profiles(user_id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT unique_team_job UNIQUE (team_id, job_id)
);

-- Indexes for shared_job_opportunities
CREATE INDEX idx_shared_jobs_team_id ON shared_job_opportunities(team_id);
CREATE INDEX idx_shared_jobs_job_id ON shared_job_opportunities(job_id);
CREATE INDEX idx_shared_jobs_shared_by ON shared_job_opportunities(shared_by);

-- 5. Job Comments Table
CREATE TABLE job_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_id UUID NOT NULL,
  user_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  mentions VARCHAR(255)[],
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_job_comments_share FOREIGN KEY (share_id)
    REFERENCES shared_job_opportunities(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_job_comments_user FOREIGN KEY (user_id)
    REFERENCES user_profiles(user_id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

-- Indexes for job_comments
CREATE INDEX idx_job_comments_share_id ON job_comments(share_id);
CREATE INDEX idx_job_comments_user_id ON job_comments(user_id);

-- 6. Team Tasks Table
CREATE TABLE team_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL,
  assigned_to VARCHAR NOT NULL,
  assigned_by VARCHAR NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  due_date TIMESTAMP(6),
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'pending',
  related_job_id UUID,
  completed_at TIMESTAMP(6),
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_team_tasks_team FOREIGN KEY (team_id)
    REFERENCES teams(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_team_tasks_assignee FOREIGN KEY (assigned_to)
    REFERENCES user_profiles(user_id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_team_tasks_assigner FOREIGN KEY (assigned_by)
    REFERENCES user_profiles(user_id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_team_tasks_job FOREIGN KEY (related_job_id)
    REFERENCES job_opportunity(id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION
);

-- Indexes for team_tasks
CREATE INDEX idx_team_tasks_team_id ON team_tasks(team_id);
CREATE INDEX idx_team_tasks_assigned_to ON team_tasks(assigned_to);
CREATE INDEX idx_team_tasks_assigned_by ON team_tasks(assigned_by);
CREATE INDEX idx_team_tasks_status ON team_tasks(status);
CREATE INDEX idx_team_tasks_due_date ON team_tasks(due_date);

-- 7. Team Activities Table
CREATE TABLE team_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL,
  user_id VARCHAR NOT NULL,
  activity_type activity_type NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_team_activities_team FOREIGN KEY (team_id)
    REFERENCES teams(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_team_activities_user FOREIGN KEY (user_id)
    REFERENCES user_profiles(user_id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

-- Indexes for team_activities
CREATE INDEX idx_team_activities_team_id ON team_activities(team_id);
CREATE INDEX idx_team_activities_user_id ON team_activities(user_id);
CREATE INDEX idx_team_activities_type ON team_activities(activity_type);
CREATE INDEX idx_team_activities_created_at ON team_activities(created_at);

-- 8. Team Feedback Table
CREATE TABLE team_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL,
  mentee_id VARCHAR NOT NULL,
  mentor_id VARCHAR NOT NULL,
  feedback_type feedback_type NOT NULL,
  content TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR,
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_team_feedback_team FOREIGN KEY (team_id)
    REFERENCES teams(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_team_feedback_mentee FOREIGN KEY (mentee_id)
    REFERENCES user_profiles(user_id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_team_feedback_mentor FOREIGN KEY (mentor_id)
    REFERENCES user_profiles(user_id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

-- Indexes for team_feedback
CREATE INDEX idx_team_feedback_team_id ON team_feedback(team_id);
CREATE INDEX idx_team_feedback_mentee_id ON team_feedback(mentee_id);
CREATE INDEX idx_team_feedback_mentor_id ON team_feedback(mentor_id);
CREATE INDEX idx_team_feedback_type ON team_feedback(feedback_type);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Team Collaboration Migration Complete!';
  RAISE NOTICE 'Created 7 enums and 8 tables with all indexes and foreign keys';
  RAISE NOTICE 'You can now run: npx prisma generate';
END $$;
