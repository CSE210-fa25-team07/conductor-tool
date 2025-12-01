import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createStandup,
  getUserStandups,
  getStandupById,
  updateStandup,
  deleteStandup,
  getTeamStandups
} from "../../../src/repositories/standupRepository.js";
import { getPrisma } from "../../../src/utils/db.js";

const prisma = getPrisma();

describe("standupRepository", () => {
  let testUser;
  let testTeam;
  let testCourse;
  let createdStandupId;

  beforeAll(async () => {
    testUser = await prisma.user.findFirst();
    testTeam = await prisma.team.findFirst();
    testCourse = await prisma.course.findFirst();
  });

  afterAll(async () => {
    if (createdStandupId) {
      await prisma.standup.deleteMany({
        where: { standupUuid: createdStandupId }
      });
    }
    await prisma.$disconnect();
  });

  describe("createStandup", () => {
    it("should create a standup with required fields", async () => {
      const standup = await createStandup({
        userUuid: testUser.userUuid,
        teamUuid: testTeam.teamUuid,
        courseUuid: testCourse.courseUuid,
        whatDone: "Test work done",
        whatNext: "Test next steps",
        blockers: "No blockers"
      });

      expect(standup).toHaveProperty("standupUuid");
      expect(standup.whatDone).toBe("Test work done");
      expect(standup.whatNext).toBe("Test next steps");
      expect(standup.blockers).toBe("No blockers");
      expect(standup.visibility).toBe("team");
      expect(standup).toHaveProperty("user");
      expect(standup).toHaveProperty("team");
      expect(standup).toHaveProperty("course");

      createdStandupId = standup.standupUuid;
    });
  });

  describe("getStandupById", () => {
    it("should return standup by id", async () => {
      const standup = await getStandupById(createdStandupId);

      expect(standup).not.toBeNull();
      expect(standup.standupUuid).toBe(createdStandupId);
      expect(standup).toHaveProperty("user");
      expect(standup).toHaveProperty("team");
      expect(standup).toHaveProperty("course");
    });

    it("should return null for non-existent id", async () => {
      const standup = await getStandupById("00000000-0000-0000-0000-000000000000");
      expect(standup).toBeNull();
    });
  });

  describe("getUserStandups", () => {
    it("should return standups for user", async () => {
      const standups = await getUserStandups(testUser.userUuid);

      expect(Array.isArray(standups)).toBe(true);
      standups.forEach(standup => {
        expect(standup.userUuid).toBe(testUser.userUuid);
      });
    });

    it("should filter by courseUuid", async () => {
      const standups = await getUserStandups(testUser.userUuid, {
        courseUuid: testCourse.courseUuid
      });

      expect(Array.isArray(standups)).toBe(true);
      standups.forEach(standup => {
        expect(standup.courseUuid).toBe(testCourse.courseUuid);
      });
    });

    it("should filter by teamUuid", async () => {
      const standups = await getUserStandups(testUser.userUuid, {
        teamUuid: testTeam.teamUuid
      });

      expect(Array.isArray(standups)).toBe(true);
      standups.forEach(standup => {
        expect(standup.teamUuid).toBe(testTeam.teamUuid);
      });
    });
  });

  describe("updateStandup", () => {
    it("should update standup fields", async () => {
      const updated = await updateStandup(createdStandupId, {
        whatDone: "Updated work done",
        whatNext: "Updated next steps",
        blockers: "Updated blockers"
      });

      expect(updated.standupUuid).toBe(createdStandupId);
      expect(updated.whatDone).toBe("Updated work done");
      expect(updated.whatNext).toBe("Updated next steps");
      expect(updated.blockers).toBe("Updated blockers");
    });
  });

  describe("getTeamStandups", () => {
    it("should return standups for team", async () => {
      const standups = await getTeamStandups(testTeam.teamUuid);

      expect(Array.isArray(standups)).toBe(true);
      standups.forEach(standup => {
        expect(standup.teamUuid).toBe(testTeam.teamUuid);
        expect(standup).toHaveProperty("user");
        expect(standup).toHaveProperty("team");
        expect(standup).toHaveProperty("course");
      });
    });

    it("should support date filtering", async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const standups = await getTeamStandups(testTeam.teamUuid, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      expect(Array.isArray(standups)).toBe(true);
    });
  });

  describe("deleteStandup", () => {
    it("should delete standup", async () => {
      const deleted = await deleteStandup(createdStandupId);

      expect(deleted.standupUuid).toBe(createdStandupId);

      const standup = await getStandupById(createdStandupId);
      expect(standup).toBeNull();

      createdStandupId = null;
    });
  });
});
