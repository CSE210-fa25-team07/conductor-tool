/**
 * @fileoverview TA/Instructor Dashboard View
 * Displays multi-team overview and statistics with Chart.js analytics
 */

import { getTAOverview } from "../../api/standupApi.js";
import { getActiveCourse } from "../../utils/userContext.js";
import { loadTemplate } from "../../utils/templateLoader.js";
import { renderComponents } from "../../utils/componentLoader.js";
import { navigateToView } from "./courseIntegration.js";

// Store chart instances to destroy them before re-rendering
const chartInstances = {};

// Store data for chart toggling
const chartData = {
  standups: [],
  teamGroups: {},
  dates: []
};

/**
 * Render the TA dashboard view
 * @param {HTMLElement} container - Container to render into
 */
export async function render(container) {
  const activeCourse = getActiveCourse();

  if (!activeCourse) {
    container.innerHTML = "<div class=\"error-message\">No active course selected.</div>";
    return;
  }

  // Load page template
  const pageHTML = await loadTemplate("standup", "taDashboard");
  container.innerHTML = pageHTML;

  // Load Chart.js if not present
  await loadChartJs();

  // Load course data
  await loadCourseOverview(activeCourse.courseUuid);
}

/**
 * Load Chart.js library dynamically
 */
function loadChartJs() {
  return new Promise((resolve, reject) => {
    if (window.Chart) return resolve();

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Load course overview data and render dashboard
 * @param {string} courseUuid - Course UUID
 */
async function loadCourseOverview(courseUuid) {
  const contentDiv = document.getElementById("ta-content");

  try {
    // Get last 14 days of standups for better trend data
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const standups = await getTAOverview(courseUuid, { startDate, endDate });
    const teamGroups = groupStandupsByTeam(standups);
    const stats = calculateStats(standups, teamGroups);

    // Render Dashboard Structure
    contentDiv.innerHTML = `
      <!-- Key Metrics Summary -->
      <section class="dashboard-section">
        <div class="section-header">
          <h3 class="section-title">Key Metrics</h3>
          <div class="section-divider"></div>
        </div>
        <div class="metrics-row metrics-summary">
          ${renderMetricCard("Active Students", stats.activeStudents, "Students submitting", "activeStudents")}
          ${renderMetricCard("Submissions", stats.totalSubmissions || standups.length, "Last 14 days", "submissionRate")}
          ${renderMetricCard("Avg Sentiment", stats.avgSentiment, "Scale 1-5", "avgSentiment")}
          ${renderMetricCard("Blockers", stats.totalBlockers, "Reported this period", "blockers")}
        </div>

        <!-- 2x2 Charts Grid -->
        <div class="metrics-charts-grid" id="metrics-charts-grid">
          <div class="metric-chart-panel" data-metric="activeStudents">
            <div class="metric-chart-header">
              <span class="metric-chart-title">Active Students Over Time</span>
              <div class="metric-controls">
                <div class="metric-time-filter">
                  <button class="metric-time-btn" data-days="3">3D</button>
                  <button class="metric-time-btn active" data-days="7">7D</button>
                  <button class="metric-time-btn" data-days="14">14D</button>
                  <button class="metric-time-btn" data-days="30">30D</button>
                </div>
                <label class="metric-breakdown-toggle">
                  <input type="checkbox" class="metric-breakdown-checkbox" data-metric="activeStudents" />
                  <span class="toggle-label">By Team</span>
                </label>
              </div>
            </div>
            <div class="metric-chart-wrapper"><canvas id="chart-activeStudents"></canvas></div>
          </div>
          <div class="metric-chart-panel" data-metric="submissionRate">
            <div class="metric-chart-header">
              <span class="metric-chart-title">Submissions Over Time</span>
              <div class="metric-controls">
                <div class="metric-time-filter">
                  <button class="metric-time-btn" data-days="3">3D</button>
                  <button class="metric-time-btn active" data-days="7">7D</button>
                  <button class="metric-time-btn" data-days="14">14D</button>
                  <button class="metric-time-btn" data-days="30">30D</button>
                </div>
                <label class="metric-breakdown-toggle">
                  <input type="checkbox" class="metric-breakdown-checkbox" data-metric="submissionRate" />
                  <span class="toggle-label">By Team</span>
                </label>
              </div>
            </div>
            <div class="metric-chart-wrapper"><canvas id="chart-submissionRate"></canvas></div>
          </div>
          <div class="metric-chart-panel" data-metric="avgSentiment">
            <div class="metric-chart-header">
              <span class="metric-chart-title">Avg Sentiment Over Time</span>
              <div class="metric-controls">
                <div class="metric-time-filter">
                  <button class="metric-time-btn" data-days="3">3D</button>
                  <button class="metric-time-btn active" data-days="7">7D</button>
                  <button class="metric-time-btn" data-days="14">14D</button>
                  <button class="metric-time-btn" data-days="30">30D</button>
                </div>
                <label class="metric-breakdown-toggle">
                  <input type="checkbox" class="metric-breakdown-checkbox" data-metric="avgSentiment" />
                  <span class="toggle-label">By Team</span>
                </label>
              </div>
            </div>
            <div class="metric-chart-wrapper"><canvas id="chart-avgSentiment"></canvas></div>
          </div>
          <div class="metric-chart-panel" data-metric="blockers">
            <div class="metric-chart-header">
              <span class="metric-chart-title">Blockers Over Time</span>
              <div class="metric-controls">
                <div class="metric-time-filter">
                  <button class="metric-time-btn" data-days="3">3D</button>
                  <button class="metric-time-btn active" data-days="7">7D</button>
                  <button class="metric-time-btn" data-days="14">14D</button>
                  <button class="metric-time-btn" data-days="30">30D</button>
                </div>
                <label class="metric-breakdown-toggle">
                  <input type="checkbox" class="metric-breakdown-checkbox" data-metric="blockers" />
                  <span class="toggle-label">By Team</span>
                </label>
              </div>
            </div>
            <div class="metric-chart-wrapper"><canvas id="chart-blockers"></canvas></div>
          </div>
        </div>

        <!-- GitHub Activity Chart (full width, below 2x2 grid) -->
        <div class="github-chart-panel" id="github-chart-panel">
          <div class="metric-chart-header">
            <span class="metric-chart-title">GitHub Activity Over Time</span>
            <div class="metric-controls">
              <div class="metric-time-filter" id="github-time-filter">
                <button class="metric-time-btn" data-days="3">3D</button>
                <button class="metric-time-btn active" data-days="7">7D</button>
                <button class="metric-time-btn" data-days="14">14D</button>
                <button class="metric-time-btn" data-days="30">30D</button>
              </div>
              <label class="metric-breakdown-toggle">
                <input type="checkbox" id="github-breakdown-checkbox" />
                <span class="toggle-label">By Team</span>
              </label>
            </div>
          </div>
          <div class="github-chart-wrapper"><canvas id="chart-github"></canvas></div>
        </div>
      </section>

      <!-- Teams & Alerts Section -->
      <section class="dashboard-section">
        <div class="section-header">
          <h3 class="section-title">Teams & Alerts</h3>
          <div class="section-divider"></div>
        </div>
        <div class="bottom-row">
          <div class="list-container">
            <h4 class="chart-title">Team Overview</h4>
            <p class="list-hint">Click a team to view details</p>
            <div class="team-grid">
              ${Object.values(teamGroups).map(group => renderTeamCard(group)).join("")}
            </div>
          </div>
          <div class="list-container">
            <h4 class="chart-title">At Risk Students</h4>
            <ul class="at-risk-list">
              ${renderAtRiskList(standups)}
            </ul>
          </div>
        </div>
      </section>

      <!-- Recent Feeds Section -->
      <section class="dashboard-section">
        <div class="section-header">
          <h3 class="section-title">Recent Standups</h3>
          <div class="section-divider"></div>
        </div>
        <div class="feeds-container">
          <div class="feeds-header">
            <div class="feeds-filter" id="feeds-filter">
              <button class="feeds-filter-btn" data-days="1">Today</button>
              <button class="feeds-filter-btn" data-days="3">3 Days</button>
              <button class="feeds-filter-btn active" data-days="7">7 Days</button>
              <button class="feeds-filter-btn" data-days="14">14 Days</button>
            </div>
            <span class="feeds-count" id="feeds-count">${renderFeedsCount(standups, 7)}</span>
          </div>
          <div class="feeds-list" id="feeds-list">
            <div class="loading-message">Loading feeds...</div>
          </div>
        </div>
      </section>
    `;

    // Store data for chart rendering
    chartData.standups = standups;
    chartData.teamGroups = teamGroups;

    // Initialize all 4 metric charts
    initializeMetricCharts(teamGroups);

    // Initialize GitHub activity chart
    renderGitHubChart(teamGroups, 7, false);

    // Render feeds asynchronously
    const feedsList = document.getElementById("feeds-list");
    if (feedsList) {
      feedsList.innerHTML = await renderCompactFeeds(standups, 7);
    }

    // Attach Listeners
    attachTeamCardListeners(contentDiv);
    attachMetricChartListeners(teamGroups);
    attachGitHubChartListeners(teamGroups);
    attachAtRiskListeners(contentDiv);
    attachFeedFilterListener(standups);
    attachFeedClickListeners(contentDiv);

  } catch (error) {
    contentDiv.innerHTML = `<div class="error-message">Failed to load course overview: ${error.message}</div>`;
  }
}

/**
 * Render a single metric card (compact, no chart embedded)
 */
function renderMetricCard(label, value, subtext, metricKey) {
  return `
    <div class="metric-card" data-metric="${metricKey}" data-label="${label}">
      <div class="metric-value">${value}</div>
      <div class="metric-label">${label}</div>
      <div class="metric-subtext">${subtext}</div>
    </div>
  `;
}

/**
 * Initialize all 4 metric charts in the 2x2 grid
 * @param {Object} teamGroups - Grouped standups by team
 */
function initializeMetricCharts(teamGroups) {
  const metrics = ["activeStudents", "submissionRate", "avgSentiment", "blockers"];
  metrics.forEach(metricKey => {
    // Default: 7 days, not by team
    renderMetricChart(metricKey, teamGroups, 7, false);
  });
}

/**
 * Attach listeners to metric chart controls (time filter, breakdown toggle)
 * @param {Object} teamGroups - Grouped standups by team
 */
function attachMetricChartListeners(teamGroups) {
  const chartsGrid = document.getElementById("metrics-charts-grid");
  if (!chartsGrid) return;

  const panels = chartsGrid.querySelectorAll(".metric-chart-panel");
  panels.forEach(panel => {
    const metricKey = panel.dataset.metric;

    // Track current state for this panel
    let currentDays = 7;
    let currentByTeam = false;

    // Add time filter listeners
    const timeButtons = panel.querySelectorAll(".metric-time-btn");
    timeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        timeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentDays = parseInt(btn.dataset.days, 10);
        renderMetricChart(metricKey, teamGroups, currentDays, currentByTeam);
      });
    });

    // Add breakdown toggle listener
    const breakdownCheckbox = panel.querySelector(".metric-breakdown-checkbox");
    if (breakdownCheckbox) {
      breakdownCheckbox.addEventListener("change", (e) => {
        currentByTeam = e.target.checked;
        renderMetricChart(metricKey, teamGroups, currentDays, currentByTeam);
      });
    }
  });
}

/**
 * Attach listeners to GitHub chart controls
 * @param {Object} teamGroups - Grouped standups by team
 */
function attachGitHubChartListeners(teamGroups) {
  const panel = document.getElementById("github-chart-panel");
  if (!panel) return;

  let currentDays = 7;
  let currentByTeam = false;

  // Time filter listeners
  const timeButtons = panel.querySelectorAll(".metric-time-btn");
  timeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      timeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentDays = parseInt(btn.dataset.days, 10);
      renderGitHubChart(teamGroups, currentDays, currentByTeam);
    });
  });

  // Breakdown toggle listener
  const breakdownCheckbox = document.getElementById("github-breakdown-checkbox");
  if (breakdownCheckbox) {
    breakdownCheckbox.addEventListener("change", (e) => {
      currentByTeam = e.target.checked;
      renderGitHubChart(teamGroups, currentDays, currentByTeam);
    });
  }
}

/**
 * Render GitHub activity chart (stacked bar chart)
 * @param {Object} teamGroups - Grouped standups by team
 * @param {number} days - Number of days to show
 * @param {boolean} byTeam - Show breakdown by team
 */
function renderGitHubChart(teamGroups, days = 7, byTeam = false) {
  const ctx = document.getElementById("chart-github");
  if (!ctx) return;

  if (chartInstances.github) {
    chartInstances.github.destroy();
  }

  const { standups } = chartData;
  const data = getGitHubDataOverTime(standups, teamGroups, days, byTeam);

  chartInstances.github = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: data.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 12,
            padding: 8,
            font: { family: "Monaco", size: 10 }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          stacked: !byTeam,
          grid: { color: "#D3FBD6" },
          ticks: { font: { family: "Monaco" } }
        },
        x: {
          stacked: !byTeam,
          grid: { display: false },
          ticks: { font: { family: "Monaco", size: 10 } }
        }
      }
    }
  });
}

// GitHub activity type colors
const GITHUB_COLORS = {
  commit: "#16a34a",   // green
  pr: "#9333ea",       // purple
  review: "#0891b2",   // cyan
  issue: "#d97706"     // orange
};

/**
 * Get GitHub activity data over time
 * @param {Array} standups - All standups
 * @param {Object} teamGroups - Grouped standups by team
 * @param {number} days - Number of days to show
 * @param {boolean} byTeam - Show breakdown by team
 * @returns {Object} { labels, datasets }
 */
function getGitHubDataOverTime(standups, teamGroups, days, byTeam = false) {
  // Generate last N days
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const labels = dates.map(d => d.slice(5)); // MM-DD format

  if (byTeam) {
    // One line per team showing total GitHub activities
    const datasets = Object.values(teamGroups).map((group, i) => {
      const color = TEAM_COLORS[i % TEAM_COLORS.length];
      const values = dates.map(date => {
        const dayStandups = group.standups.filter(s => s.dateSubmitted.startsWith(date));
        return dayStandups.reduce((sum, s) => {
          if (!s.githubActivities || !Array.isArray(s.githubActivities)) return sum;
          return sum + s.githubActivities.length;
        }, 0);
      });
      return {
        label: group.team.teamName,
        data: values,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1
      };
    });
    return { labels, datasets };
  } else {
    // Stacked bar chart by activity type
    const activityTypes = ["commit", "pr", "review", "issue"];
    const datasets = activityTypes.map(type => {
      const values = dates.map(date => {
        const dayStandups = standups.filter(s => s.dateSubmitted.startsWith(date));
        return dayStandups.reduce((sum, s) => {
          if (!s.githubActivities || !Array.isArray(s.githubActivities)) return sum;
          return sum + s.githubActivities.filter(a => a.type === type).length;
        }, 0);
      });
      return {
        label: type.charAt(0).toUpperCase() + type.slice(1) + "s",
        data: values,
        backgroundColor: GITHUB_COLORS[type],
        borderColor: GITHUB_COLORS[type],
        borderWidth: 1
      };
    });
    return { labels, datasets };
  }
}

// Color palette for team charts - ecological theme with variety
const TEAM_COLORS = [
  "#99FF66", // radioactive-lime
  "#4ECDC4", // teal
  "#66CC99", // mint green
  "#FFD93D", // golden yellow
  "#FF8C42", // orange
  "#95E1D3", // soft aqua
  "#C9B1FF", // lavender
  "#FF6B6B", // coral
  "#66D9EF", // sky blue
  "#A8E6CF" // pale green
];

/**
 * Render chart for metric panel (line chart over time)
 * @param {string} metricKey - The metric key
 * @param {Object} teamGroups - Grouped standups by team
 * @param {number} days - Number of days to show
 * @param {boolean} byTeam - Show breakdown by team
 */
function renderMetricChart(metricKey, teamGroups, days = 7, byTeam = false) {
  const ctx = document.getElementById(`chart-${metricKey}`);
  if (!ctx) return;

  // Destroy existing if any (safety check)
  if (chartInstances[metricKey]) {
    chartInstances[metricKey].destroy();
  }

  const { standups } = chartData;
  const data = getMetricDataOverTime(metricKey, standups, teamGroups, days, byTeam);

  chartInstances[metricKey] = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: data.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: byTeam,
          position: "bottom",
          labels: {
            boxWidth: 12,
            padding: 8,
            font: { family: "Monaco", size: 10 }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#D3FBD6" },
          ticks: { font: { family: "Monaco" } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "Monaco", size: 10 } }
        }
      }
    }
  });
}

/**
 * Get metric data over time for line charts
 * @param {string} metricKey - The metric key
 * @param {Array} standups - All standups
 * @param {Object} teamGroups - Grouped standups by team
 * @param {number} days - Number of days to show
 * @param {boolean} byTeam - Show breakdown by team
 * @returns {Object} { labels, datasets }
 */
function getMetricDataOverTime(metricKey, standups, teamGroups, days, byTeam = false) {
  // Generate last N days
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const labels = dates.map(d => d.slice(5)); // MM-DD format

  if (byTeam) {
    // Multi-team view: one dataset per team
    const datasets = Object.values(teamGroups).map((group, i) => {
      const color = TEAM_COLORS[i % TEAM_COLORS.length];
      const values = dates.map(date => getMetricValueForDate(metricKey, group.standups, date));
      return {
        label: group.team.teamName,
        data: values,
        borderColor: color,
        backgroundColor: color + "33",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: color
      };
    });
    return { labels, datasets };
  } else {
    // Aggregate view: single dataset
    const values = dates.map(date => getMetricValueForDate(metricKey, standups, date));
    const datasets = [{
      label: getMetricLabel(metricKey),
      data: values,
      borderColor: "#052B08",
      backgroundColor: "rgba(153, 255, 102, 0.2)",
      borderWidth: 2,
      tension: 0.3,
      fill: true,
      pointBackgroundColor: "#FFFFFF",
      pointBorderColor: "#052B08",
      pointRadius: 4
    }];
    return { labels, datasets };
  }
}

/**
 * Get metric value for a specific date
 * @param {string} metricKey - The metric key
 * @param {Array} standups - Standups to analyze
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {number|null} Metric value
 */
function getMetricValueForDate(metricKey, standups, date) {
  const dayStandups = standups.filter(s => s.dateSubmitted.startsWith(date));

  switch (metricKey) {
  case "activeStudents":
    return new Set(dayStandups.map(s => s.user?.userUuid).filter(Boolean)).size;

  case "submissionRate":
    return dayStandups.length;

  case "avgSentiment": {
    const withSentiment = dayStandups.filter(s => s.sentimentScore);
    if (withSentiment.length === 0) return null;
    const avg = withSentiment.reduce((sum, s) => sum + s.sentimentScore, 0) / withSentiment.length;
    return parseFloat(avg.toFixed(1));
  }

  case "blockers":
    return dayStandups.filter(s => s.blockers).length;

  default:
    return 0;
  }
}

/**
 * Get label for metric
 * @param {string} metricKey - The metric key
 * @returns {string} Human-readable label
 */
function getMetricLabel(metricKey) {
  const labels = {
    activeStudents: "Active Students",
    submissionRate: "Submissions",
    avgSentiment: "Avg Sentiment",
    blockers: "Blockers"
  };
  return labels[metricKey] || metricKey;
}

/**
 * Render a team card
 */
function renderTeamCard(group) {
  const { team, standups, users } = group;
  const lastStandup = standups[standups.length - 1];
  const lastActive = lastStandup ? new Date(lastStandup.dateSubmitted).toLocaleDateString() : "Never";
  const blockers = standups.filter(s => s.blockers).length;

  return `
    <div class="team-card" data-team-id="${team.teamUuid}" data-team-name="${team.teamName}">
      <div class="team-card-header">
        <h4 class="team-name">${team.teamName}</h4>
        <span class="team-member-count">${users.size} members</span>
      </div>
      <div class="team-stats">
        <div class="stat-item">
          <strong>${standups.length}</strong> subs
        </div>
        ${blockers > 0 ? `<div class="stat-item blocker">⚠ ${blockers} blockers</div>` : "<div class=\"stat-item\">✓ No blockers</div>"}
      </div>
      <div class="team-last-active">
        Last active: ${lastActive}
      </div>
    </div>
  `;
}

/**
 * Render At Risk List
 */
function renderAtRiskList(standups) {
  const atRisk = identifyAtRiskStudents(standups);
  if (atRisk.length === 0) {
    return "<li class=\"at-risk-empty\">✓ No students at risk</li>";
  }
  return atRisk.map(student => `
    <li class="at-risk-item" data-user-id="${student.userUuid}" data-user-name="${student.name}">
      <span class="student-name">${student.name}</span>
      <span class="missed-count">${student.count} missed</span>
    </li>
  `).join("");
}


/**
 * Helper: Group standups by team
 */
function groupStandupsByTeam(standups) {
  const grouped = {};
  standups.forEach(standup => {
    if (!standup.team) return;
    const teamId = standup.team.teamUuid;
    if (!grouped[teamId]) {
      grouped[teamId] = { team: standup.team, standups: [], users: new Set() };
    }
    grouped[teamId].standups.push(standup);
    if (standup.user) grouped[teamId].users.add(standup.user.userUuid);
  });
  return grouped;
}

/**
 * Helper: Calculate stats
 */
function calculateStats(standups, teamGroups) {
  const standupsWithSentiment = standups.filter(s => s.sentimentScore);
  const avgSentiment = standupsWithSentiment.length > 0
    ? (standupsWithSentiment.reduce((sum, s) => sum + s.sentimentScore, 0) / standupsWithSentiment.length).toFixed(1)
    : "N/A";

  const activeUsers = new Set(standups.map(s => s.user?.userUuid)).size;
  // Simple submission rate: active users / total expected (assuming 20 students for demo if unknown)
  // Or just use active users count directly

  const blockers = standups.filter(s => s.blockers).length;

  return {
    totalTeams: Object.keys(teamGroups).length,
    activeStudents: activeUsers,
    avgSentiment,
    submissionRate: 85, // Mocked for demo, or calculate if total students known
    totalBlockers: blockers
  };
}

/**
 * Helper: Identify At Risk Students
 */
function identifyAtRiskStudents(standups) {
  const userCounts = {};
  const userDetails = {};

  standups.forEach(s => {
    if (!s.user) return;
    const uid = s.user.userUuid;
    userCounts[uid] = (userCounts[uid] || 0) + 1;
    userDetails[uid] = s.user;
  });

  // Logic: < 3 submissions in 14 days is risky? Or < 2 in 7 days?
  // Let's say < 3 in the period
  const atRisk = [];
  Object.entries(userCounts).forEach(([uid, count]) => {
    if (count < 3) {
      atRisk.push({
        userUuid: uid,
        name: `${userDetails[uid].firstName} ${userDetails[uid].lastName}`,
        count: 5 - count // Assuming 5 expected
      });
    }
  });
  return atRisk;
}

/**
 * Attach listeners to team cards
 */
function attachTeamCardListeners(container) {
  const cards = container.querySelectorAll(".team-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const teamId = card.dataset.teamId;
      const teamName = card.dataset.teamName;
      if (teamId) {
        navigateToView("team", { teamUuid: teamId, teamName: teamName });
      }
    });
  });
}

/**
 * Attach listeners to at-risk student items
 */
function attachAtRiskListeners(container) {
  const items = container.querySelectorAll(".at-risk-item[data-user-id]");
  items.forEach(item => {
    item.addEventListener("click", () => {
      const userUuid = item.dataset.userId;
      const userName = item.dataset.userName;
      if (userUuid) {
        navigateToView("history", { userUuid, userName });
      }
    });
  });
}

/**
 * Render compact feed items
 */
async function renderCompactFeeds(standups, days = 7) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const filtered = standups
    .filter(s => new Date(s.dateSubmitted) >= cutoff)
    .sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted));

  if (filtered.length === 0) {
    return "<div class=\"feeds-empty\">No standups in this period</div>";
  }

  const feedData = filtered.map(standup => {
    const date = new Date(standup.dateSubmitted);
    return {
      userUuid: standup.user?.userUuid || "",
      userName: standup.user ? `${standup.user.firstName} ${standup.user.lastName}` : "Unknown",
      teamName: (standup.team?.teamName || "Unknown Team") + " · ",
      dateStr: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      timeStr: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      moodScore: standup.sentimentScore || 3,
      hasBlocker: !!standup.blockers,
      blockerClass: standup.blockers ? "has-blocker" : "",
      donePreview: truncateText(standup.whatDone, 60)
    };
  });

  return renderComponents("standup/feedItem", feedData);
}

/**
 * Attach feed time filter listener
 */
function attachFeedFilterListener(standups) {
  const filterContainer = document.getElementById("feeds-filter");
  if (!filterContainer) return;

  const buttons = filterContainer.querySelectorAll(".feeds-filter-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", async () => {
      // Update active state
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const days = parseInt(btn.dataset.days, 10);
      const feedsList = document.getElementById("feeds-list");
      const feedsCount = document.getElementById("feeds-count");

      if (feedsList) {
        feedsList.innerHTML = await renderCompactFeeds(standups, days);
        attachFeedClickListeners(feedsList);
      }

      if (feedsCount) {
        feedsCount.textContent = renderFeedsCount(standups, days);
      }
    });
  });
}

/**
 * Helper: Render feeds count text
 */
function renderFeedsCount(standups, days) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const count = standups.filter(s => new Date(s.dateSubmitted) >= cutoff).length;
  return `${count} standup${count !== 1 ? "s" : ""}`;
}

/**
 * Attach click listeners to feed items
 */
function attachFeedClickListeners(container) {
  const items = container.querySelectorAll(".feed-item[data-user-id]");
  items.forEach(item => {
    item.addEventListener("click", () => {
      const userUuid = item.dataset.userId;
      const userName = item.dataset.userName;
      if (userUuid) {
        navigateToView("history", { userUuid, userName });
      }
    });
  });
}

/**
 * Helper: Truncate text
 */
function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

