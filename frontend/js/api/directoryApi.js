/**
 * Placeholder implementations for real API calls.
 * The Auth team will provide apiClient.js + authenticated fetch helpers.
 */

const missingApiClientMessage = [
  "apiClient.js is not implemented yet.",
  "Auth/Login team owns the shared HTTP client.",
  "Swap these stub functions with real implementations once the client is ready."
].join(" ");

function notImplemented() {
  throw new Error(missingApiClientMessage);
}

export async function getCourseOverview(courseUuid) {
  void courseUuid;
  notImplemented();
}

export async function getCourseStaff(courseUuid) {
  void courseUuid;
  notImplemented();
}

export async function getEnrollmentStats(courseUuid) {
  void courseUuid;
  notImplemented();
}

export async function getRecentEnrollments(courseUuid, limit = 10) {
  void courseUuid;
  void limit;
  notImplemented();
}

export async function getUserRole(courseUuid) {
  void courseUuid;
  notImplemented();
}

export async function getUserProfile(userUuid) {
  void userUuid;
  notImplemented();
}

export async function getCourseRoster(courseUuid, page = 1, limit = 12, filter = "all") {
  void courseUuid;
  void page;
  void limit;
  void filter;
  notImplemented();
}
