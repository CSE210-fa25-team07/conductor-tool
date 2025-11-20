# Repositories

Database queries. One file per table (roughly).

## Files

- `userRepository.js` - Auth + Directory teams (shared)
- `teamRepository.js` - Directory team (shared with others)
- `attendanceRepository.js` - Attendance team
- `standupRepository.js` - Standup team

## Responsibilities

- Execute SQL queries (Prisma)
- Return raw data
- **NO business logic** (just CRUD)

## Pattern

```javascript
import { getPrisma } from "../utils/db.js";

/**
 * Get all courses currently enrolled by a user
 * @param {string} userUuid - The UUID of the user
 * @returns {Promise<Array>} Array of course objects
 * @throws {Error} If database query fails
 */
async function getCoursesByUserId(userUuid) {
  const prisma = getPrisma();

  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      userUuid: userUuid,
      course: {
        term: {
          isActive: true
        }
      }
    },
    distinct: ["courseUuid"]
  });

  return enrollments.map(enrollment => enrollment.courseUuid);
}

export { getCoursesByUserId };
```
