/**
 * Test database connection and query example data
 * Run with: node backend/src/utils/testDb.js
 */

import { testConnection, query, closePool } from './db.js';

async function main() {
  console.log('🔍 Testing database connection...\n');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('\n📊 Querying sample data...\n');

  try {
    // Query roles
    const rolesResult = await query('SELECT * FROM role ORDER BY role');
    console.log('Roles in database:');
    rolesResult.rows.forEach(role => {
      console.log(`  - ${role.role} (${role.role_uuid})`);
    });

    // Query active terms
    const termsResult = await query(
      'SELECT * FROM class_term WHERE is_active = TRUE ORDER BY year DESC, season'
    );
    console.log('\nActive terms:');
    termsResult.rows.forEach(term => {
      console.log(`  - ${term.season} ${term.year} (${term.start_date} to ${term.end_date})`);
    });

    // Query user count
    const userCountResult = await query('SELECT COUNT(*) as count FROM users');
    console.log(`\nTotal users: ${userCountResult.rows[0].count}`);

    // Query course count
    const courseCountResult = await query('SELECT COUNT(*) as count FROM courses');
    console.log(`Total courses: ${courseCountResult.rows[0].count}`);

    // Query team count
    const teamCountResult = await query('SELECT COUNT(*) as count FROM teams');
    console.log(`Total teams: ${teamCountResult.rows[0].count}`);

    console.log('\n✅ All queries successful!');
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await closePool();
  }
}

main();
