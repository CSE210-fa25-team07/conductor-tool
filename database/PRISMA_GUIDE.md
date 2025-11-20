# Prisma ORM Guide

Prisma is now set up for the Conductor Tool project. This guide shows common usage patterns.

## Quick Start

### Import Prisma Client

```javascript
import { getPrisma } from './backend/src/utils/db.js';

const prisma = getPrisma();
```

## Common Query Examples

### 1. Find All Records

```javascript
// Get all users
const users = await prisma.user.findMany();

// With ordering
const users = await prisma.user.findMany({
  orderBy: { lastName: 'asc' }
});

// With pagination
const users = await prisma.user.findMany({
  skip: 0,
  take: 10
});
```

### 2. Find by ID or Unique Field

```javascript
// Find by primary key
const user = await prisma.user.findUnique({
  where: { userUuid: '...' }
});

// Find by unique field
const user = await prisma.user.findUnique({
  where: { email: 'user@ucsd.edu' }
});
```

### 3. Filter Records

```javascript
// Find students in a specific course
const enrollments = await prisma.courseEnrollment.findMany({
  where: {
    courseUuid: '...',
    enrollmentStatus: 'active'
  }
});

// Multiple conditions
const standups = await prisma.standup.findMany({
  where: {
    AND: [
      { teamUuid: '...' },
      { dateSubmitted: { gte: new Date('2025-01-01') } }
    ]
  }
});
```

### 4. Include Related Data

```javascript
// Get user with their staff profile
const user = await prisma.user.findUnique({
  where: { email: 'prof@ucsd.edu' },
  include: {
    staff: true,
    courseEnrollments: {
      include: {
        course: true,
        role: true
      }
    }
  }
});

// Get course with all related data
const course = await prisma.course.findUnique({
  where: { courseUuid: '...' },
  include: {
    term: true,
    teams: {
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    },
    enrollments: {
      include: {
        user: true,
        role: true
      }
    }
  }
});
```

### 5. Count and Aggregate

```javascript
// Simple count
const userCount = await prisma.user.count();

// Count with filter
const activeStudents = await prisma.courseEnrollment.count({
  where: {
    enrollmentStatus: 'active',
    role: { role: 'Student' }
  }
});

// Count related records
const coursesWithCounts = await prisma.course.findMany({
  include: {
    _count: {
      select: {
        enrollments: true,
        teams: true,
        standups: true
      }
    }
  }
});

// Aggregation
const stats = await prisma.standup.aggregate({
  _avg: { sentimentScore: true },
  _min: { sentimentScore: true },
  _max: { sentimentScore: true },
  _count: true
});
```

### 6. Create Records

```javascript
// Create a single user
const user = await prisma.user.create({
  data: {
    email: 'newuser@ucsd.edu',
    firstName: 'Jane',
    lastName: 'Doe',
    githubUsername: 'janedoe'
  }
});

// Create with relations
const standup = await prisma.standup.create({
  data: {
    userUuid: '...',
    teamUuid: '...',
    courseUuid: '...',
    dateSubmitted: new Date(),
    whatDone: 'Completed feature X',
    whatNext: 'Working on feature Y',
    sentimentScore: 4,
    visibility: 'team'
  }
});

// Create with nested relations
const course = await prisma.course.create({
  data: {
    courseCode: 'CSE 210',
    courseName: 'Software Engineering',
    term: {
      connect: { termUuid: '...' }
    },
    enrollments: {
      create: [
        {
          user: { connect: { userUuid: '...' } },
          role: { connect: { role: 'Professor' } },
          enrollmentStatus: 'active'
        }
      ]
    }
  }
});
```

### 7. Update Records

```javascript
// Update a single record
const user = await prisma.user.update({
  where: { userUuid: '...' },
  data: {
    bio: 'Updated bio',
    lastLogin: new Date()
  }
});

// Update many records
const result = await prisma.courseEnrollment.updateMany({
  where: {
    courseUuid: '...',
    enrollmentStatus: 'active'
  },
  data: {
    droppedAt: new Date(),
    enrollmentStatus: 'dropped'
  }
});
```

### 8. Delete Records

```javascript
// Delete a single record
await prisma.user.delete({
  where: { userUuid: '...' }
});

// Delete many
await prisma.standup.deleteMany({
  where: {
    dateSubmitted: { lt: new Date('2024-01-01') }
  }
});
```

### 9. Transactions

```javascript
// Use transactions when you need multiple operations to succeed or fail together
const result = await prisma.$transaction(async (tx) => {
  // Create user
  const user = await tx.user.create({
    data: {
      email: 'student@ucsd.edu',
      firstName: 'John',
      lastName: 'Smith'
    }
  });

  // Enroll in course
  const enrollment = await tx.courseEnrollment.create({
    data: {
      userUuid: user.userUuid,
      courseUuid: '...',
      roleUuid: '...',
      enrollmentStatus: 'active'
    }
  });

  // Add to team
  const teamMember = await tx.teamMember.create({
    data: {
      userUuid: user.userUuid,
      teamUuid: '...'
    }
  });

  return { user, enrollment, teamMember };
});
```

### 10. Raw Queries (when needed)

```javascript
// Raw SQL query
const result = await prisma.$queryRaw`
  SELECT u.*, COUNT(s.standup_uuid) as standup_count
  FROM users u
  LEFT JOIN standup s ON u.user_uuid = s.user_uuid
  GROUP BY u.user_uuid
`;

// Execute raw SQL
await prisma.$executeRaw`
  UPDATE users SET last_login = NOW() WHERE user_uuid = ${userUuid}
`;
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma Client after schema changes |
| `npm run db:studio` | Open Prisma Studio (visual database browser) |
| `npm run db:pull` | Pull database schema into prisma/schema.prisma |
| `npm run db:test` | Run the test script with Prisma examples |

## Type Safety

Prisma provides full TypeScript support with autocomplete:

```typescript
// TypeScript knows the exact shape of User
const user = await prisma.user.findUnique({
  where: { email: 'user@ucsd.edu' }
});

// user.firstName is typed as string
// user.bio is typed as string | null
// IDE will autocomplete all fields
```

## Best Practices

1. **Reuse the Prisma Client instance** - Don't create multiple instances
2. **Use transactions** for operations that must succeed/fail together
3. **Include only what you need** - Don't over-fetch with includes
4. **Use `select`** instead of `include` when you only need specific fields
5. **Close connections** when done (e.g., in serverless functions)

## Migration Workflow

Since we're using SQL migration files, the workflow is:

1. Make changes to SQL files in `database/migrations/`
2. Run `npm run db:reset` to apply migrations
3. Run `npm run db:pull` to sync Prisma schema with database
4. Run `npm run db:generate` to regenerate Prisma Client

## Learn More

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Schema Reference](../prisma/schema.prisma)
