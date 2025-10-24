# CS490 API Documentation

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Add your DATABASE_URL to .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev

# Run tests
npm test
```

## API Endpoints

### User Profiles (`/api/user-profiles`)

| Method | Endpoint        | Description                                               |
| ------ | --------------- | --------------------------------------------------------- |
| POST   | `/`             | Create a new user profile                                 |
| GET    | `/`             | List all profiles (pagination: ?limit=10&offset=0)        |
| GET    | `/:id`          | Get profile by profile ID                                 |
| GET    | `/user/:userId` | Get profile by user ID                                    |
| PATCH  | `/:id`          | Update profile                                            |
| DELETE | `/:id`          | Delete profile (cascades to work experiences & education) |

### Work Experiences (`/api/work-experiences`)

| Method | Endpoint        | Description                         |
| ------ | --------------- | ----------------------------------- |
| POST   | `/`             | Create work experience              |
| GET    | `/:id`          | Get work experience by ID           |
| GET    | `/user/:userId` | Get all work experiences for a user |
| PATCH  | `/:id`          | Update work experience              |
| DELETE | `/:id`          | Delete work experience              |

### Education (`/api/educations`)

| Method | Endpoint        | Description                          |
| ------ | --------------- | ------------------------------------ |
| POST   | `/`             | Create education record              |
| GET    | `/:id`          | Get education by ID                  |
| GET    | `/user/:userId` | Get all education records for a user |
| PATCH  | `/:id`          | Update education record              |
| DELETE | `/:id`          | Delete education record              |

## Error Handling

All endpoints return appropriate HTTP status codes:

| Code | Meaning                           |
| ---- | --------------------------------- |
| 200  | Success                           |
| 201  | Created successfully              |
| 204  | Deleted successfully (no content) |
| 404  | Resource not found                |
| 409  | Conflict (duplicate entry)        |
| 500  | Internal server error             |

Error responses follow this format:

```json
{
  "error": "Description of the error"
}
```

## Environment Variables

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

## Available Scripts

```bash
npm run dev              # Start development server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm start                # Start production server
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage report
npm run prisma:studio    # Open Prisma Studio (database GUI)
```
