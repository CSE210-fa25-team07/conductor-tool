/**
 * Test database connection and demonstrate Prisma ORM usage
 * Run with: npm run db:test
 */

import { testConnection, closeConnection, getPrisma } from './db.js';

const prisma = getPrisma();

async function main() {
  console.log('🔍 Testing database connection...\n');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('\n📊 Demonstrating Prisma ORM queries...\n');

  try {
    // Example 1: Find all roles
    console.log('=== Example 1: Find all roles ===');
    const roles = await prisma.role.findMany({
      orderBy: { role: 'asc' }
    });
    console.log(`Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`  - ${role.role} (${role.roleUuid})`);
    });

    // Example 2: Find active terms
    console.log('\n=== Example 2: Find active terms ===');
    const activeTerms = await prisma.classTerm.findMany({
      where: { isActive: true },
      orderBy: [
        { year: 'desc' },
        { season: 'asc' }
      ]
    });
    console.log(`Found ${activeTerms.length} active terms:`);
    activeTerms.forEach(term => {
      console.log(`  - ${term.season} ${term.year} (${term.startDate} to ${term.endDate})`);
    });

    // Example 3: Count records in various tables
    console.log('\n=== Example 3: Count records ===');
    const [userCount, courseCount, teamCount, standupCount] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.team.count(),
      prisma.standup.count()
    ]);
    console.log(`Total users: ${userCount}`);
    console.log(`Total courses: ${courseCount}`);
    console.log(`Total teams: ${teamCount}`);
    console.log(`Total standups: ${standupCount}`);

    // Example 4: Find users with related data (includes)
    if (userCount > 0) {
      console.log('\n=== Example 4: Find users with staff profile (if any) ===');
      const usersWithStaff = await prisma.user.findMany({
        where: {
          staff: {
            isNot: null
          }
        },
        include: {
          staff: true
        },
        take: 3
      });
      console.log(`Found ${usersWithStaff.length} staff members:`);
      usersWithStaff.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email})`);
        if (user.staff) {
          console.log(`    Role: ${user.staff.isProf ? 'Professor' : 'Staff'}, Admin: ${user.staff.isSystemAdmin}`);
        }
      });
    }

    // Example 5: Complex query with multiple relations
    if (courseCount > 0) {
      console.log('\n=== Example 5: Find courses with enrollment count ===');
      const coursesWithEnrollments = await prisma.course.findMany({
        include: {
          term: true,
          _count: {
            select: {
              enrollments: true,
              teams: true
            }
          }
        },
        take: 3
      });
      coursesWithEnrollments.forEach(course => {
        console.log(`  - ${course.courseCode}: ${course.courseName}`);
        console.log(`    Term: ${course.term.season} ${course.term.year}`);
        console.log(`    Enrollments: ${course._count.enrollments}, Teams: ${course._count.teams}`);
      });
    }

    // Example 6: Aggregation
    if (standupCount > 0) {
      console.log('\n=== Example 6: Standup sentiment analysis ===');
      const sentimentStats = await prisma.standup.aggregate({
        _avg: { sentimentScore: true },
        _min: { sentimentScore: true },
        _max: { sentimentScore: true },
        _count: { sentimentScore: true }
      });
      console.log(`Sentiment statistics:`);
      console.log(`  Average: ${sentimentStats._avg.sentimentScore?.toFixed(2) ?? 'N/A'}`);
      console.log(`  Min: ${sentimentStats._min.sentimentScore ?? 'N/A'}`);
      console.log(`  Max: ${sentimentStats._max.sentimentScore ?? 'N/A'}`);
      console.log(`  Count: ${sentimentStats._count.sentimentScore}`);
    }

    // Example 7: Transaction example (commented out - doesn't modify data)
    console.log('\n=== Example 7: Transaction (demonstration only) ===');
    console.log('Transactions allow multiple operations to succeed or fail together:');
    console.log(`
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: {...} });
      const enrollment = await tx.courseEnrollment.create({ data: {...} });
      return { user, enrollment };
    });
    `);

    console.log('\n✅ All Prisma examples completed successfully!');
    console.log('\n💡 Tips:');
    console.log('  - Use `npm run db:studio` to open Prisma Studio (GUI for your database)');
    console.log('  - Prisma provides type-safe queries with autocomplete');
    console.log('  - No need to write raw SQL for most operations');
    console.log('  - Check prisma/schema.prisma for the full data model');

  } catch (error) {
    console.error('Error during Prisma operations:', error);
  } finally {
    await closeConnection();
  }
}

main();
