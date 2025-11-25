/**
 * Simple test script for userRepository
 * Run with: node backend/tests/unit/repositories/userRepositoryTest.js
 */

import {
  addUser,
  getUserByEmail,
  deleteUserByUuid
} from "../../../src/repositories/userRepository.js";
import { getPrisma } from "../../../src/utils/db.js";

const prisma = getPrisma();

async function testAddUser() {
  console.log("\n=== Testing addUser ===");
  const testUserEmail = `test-${Date.now()}@ucsd.edu`;
  
  try {
    const userData = {
      email: testUserEmail,
      firstName: "Test",
      lastName: "User"
    };

    const user = await addUser(userData);
    console.log("✓ User created successfully:", {
      userUuid: user.userUuid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });

    // Test duplicate email
    try {
      await addUser(userData);
      console.log("✗ Should have thrown error for duplicate email");
    } catch (error) {
      console.log("✓ Correctly rejected duplicate email:", error.message);
    }

    // Verify user can be retrieved
    const retrievedUser = await getUserByEmail(testUserEmail);
    if (retrievedUser && retrievedUser.userUuid === user.userUuid) {
      console.log("✓ User retrieved successfully by email");
    } else {
      console.log("✗ Failed to retrieve user by email");
    }

    return user.userUuid;
  } catch (error) {
    console.error("✗ Error in testAddUser:", error.message);
    throw error;
  }
}

async function testDeleteUser(userUuid) {
  console.log("\n=== Testing deleteUserByUuid ===");
  
  try {
    const result = await deleteUserByUuid(userUuid);
    console.log("✓ User deleted successfully:", {
      userUuid: result.deletedUser.userUuid,
      email: result.deletedUser.email,
      deletedCoursesCount: result.deletedCoursesCount,
      deletedCourseUuids: result.deletedCourseUuids
    });

    // Verify user is actually deleted
    const user = await getUserByEmail(result.deletedUser.email);
    if (user === null) {
      console.log("✓ Verified user no longer exists in database");
    } else {
      console.log("✗ User still exists after deletion");
    }
  } catch (error) {
    console.error("✗ Error in testDeleteUser:", error.message);
    throw error;
  }
}

async function runTests() {
  try {
    // Test 1
    // console.log("Starting userRepository tests...");
    
    // const userUuid = await testAddUser();
    // await testDeleteUser(userUuid);

    // Test 2
    await testDeleteUser("fill-in-user-uuid-here");
    
    console.log("\n=== All tests passed! ===\n");
  } catch (error) {
    console.error("\n=== Test failed ===");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
