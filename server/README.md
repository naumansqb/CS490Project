# Backend Server

Node.js/Express server using Supabase (PostgreSQL), Prisma ORM, Firebase Auth, and SMTP for email notifications.

## Quick Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `DATABASE_URL` - Supabase PostgreSQL connection string
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` - Firebase Admin SDK
   - `JWT_SECRET`, `JWT_EXPIRY` - JWT configuration
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` - SMTP settings
   - `CLIENT_URL` - Frontend URL for CORS
   - `PORT` - Server port (default: 5000)

3. **Sync Prisma schema with database**
   ```bash
   npx prisma db pull
   ```

4. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## API Routes

All routes except `/users/send-deletion-email` require authentication via Firebase JWT token in the `Authorization` header as `Bearer <token>`.

### Authentication Routes
**Base:** `/api/auth`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/register` | No | Register new user with Firebase |
| POST | `/login` | No | Login and get JWT token |

### User Routes
**Base:** `/api/users`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/me` | Yes | Get current authenticated user |
| PUT | `/me` | Yes | Update current user profile |
| POST | `/send-deletion-email` | No | Send account deletion confirmation email |

### User Profile Routes
**Base:** `/api/userProfiles`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/` | Yes | Create user profile |
| GET | `/:userId` | Yes | Get user profile by ID |
| PATCH | `/:userId` | Yes | Update user profile |
| DELETE | `/:userId` | Yes | Delete user profile |

### Work Experience Routes
**Base:** `/api/workExperiences`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/` | Yes | Create work experience entry |
| GET | `/:id` | Yes | Get work experience by ID |
| GET | `/user/:userId` | Yes | Get all work experiences for a user |
| PATCH | `/:id` | Yes | Update work experience |
| DELETE | `/:id` | Yes | Delete work experience |

### Education Routes
**Base:** `/api/education`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/` | Yes | Create education entry |
| GET | `/:id` | Yes | Get education by ID |
| GET | `/user/:userId` | Yes | Get all education entries for a user |
| PATCH | `/:id` | Yes | Update education entry |
| DELETE | `/:id` | Yes | Delete education entry |

### Skills Routes
**Base:** `/api/skills`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/` | Yes | Create skill entry |
| GET | `/:id` | Yes | Get skill by ID |
| GET | `/user/:userId` | Yes | Get all skills for a user |
| PATCH | `/:id` | Yes | Update skill |
| DELETE | `/:id` | Yes | Delete skill |

### Certifications Routes
**Base:** `/api/certifications`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/` | Yes | Create certification |
| GET | `/:id` | Yes | Get certification by ID |
| GET | `/user/:userId` | Yes | Get all certifications for a user |
| PATCH | `/:id` | Yes | Update certification |
| DELETE | `/:id` | Yes | Delete certification |

### Special Projects Routes
**Base:** `/api/specialProjects`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/` | Yes | Create special project |
| GET | `/:id` | Yes | Get project by ID |
| GET | `/user/:userId` | Yes | Get all projects for a user |
| PATCH | `/:id` | Yes | Update project |
| DELETE | `/:id` | Yes | Delete project |

### Job Application Routes
**Base:** `/api/jobApplications`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/` | Yes | Create job application |
| GET | `/:id` | Yes | Get application by ID |
| GET | `/user/:userId` | Yes | Get all applications for a user |
| PATCH | `/:id` | Yes | Update application |
| DELETE | `/:id` | Yes | Delete application |

### Contact Routes
**Base:** `/api/contacts`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/` | Yes | Create contact |
| GET | `/:id` | Yes | Get contact by ID |
| GET | `/user/:userId` | Yes | Get all contacts for a user |
| PATCH | `/:id` | Yes | Update contact |
| DELETE | `/:id` | Yes | Delete contact |

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Authentication:** Firebase Admin SDK + JWT
- **Email:** Nodemailer (SMTP)

## Project Structure

```
server/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   │   └── auth.middleware.ts
│   ├── services/
│   │   └── email.ts
│   └── server.ts
└── .env
```