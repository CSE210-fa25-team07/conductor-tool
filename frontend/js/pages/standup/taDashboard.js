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
let chartData = {
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
      <!-- Key Metrics Section -->
      <section class="dashboard-section">
        <div class="section-header">
          <h3 class="section-title">Key Metrics</h3>
          <div class="section-divider"></div>
        </div>
        <div class="metrics-row">
          ${renderMetricCard("Active Students", stats.activeStudents, "Students submitting", "activeStudents")}
          ${renderMetricCard("Submission Rate", `${stats.submissionRate}%`, "Last 7 days", "submissionRate")}
          ${renderMetricCard("Avg Sentiment", stats.avgSentiment, "Scale 1-5", "avgSentiment")}
          ${renderMetricCard("Blockers", stats.totalBlockers, "Reported this week", "blockers")}
        </div>
        <div class="metrics-expansion" id="metrics-expansion">
          <!-- Expanded metric charts will be inserted here -->
        </div>
      </section>

      <!-- Trends Section -->
      <section class="dashboard-section">
        <div class="section-header">
          <h3 class="section-title">Trends</h3>
          <div class="section-divider"></div>
        </div>
        <div class="charts-row">
          <div class="chart-container">
            <div class="chart-header">
              <h4 class="chart-title">Submission Activity</h4>
              <label class="chart-toggle">
                <input type="checkbox" id="submissionToggle" />
                <span class="toggle-label">By Team</span>
              </label>
            </div>
            <div class="chart-wrapper">
              <canvas id="submissionChart"></canvas>
            </div>
          </div>
          <div class="chart-container">
            <div class="chart-header">
              <h4 class="chart-title">Sentiment Trend</h4>
              <label class="chart-toggle">
                <input type="checkbox" id="sentimentToggle" />
                <span class="toggle-label">By Team</span>
              </label>
            </div>
            <div class="chart-wrapper">
              <canvas id="sentimentChart"></canvas>
            </div>
          </div>
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

    // Initialize Charts
    initializeCharts(standups, teamGroups);

    // Render feeds asynchronously
    const feedsList = document.getElementById("feeds-list");
    if (feedsList) {
      feedsList.innerHTML = await renderCompactFeeds(standups, 7);
    }

    // Attach Listeners
    attachTeamCardListeners(contentDiv);
    attachMetricListeners(contentDiv, teamGroups);
    attachChartToggleListeners();
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
 * Attach listeners to metric cards for expansion
 * Allows multiple cards to be expanded simultaneously
 */
function attachMetricListeners(container, teamGroups) {
  const cards = container.querySelectorAll(".metric-card");
  const expansionArea = container.querySelector("#metrics-expansion");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const metricKey = card.dataset.metric;
      const metricLabel = card.dataset.label;
      const isExpanded = card.classList.contains("expanded");

      if (isExpanded) {
        // Collapse: remove expanded class and remove chart panel
        card.classList.remove("expanded");
        const panel = expansionArea.querySelector(`[data-metric="${metricKey}"]`);
        if (panel) {
          panel.remove();
        }
        if (chartInstances[metricKey]) {
          chartInstances[metricKey].destroy();
          delete chartInstances[metricKey];
        }
      } else {
        // Expand: add expanded class and create chart panel
        card.classList.add("expanded");
        const panel = document.createElement("div");
        panel.className = "metric-expanded";
        panel.dataset.metric = metricKey;
        panel.innerHTML = `
          <div class="metric-expanded-header">
            <span class="metric-expanded-title">${metricLabel} by Team</span>
            <button class="metric-expanded-close" data-metric="${metricKey}">×</button>
          </div>
          <div class="metric-expanded-chart">
            <canvas id="chart-${metricKey}"></canvas>
          </div>
        `;
        expansionArea.appendChild(panel);

        // Add close button listener
        panel.querySelector(".metric-expanded-close").addEventListener("click", (e) => {
          e.stopPropagation();
          card.classList.remove("expanded");
          panel.remove();
          if (chartInstances[metricKey]) {
            chartInstances[metricKey].destroy();
            delete chartInstances[metricKey];
          }
        });

        // Render chart
        setTimeout(() => {
          renderMetricChart(metricKey, teamGroups);
        }, 50);
      }
    });
  });
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
 * Render chart for expanded metric card
 */
function renderMetricChart(metricKey, teamGroups) {
  const ctx = document.getElementById(`chart-${metricKey}`);
  if (!ctx) return;

  const data = getMetricDataPerTeam(metricKey, teamGroups);

  // Destroy existing if any (safety check)
  if (chartInstances[metricKey]) {
    chartInstances[metricKey].destroy();
  }

  // Generate colors array - one color per team
  const backgroundColors = data.labels.map((_, i) => TEAM_COLORS[i % TEAM_COLORS.length]);

  chartInstances[metricKey] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [{
        label: metricKey,
        data: data.values,
        backgroundColor: backgroundColors,
        borderColor: "#052B08", // forest-green
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Breakdown by Team",
          color: "#052B08",
          font: { family: "Monaco", size: 14 }
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
          ticks: { font: { family: "Monaco" } }
        }
      }
    }
  });
}

/**
 * Get data for per-team charts
 */
function getMetricDataPerTeam(metricKey, teamGroups) {
  const labels = [];
  const values = [];

  Object.values(teamGroups).forEach(group => {
    labels.push(group.team.teamName);

    switch (metricKey) {
    case "activeStudents":
      values.push(group.users.size);
      break;
    case "submissionRate":
      // Approx: submissions / (members * 5) * 100
      // Using 5 as expected submissions per week per member
      // This is a rough estimate for the demo
      const expected = group.users.size * 5 || 1;
      const rate = Math.min(100, Math.round((group.standups.length / expected) * 100));
      values.push(rate);
      break;
    case "avgSentiment":
      const sentiments = group.standups.filter(s => s.sentimentScore).map(s => s.sentimentScore);
      const avg = sentiments.length > 0
        ? (sentiments.reduce((a, b) => a + b, 0) / sentiments.length).toFixed(1)
        : 0;
      values.push(avg);
      break;
    case "blockers":
      const blockerCount = group.standups.filter(s => s.blockers).length;
      values.push(blockerCount);
      break;
    }
  });

  return { labels, values };
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
 * Initialize Chart.js instances
 */
function initializeCharts(standups, teamGroups) {
  // Store data for toggle functionality
  const dates = [...new Set(standups.map(s => s.dateSubmitted.split("T")[0]))].sort().slice(-7);
  chartData = { standups, teamGroups, dates };

  // Render charts in class-level mode (default)
  renderSubmissionChart(false);
  renderSentimentChart(false);
}

/**
 * Attach toggle listeners for chart view switching
 */
function attachChartToggleListeners() {
  const subToggle = document.getElementById("submissionToggle");
  const sentToggle = document.getElementById("sentimentToggle");

  if (subToggle) {
    subToggle.addEventListener("change", (e) => {
      renderSubmissionChart(e.target.checked);
    });
  }

  if (sentToggle) {
    sentToggle.addEventListener("change", (e) => {
      renderSentimentChart(e.target.checked);
    });
  }
}

/**
 * Common chart options
 */
function getCommonChartOptions(showLegend = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { family: "Monaco", size: 10 }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "Monaco" } }
      },
      y: {
        beginAtZero: true,
        grid: { color: "#D3FBD6" },
        ticks: { font: { family: "Monaco" } }
      }
    }
  };
}

/**
 * Render Submission Chart (class-level or per-team)
 */
function renderSubmissionChart(byTeam = false) {
  const ctx = document.getElementById("submissionChart");
  if (!ctx) return;

  // Destroy existing chart
  if (chartInstances.submission) {
    chartInstances.submission.destroy();
  }

  const { standups, teamGroups, dates } = chartData;
  const labels = dates.map(d => d.slice(5)); // MM-DD

  let datasets;
  if (byTeam) {
    // Per-team view: one line per team
    datasets = Object.values(teamGroups).map((group, i) => {
      const color = TEAM_COLORS[i % TEAM_COLORS.length];
      const data = dates.map(date =>
        group.standups.filter(s => s.dateSubmitted.startsWith(date)).length
      );
      return {
        label: group.team.teamName,
        data,
        borderColor: color,
        backgroundColor: color + "33", // 20% opacity
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: color
      };
    });
  } else {
    // Class-level view: single aggregated line
    const submissionData = dates.map(date =>
      standups.filter(s => s.dateSubmitted.startsWith(date)).length
    );
    datasets = [{
      label: "Submissions",
      data: submissionData,
      borderColor: "#052B08",
      backgroundColor: "rgba(153, 255, 102, 0.2)",
      borderWidth: 2,
      tension: 0.3,
      fill: true,
      pointBackgroundColor: "#FFFFFF",
      pointBorderColor: "#052B08"
    }];
  }

  chartInstances.submission = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: getCommonChartOptions(byTeam)
  });
}

/**
 * Render Sentiment Chart (class-level or per-team)
 */
function renderSentimentChart(byTeam = false) {
  const ctx = document.getElementById("sentimentChart");
  if (!ctx) return;

  // Destroy existing chart
  if (chartInstances.sentiment) {
    chartInstances.sentiment.destroy();
  }

  const { standups, teamGroups, dates } = chartData;
  const labels = dates.map(d => d.slice(5));

  let datasets;
  const baseOptions = getCommonChartOptions(byTeam);

  if (byTeam) {
    // Per-team view: one line per team
    datasets = Object.values(teamGroups).map((group, i) => {
      const color = TEAM_COLORS[i % TEAM_COLORS.length];
      const data = dates.map(date => {
        const dayStandups = group.standups.filter(s =>
          s.dateSubmitted.startsWith(date) && s.sentimentScore
        );
        if (dayStandups.length === 0) return null;
        return (dayStandups.reduce((sum, s) => sum + s.sentimentScore, 0) / dayStandups.length).toFixed(1);
      });
      return {
        label: group.team.teamName,
        data,
        borderColor: color,
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 4,
        pointBackgroundColor: color
      };
    });
  } else {
    // Class-level view: single aggregated line
    const sentimentData = dates.map(date => {
      const dayStandups = standups.filter(s =>
        s.dateSubmitted.startsWith(date) && s.sentimentScore
      );
      if (dayStandups.length === 0) return null;
      return (dayStandups.reduce((sum, s) => sum + s.sentimentScore, 0) / dayStandups.length).toFixed(1);
    });
    datasets = [{
      label: "Avg Sentiment",
      data: sentimentData,
      borderColor: "#052B08",
      borderWidth: 2,
      borderDash: [5, 5],
      tension: 0.1,
      pointRadius: 4,
      pointBackgroundColor: "#99FF66"
    }];
  }

  chartInstances.sentiment = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        y: { ...baseOptions.scales.y, min: 1, max: 5 }
      }
    }
  });
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
  const _totalStandups = standups.length;
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

