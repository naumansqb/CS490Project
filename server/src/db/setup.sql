-- ============================================
-- CS490 Database Setup for Supabase
-- Run this script in Supabase SQL Editor
-- ============================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Step 2: Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS special_projects CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS education CASCADE;
DROP TABLE IF EXISTS work_experiences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Step 3: Create user_profiles table
CREATE TABLE user_profiles (
    user_id                 TEXT PRIMARY KEY,
    first_name              VARCHAR(100),
    last_name               VARCHAR(100),
    preferred_name          VARCHAR(100),
    email                   VARCHAR(255),
    phone_number            VARCHAR(20),
    headline                VARCHAR(255),
    bio                     TEXT,
    profile_photo_url       VARCHAR(500),
    industry                VARCHAR(100),
    location_city           VARCHAR(100),
    location_state          VARCHAR(100),
    location_country        VARCHAR(100),
    willing_to_relocate     BOOLEAN DEFAULT FALSE,
    linkedin_url            VARCHAR(255),
    github_url              VARCHAR(255),
    portfolio_url           VARCHAR(255),
    website_url             VARCHAR(255),
    years_of_experience     DECIMAL(4,1),
    career_level            VARCHAR(50),
    desired_salary_min      DECIMAL(12,2),
    desired_salary_max      DECIMAL(12,2),
    salary_currency         VARCHAR(10) DEFAULT 'USD',
    open_to_opportunities   BOOLEAN DEFAULT TRUE,
    job_search_status       VARCHAR(50),
    preferred_work_type     VARCHAR(50),
    profile_completeness    INTEGER DEFAULT 0,
    profile_visibility      VARCHAR(50) DEFAULT 'private',
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Step 4: Create work_experiences table
CREATE TABLE work_experiences (
    id                      TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    company_name            VARCHAR(255) NOT NULL,
    position_title          VARCHAR(255) NOT NULL,
    employment_type         VARCHAR(50),
    location_city           VARCHAR(100),
    location_state          VARCHAR(100),
    location_country        VARCHAR(100),
    is_remote               BOOLEAN DEFAULT FALSE,
    start_date              DATE NOT NULL,
    end_date                DATE,
    is_current              BOOLEAN DEFAULT FALSE,
    description             TEXT,
    display_order           INTEGER DEFAULT 0,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_exp_user_id ON work_experiences(user_id);
CREATE INDEX idx_work_exp_dates ON work_experiences(start_date, end_date);
CREATE INDEX idx_work_exp_display_order ON work_experiences(user_id, display_order);

-- Step 5: Create education table
CREATE TABLE education (
    id                      TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    institution_name        VARCHAR(255) NOT NULL,
    degree_type             VARCHAR(100),
    major                   VARCHAR(255),
    minor                   VARCHAR(255),
    gpa                     DECIMAL(3,2),
    gpa_scale               DECIMAL(3,2) DEFAULT 4.00,
    show_gpa                BOOLEAN DEFAULT FALSE,
    start_date              DATE,
    end_date                DATE,
    is_current              BOOLEAN DEFAULT FALSE,
    graduation_date         DATE,
    location_city           VARCHAR(100),
    location_state          VARCHAR(100),
    location_country        VARCHAR(100),
    honors                  TEXT[],
    activities              TEXT[],
    description             TEXT,
    display_order           INTEGER DEFAULT 0,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_education_user_id ON education(user_id);
CREATE INDEX idx_education_degree_type ON education(degree_type);
CREATE INDEX idx_education_dates ON education(start_date, end_date);

-- Step 6: Create skills table
CREATE TABLE skills (
    id                      TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    skill_name              VARCHAR(100) NOT NULL,
    skill_category          VARCHAR(100),
    proficiency_level       VARCHAR(50),
    years_of_experience     DECIMAL(4,1),
    display_order           INTEGER DEFAULT 0,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_name)
);

CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_skills_category ON skills(skill_category);
CREATE INDEX idx_skills_proficiency ON skills(proficiency_level);
CREATE INDEX idx_skills_name ON skills(skill_name);

-- Step 7: Create certifications table
CREATE TABLE certifications (
    id                      TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    name                    VARCHAR(255) NOT NULL,
    issuing_organization    VARCHAR(255) NOT NULL,
    issue_date              DATE NOT NULL,
    expiration_date         DATE,
    does_not_expire         BOOLEAN DEFAULT FALSE,
    display_order           INTEGER DEFAULT 0,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_certifications_expiration ON certifications(expiration_date);

-- Step 8: Create special_projects table
CREATE TABLE special_projects (
    id                      TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    project_name            VARCHAR(255) NOT NULL,
    description             TEXT NOT NULL,
    start_date              DATE,
    end_date                DATE,
    status                  VARCHAR(50) DEFAULT 'completed',
    project_url             VARCHAR(500),
    repository_url          VARCHAR(500),
    skills_demonstrated     VARCHAR(100)[],
    display_order           INTEGER DEFAULT 0,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_user_id ON special_projects(user_id);
CREATE INDEX idx_projects_status ON special_projects(status);

-- Done! All tables created successfully