# Server Setup

Backend API for ATS for Candidates platform.

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v12+)
- npm

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Database
```bash
sudo -u postgres psql
CREATE DATABASE ats_for_candidates;
\q
```

### 3. Run Migrations
```bash
sudo -u postgres psql -d ats_for_candidates -f src/db/migrations/users_table.sql
sudo -u postgres psql -d ats_for_candidates -f src/db/migrations/002_users_table.sql
```

### 4. Configure Environment

Create `.env` file:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ats_for_candidates
PORT=3000
```

Replace `your_password` with your PostgreSQL password.

### 5. Run Server
```bash
npm run dev
```

Server runs on `http://localhost:3000`

## Database Schema

- **ats_candidates** - User accounts (UUID, email, password_hash, names, timestamps)
- **user_profiles** - Extended profile data (linked via user_id foreign key)

## Troubleshooting

**Connection issues?** Check PostgreSQL is running: `sudo systemctl status postgresql`

**Migration errors?** Verify database exists: `sudo -u postgres psql -l | grep ats_for_candidates`
