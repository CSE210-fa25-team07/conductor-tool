/**
 * @fileoverview Team Dashboard View
 * Displays team standup activity and member status
 */

import { getTeamStandups } from "../../api/standupApi.js";
import { getUserTeams, getActiveCourse } from "../../utils/standup/userContext.js";
import { renderComponent, renderComponents } from "../../utils/standup/componentLoader.js";

let selectedTeamId = null;

/**
 * Render the team dashboard view
 * @param {HTMLElement} container - Container to render into
 */
export async function render(container) {
  const userTeams = getUserTeams();
  const activeCourse = getActiveCourse();

  // Filter teams for active course
  const courseTeams = userTeams.filter(t => t.courseUuid === activeCourse?.courseUuid);

  if (courseTeams.length === 0) {
    container.innerHTML = await renderNoTeams();
    return;
  }

  // Select first team if none selected
  if (!selectedTeamId && courseTeams.length > 0) {
    selectedTeamId = courseTeams[0].teamUuid;
  }

  const selectedTeam = courseTeams.find(t => t.teamUuid === selectedTeamId) || courseTeams[0];
  selectedTeamId = selectedTeam.teamUuid;

  container.innerHTML = `
    <div class="team-dashboard">
      <h2 style="font-family: var(--font-heading); font-size: 2rem; color: var(--color-forest-green); margin-bottom: 1.5rem;">
        Team Dashboard
      </h2>

      ${courseTeams.length > 1 ? `
        <div class="team-selector" style="margin-bottom: 2rem;">
          <label for="team-select" style="font-family: var(--font-primary); font-weight: 600; color: var(--color-forest-green); margin-right: 1rem;">
            Select Team:
          </label>
          <select id="team-select" style="padding: 0.5rem; font-family: var(--font-primary); font-size: 1rem; background-color: white; color: var(--color-forest-green); border: 3px solid var(--color-forest-green); border-radius: 4px;">
            ${courseTeams.map(team => `
              <option value="${team.teamUuid}" ${team.teamUuid === selectedTeamId ? "selected" : ""}>
                ${team.teamName}
              </option>
            `).join("")}
          </select>
        </div>
      ` : ""}

      <div class="team-header">
        <div class="team-name">${selectedTeam.teamName}</div>
        <div class="team-info">${activeCourse?.courseCode} - ${activeCourse?.courseName}</div>
      </div>

      <div id="team-content">
        <div class="loading-message">Loading team activity...</div>
      </div>
    </div>
  `;

  // Attach team selector listener
  if (courseTeams.length > 1) {
    const teamSelect = document.getElementById("team-select");
    teamSelect.addEventListener("change", async (e) => {
      selectedTeamId = e.target.value;
      await loadTeamData();
    });
  }

  // Load team data
  await loadTeamData();
}

/**
 * Load team standup data
 */
async function loadTeamData() {
  const contentDiv = document.getElementById("team-content");

  try {
    contentDiv.innerHTML = "<div class=\"loading-message\">Loading team activity...</div>";

    // Get last 7 days of standups
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const standups = await getTeamStandups(selectedTeamId, {
      startDate,
      endDate
    });

    // Group standups by user
    const userStandups = groupStandupsByUser(standups);

    if (Object.keys(userStandups).length > 0) {
      const memberCardsHTML = await renderComponents(
        "memberCard",
        Object.entries(userStandups).map(([, data]) =>
          prepareMemberCardData(data.user, data.standups)
        )
      );

      contentDiv.innerHTML = `
        <div class="team-summary" style="background-color: var(--color-light-matcha); padding: 1rem; border: 3px solid var(--color-forest-green); border-radius: 4px; margin-bottom: 2rem;">
          <div style="font-family: var(--font-primary); font-size: 1rem; color: var(--color-forest-green);">
            <strong>Last 7 days:</strong> ${standups.length} standup${standups.length !== 1 ? "s" : ""} submitted
            by ${Object.keys(userStandups).length} team member${Object.keys(userStandups).length !== 1 ? "s" : ""}
          </div>
        </div>
        <div class="member-grid">
          ${memberCardsHTML}
        </div>
      `;
    } else {
      contentDiv.innerHTML = await renderEmptyState();
    }

  } catch (error) {
    contentDiv.innerHTML = `
      <div class="error-message">
        Failed to load team data: ${error.message}
      </div>
    `;
  }
}

/**
 * Group standups by user
 * @param {Array} standups - Array of standups
 */
function groupStandupsByUser(standups) {
  const grouped = {};

  standups.forEach(standup => {
    if (!standup.user) return;

    const userId = standup.user.userUuid;
    if (!grouped[userId]) {
      grouped[userId] = {
        user: standup.user,
        standups: []
      };
    }
    grouped[userId].standups.push(standup);
  });

  // Sort standups by date (newest first)
  Object.values(grouped).forEach(data => {
    data.standups.sort((a, b) =>
      new Date(b.dateSubmitted) - new Date(a.dateSubmitted)
    );
  });

  return grouped;
}

/**
 * Prepare member card data for template
 * @param {Object} user - User data
 * @param {Array} standups - User's standups
 * @returns {Object} Template data
 */
function prepareMemberCardData(user, standups) {
  const latestStandup = standups[0];
  const today = new Date().toISOString().split("T")[0];
  const hasSubmittedToday = standups.some(s =>
    s.dateSubmitted.split("T")[0] === today
  );

  const latestDate = latestStandup
    ? new Date(latestStandup.dateSubmitted).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    })
    : "No submissions";

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    statusClass: hasSubmittedToday ? "submitted" : "missing",
    statusText: hasSubmittedToday ? "✓ Today" : "Missing",
    latestDate,
    moodEmoji: latestStandup?.sentimentScore ? renderMood(latestStandup.sentimentScore) : null,
    hasLatestStandup: !!latestStandup,
    whatNextTruncated: latestStandup ? truncate(latestStandup.whatNext, 100) : null,
    blockers: latestStandup?.blockers || null,
    blockersTruncated: latestStandup?.blockers ? truncate(latestStandup.blockers, 80) : null,
    standupCount: standups.length > 0 ? standups.length : null,
    standupPlural: standups.length !== 1 ? "s" : ""
  };
}

/**
 * Render mood emoji
 * @param {number} score - Sentiment score (1-5)
 */
function renderMood(score) {
  const moods = {
    1: "😞",
    2: "😕",
    3: "😐",
    4: "🙂",
    5: "😄"
  };
  return moods[score] || "😐";
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
    icon: "👥",
    title: "No team activity yet",
    text: "Team members' standups will appear here once they start submitting."
  });
}

/**
 * Render no teams message
 */
async function renderNoTeams() {
  return await renderComponent("emptyState", {
    icon: "👥",
    title: "No team assigned",
    text: "You need to be assigned to a team to view the team dashboard."
  });
}
