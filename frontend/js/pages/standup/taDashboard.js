/**
 * @fileoverview TA Dashboard View
 * Multi-team overview for instructors and TAs
 */

import { getTAOverview } from "../../api/standupApi.js";
import { getActiveCourse, getEnrolledCourses, isProfessorOrTA } from "../../utils/userContext.js";
import { renderComponent, renderComponents } from "../../utils/standup/componentLoader.js";
import { loadPageTemplate } from "../../utils/standup/pageLoader.js";

let selectedCourseId = null;

/**
 * Render the TA dashboard view
 * @param {HTMLElement} container - Container to render into
 */
export async function render(container) {
  // Check if user has TA/Professor role
  if (!isProfessorOrTA()) {
    container.innerHTML = await renderUnauthorized();
    return;
  }

  const enrolledCourses = getEnrolledCourses();
  const activeCourse = getActiveCourse();

  // Filter courses where user is TA or Professor
  const teachingCourses = enrolledCourses.filter(course =>
    isProfessorOrTA(course.courseUuid)
  );

  if (teachingCourses.length === 0) {
    container.innerHTML = await renderNoCourses();
    return;
  }

  // Select active course or first teaching course
  if (!selectedCourseId) {
    selectedCourseId = activeCourse?.courseUuid || teachingCourses[0].courseUuid;
  }

  const selectedCourse = teachingCourses.find(c => c.courseUuid === selectedCourseId)
    || teachingCourses[0];
  selectedCourseId = selectedCourse.courseUuid;

  // Load page template
  const pageHTML = await loadPageTemplate("taDashboard");
  container.innerHTML = pageHTML;

  // Insert course selector if multiple courses
  const courseSelectorPlaceholder = document.getElementById("course-select-placeholder");
  if (courseSelectorPlaceholder && teachingCourses.length > 1) {
    courseSelectorPlaceholder.outerHTML = `
      <div style="margin-bottom: 1rem;">
        <label for="course-select" style="font-family: var(--font-primary); font-weight: 600; color: var(--color-forest-green); margin-right: 1rem;">
          Select Course:
        </label>
        <select id="course-select" style="padding: 0.5rem; font-family: var(--font-primary); font-size: 1rem; background-color: white; color: var(--color-forest-green); border: 3px solid var(--color-forest-green); border-radius: 4px;">
          ${teachingCourses.map(course => `
            <option value="${course.courseUuid}" ${course.courseUuid === selectedCourseId ? "selected" : ""}>
              ${course.courseCode} - ${course.courseName}
            </option>
          `).join("")}
        </select>
      </div>
    `;
  }

  // Update selected course info
  const selectedCourseInfo = document.getElementById("selected-course-info");
  if (selectedCourseInfo) {
    selectedCourseInfo.textContent = `${selectedCourse.courseCode} - ${selectedCourse.courseName}`;
  }

  // Attach course selector listener
  if (teachingCourses.length > 1) {
    const courseSelect = document.getElementById("course-select");
    courseSelect?.addEventListener("change", async (e) => {
      selectedCourseId = e.target.value;
      await loadCourseOverview();
    });
  }

  // Load course data
  await loadCourseOverview();
}

/**
 * Load course overview data
 */
async function loadCourseOverview() {
  const contentDiv = document.getElementById("ta-content");

  try {
    contentDiv.innerHTML = "<div class=\"loading-message\">Loading course overview...</div>";

    // Get last 7 days of data
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const overview = await getTAOverview(selectedCourseId, {
      startDate,
      endDate
    });

    // Calculate statistics
    const stats = calculateStatistics(overview);

    // Render stat cards
    const statCardsHTML = await renderComponents("statCard", [
      { value: stats.totalTeams, label: "Total Teams" },
      { value: stats.totalStudents, label: "Total Students" },
      { value: stats.totalStandups, label: "Standups (7 days)" },
      { value: `${stats.avgSubmissionRate}%`, label: "Avg Submission Rate" }
    ]);

    if (overview.teams && overview.teams.length > 0) {
      // Render team cards
      const teamCardsHTML = await renderComponents(
        "teamCard",
        overview.teams.map(team => prepareTeamCardData(team))
      );

      contentDiv.innerHTML = `
        <div class="ta-stats">
          ${statCardsHTML}
        </div>
        <div class="team-list">
          ${teamCardsHTML}
        </div>
      `;
    } else {
      contentDiv.innerHTML = `
        <div class="ta-stats">
          ${statCardsHTML}
        </div>
        ${await renderEmptyState()}
      `;
    }

  } catch (error) {
    contentDiv.innerHTML = `
      <div class="error-message">
        Failed to load course overview: ${error.message}
      </div>
    `;
  }
}

/**
 * Calculate overview statistics
 * @param {Object} overview - Course overview data
 */
function calculateStatistics(overview) {
  const teams = overview.teams || [];
  const totalTeams = teams.length;
  const totalStudents = teams.reduce((sum, team) => sum + (team.memberCount || 0), 0);
  const totalStandups = teams.reduce((sum, team) => sum + (team.standupCount || 0), 0);

  // Calculate average submission rate
  const submissionRates = teams
    .filter(team => team.memberCount > 0)
    .map(team => {
      const expectedStandups = team.memberCount * 7; // 7 days
      const actualStandups = team.standupCount || 0;
      return (actualStandups / expectedStandups) * 100;
    });

  const avgSubmissionRate = submissionRates.length > 0
    ? Math.round(submissionRates.reduce((sum, rate) => sum + rate, 0) / submissionRates.length)
    : 0;

  return {
    totalTeams,
    totalStudents,
    totalStandups,
    avgSubmissionRate
  };
}

/**
 * Prepare team card data for template
 * @param {Object} team - Team data
 * @returns {Object} Template data
 */
function prepareTeamCardData(team) {
  const expectedStandups = (team.memberCount || 0) * 7; // 7 days
  const actualStandups = team.standupCount || 0;
  const submissionRate = expectedStandups > 0
    ? Math.round((actualStandups / expectedStandups) * 100)
    : 0;

  const alertLevel = getAlertLevel(submissionRate, team);
  const latestStandup = team.latestStandup;
  const hasBlockers = team.standups?.some(s => s.blockers) || latestStandup?.blockers;

  const alertData = {
    ok: { class: "ok", text: "✓ On Track" },
    attention: { class: "attention", text: "⚠️ Needs Attention" }
  };
  const alert = alertData[alertLevel] || alertData.ok;

  return {
    teamName: team.teamName,
    memberCount: team.memberCount || 0,
    memberPlural: team.memberCount !== 1 ? "s" : "",
    standupCount: actualStandups,
    standupPlural: actualStandups !== 1 ? "s" : "",
    submissionRate,
    alertClass: alert.class,
    alertText: alert.text,
    hasLatestStandup: !!latestStandup,
    userFirstName: latestStandup?.user?.firstName || null,
    userLastName: latestStandup?.user?.lastName || null,
    dateFormatted: latestStandup
      ? new Date(latestStandup.dateSubmitted).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null,
    whatNextTruncated: latestStandup ? truncate(latestStandup.whatNext, 120) : null,
    blockers: latestStandup?.blockers || null,
    blockersTruncated: latestStandup?.blockers ? truncate(latestStandup.blockers, 120) : null,
    hasBlockers: hasBlockers || null
  };
}

/**
 * Get alert level based on submission rate and team data
 * @param {number} submissionRate - Team submission rate percentage
 * @param {Object} team - Team data
 */
function getAlertLevel(submissionRate, team) {
  const hasBlockers = team.standups?.some(s => s.blockers) || team.latestStandup?.blockers;

  if (submissionRate < 50 || hasBlockers) {
    return "attention";
  }
  return "ok";
}

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 */
function truncate(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Render empty state
 */
async function renderEmptyState() {
  return await renderComponent("emptyState", {
    icon: "📊",
    title: "No teams found",
    text: "This course doesn't have any teams yet."
  });
}

/**
 * Render unauthorized message
 */
async function renderUnauthorized() {
  return await renderComponent("emptyState", {
    icon: "🔒",
    title: "Access Denied",
    text: "This dashboard is only available to TAs and Instructors."
  });
}

/**
 * Render no courses message
 */
async function renderNoCourses() {
  return await renderComponent("emptyState", {
    icon: "📚",
    title: "No teaching assignments",
    text: "You don't have TA or Instructor role in any courses."
  });
}
