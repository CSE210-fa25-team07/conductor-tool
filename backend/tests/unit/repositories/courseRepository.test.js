/**
 * Unit tests for Course Repository
 */

import { getCoursesByUserId } from '../../../src/repositories/courseRepository.js';

/**
 * Test function to verify getCoursesByUserId works correctly
 */
async function testGetCoursesByUserId() {
  try {
    // Replace this with an actual user UUID from your database
    const testUserUuid = '1bfa892d-4860-4706-a8f9-04c560ea4471';
    
    console.log(`Testing getCoursesByUserId with user: ${testUserUuid}`);
    
    const courses = await getCoursesByUserId(testUserUuid);
    
    console.log('✅ Successfully retrieved courses:');
    console.log(`Found ${courses.length} courses`);
    console.log(JSON.stringify(courses, null, 2));
    
    return courses;
  } catch (error) {
    console.error('❌ Error testing getCoursesByUserId:', error.message);
    throw error;
  }
}

// Run the test
testGetCoursesByUserId()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
