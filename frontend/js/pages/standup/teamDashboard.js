/**
 * @fileoverview Team Dashboard View
 * Displays team standup activity and analytics with Chart.js
 */

import { getTeamStandups } from "../../api/standupApi.js";
import { getActiveCourse, getUserTeams, isProfessorOrTA } from "../../utils/userContext.js";
import { renderComponent, renderComponents } from "../../utils/componentLoader.js";
import { loadTemplate } from "../../utils/templateLoader.js";
import { navigateBack, navigateToView } from "./courseIntegration.js";

// Store chart instances to destroy them before re-rendering
const chartInstances = {};

// Store data for chart interactions and standup lookups
let teamData = {
  standups: [],
  members: {},
  dates: [],
  standupMap: {} // Map standupUuid to full standup for modal display
};

// Color palette for member charts (20 distinct colors)
const MEMBER_COLORS = [
  "#99FF66", // radioactive-lime
  "#4ECDC4", // teal
  "#66CC99", // mint green
  "#FFD93D", // golden yellow
  "#FF8C42", // orange
  "#95E1D3", // soft aqua
  "#C9B1FF", // lavender
  "#FF6B6B", // coral
  "#66D9EF", // sky blue
  "#A8E6CF", // pale green
  "#F7B267", // peach
  "#7FDBFF", // bright cyan
  "#B4F8C8", // mint
  "#FFADAD", // salmon pink
  "#9BF6FF", // ice blue
  "#DDA0DD", // plum
  "#E2F0CB", // light lime
  "#FEC89A", // apricot
  "#87CEEB", // sky
  "#98D8C8" // seafoam
];

/**
 * Render the team dashboard view
 * @param {HTMLElement} container - Container to render into
 * @param {Object} params - Optional parameters (e.g., teamUuid)
 */
export async function render(container, params = {}) {
  const activeCourse = getActiveCourse();
  const userTeams = getUserTeams();
  const isTA = isProfessorOrTA();

  // Determine which team to show
  let selectedTeamId = params.teamUuid;
  const courseTeams = userTeams.filter(t => t.courseUuid === activeCourse?.courseUuid);

  if (!selectedTeamId && courseTeams.length > 0) {
    selectedTeamId = courseTeams[0].teamUuid;
  }

  // If no team selected and not TA, show empty state
  if (!selectedTeamId && !isTA) {
    container.innerHTML = await renderComponent("standup/emptyState", {
      icon: "👥",
      title: "No Team Found",
      text: "You are not currently assigned to any team in this course."
    });
    return;
  }

  // Load page template
  const pageHTML = await loadTemplate("standup", "teamDashboard");
  container.innerHTML = pageHTML;

  // Load Chart.js
  await loadChartJs();

  // Render breadcrumb navigation for TAs
  if (isTA && params.teamUuid) {
    const headerActions = document.getElementById("team-header-actions");
    if (headerActions) {
      const breadcrumb = document.createElement("div");
      breadcrumb.className = "breadcrumb-nav";
      breadcrumb.innerHTML = `
        <button class="breadcrumb-link" id="back-to-overview">← TA Overview</button>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">${params.teamName || "Team"}</span>
      `;
      headerActions.prepend(breadcrumb);

      document.getElementById("back-to-overview")?.addEventListener("click", () => {
        navigateBack();
      });
    }
  }

  // Render team selector for students with multiple teams
  const teamSelectPlaceholder = document.getElementById("team-selector-placeholder");
  if (teamSelectPlaceholder) {
    if (isTA) {
      teamSelectPlaceholder.style.display = "none";
    } else if (courseTeams.length > 1) {
      const teamSelectHTML = await renderComponent("standup/teamSelector", {
        teams: courseTeams.map(team => ({
          ...team,
          selected: team.teamUuid === selectedTeamId
        }))
      });
      teamSelectPlaceholder.outerHTML = teamSelectHTML;

      document.getElementById("team-select")?.addEventListener("change", (e) => {
        loadTeamData(e.target.value);
      });
    } else {
      teamSelectPlaceholder.style.display = "none";
    }
  }

  // Load team data
  if (selectedTeamId) {
    await loadTeamData(selectedTeamId);
  } else {
    container.innerHTML = await renderComponent("standup/error", {
      message: "Team not found."
    });
  }
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
 * Load team data and render dashboard
 * @param {string} teamUuid - Team UUID
 */
async function loadTeamData(teamUuid) {
  const contentDiv = document.getElementById("team-content");
  const teamNameDisplay = document.getElementById("team-name-display");

  try {
    contentDiv.innerHTML = "<div class=\"loading-message\">Loading team analytics...</div>";

    // Get last 14 days for better trend data
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const standups = await getTeamStandups(teamUuid, { startDate, endDate });

    // Update team name
    if (standups.length > 0 && standups[0].team) {
      if (teamNameDisplay) teamNameDisplay.textContent = standups[0].team.teamName;
    }

    // Process data
    const members = groupStandupsByMember(standups);
    const stats = calculateTeamStats(standups, members);
    const dates = [...new Set(standups.map(s => s.dateSubmitted.split("T")[0]))].sort().slice(-7);

    // Build standup lookup map for modal display
    const standupMap = {};
    standups.forEach(s => {
      standupMap[s.standupUuid] = s;
    });

    // Store for chart interactions and standup lookups
    teamData = { standups, members, dates, standupMap };

    // Render dashboard structure using template
    const dashboardHTML = await renderComponent("standup/teamDashboardContent", {
      memberHint: "Click a member to view their standup history",
      feedsCount: renderFeedsCount(standups, 7)
    });
    contentDiv.innerHTML = dashboardHTML;

    // Render metric cards
    const metricsRow = document.getElementById("metrics-row");
    if (metricsRow) {
      const metricsData = [
        { label: "Team Members", value: stats.totalMembers, subtext: "Active this period", metricKey: "members" },
        { label: "Submissions", value: stats.totalSubmissions, subtext: "Last 14 days", metricKey: "submissions" },
        { label: "Avg Sentiment", value: stats.avgSentiment, subtext: "Team mood", metricKey: "sentiment" },
        { label: "Blockers", value: stats.totalBlockers, subtext: "Need attention", metricKey: "blockers" }
      ];
      metricsRow.innerHTML = await renderComponents("standup/metricCard", metricsData);
    }

    // Render member cards
    const memberGrid = document.getElementById("member-grid");
    if (memberGrid) {
      if (Object.keys(members).length > 0) {
        const memberData = Object.values(members).map((m, i) => prepareMemberCardData(m, i));
        memberGrid.innerHTML = await renderComponents("standup/memberCard", memberData);
      } else {
        memberGrid.innerHTML = "<div class=\"empty-state-inline\">No member activity in this period</div>";
      }
    }

    // Render initial feeds
    const feedsList = document.getElementById("team-feeds-list");
    if (feedsList) {
      feedsList.innerHTML = await renderCompactFeeds(standups, 7);
    }

    // Initialize charts
    initializeCharts();

    // Attach listeners
    attachChartToggleListeners();
    attachMetricListeners();
    attachFeedFilterListener(standups);
    attachMemberClickListeners(); // Click member to view their standups
    attachFeedClickListeners(document.getElementById("team-feeds-list")); // Click feeds to see detail

  } catch (error) {
    contentDiv.innerHTML = `<div class="error-message">Failed to load team data: ${error.message}</div>`;
  }
}

/**
 * Prepare member card data for template
 */
function prepareMemberCardData(member, index) {
  const { user, standups } = member;
  standups.sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted));

  const latest = standups[0];
  const streak = calculateStreak(standups);
  const hasBlocker = latest?.blockers;
  const avgSentiment = standups.length > 0
    ? (standups.reduce((sum, s) => sum + (s.sentimentScore || 0), 0) / standups.length).toFixed(1)
    : "N/A";

  return {
    userUuid: user.userUuid,
    userName: `${user.firstName} ${user.lastName}`,
    clickableClass: "clickable", // Always clickable for all team members
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
    statusClass: !latest ? "status-inactive" : (hasBlocker ? "status-blocked" : "status-active"),
    statusText: !latest ? "Inactive" : (hasBlocker ? "Blocked" : "Active"),
    submissionCount: standups.length,
    avgSentiment,
    hasStreak: streak > 0,
    streakDisplay: streak > 0 ? `🔥 ${streak}` : "",
    hasLatest: !!latest,
    latestDate: latest ? new Date(latest.dateSubmitted).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
    latestMood: latest ? (latest.sentimentScore || 3) : "",
    hasBlocker: !!hasBlocker
  };
}

/**
 * Initialize all charts
 */
function initializeCharts() {
  renderSubmissionChart(false);
  renderSentimentChart(false);
  renderMemberSubmissionsChart();
  renderMemberSentimentChart();
}

/**
 * Attach chart toggle listeners
 */
function attachChartToggleListeners() {
  document.getElementById("submissionToggle")?.addEventListener("change", (e) => {
    renderSubmissionChart(e.target.checked);
  });

  document.getElementById("sentimentToggle")?.addEventListener("change", (e) => {
    renderSentimentChart(e.target.checked);
  });
}

/**
 * Attach metric card click listeners
 */
function attachMetricListeners() {
  const cards = document.querySelectorAll(".metric-card");
  const expansionArea = document.getElementById("metrics-expansion");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const metricKey = card.dataset.metric;
      const metricLabel = card.dataset.label;
      const isExpanded = card.classList.contains("expanded");

      if (isExpanded) {
        card.classList.remove("expanded");
        const panel = expansionArea.querySelector(`[data-metric="${metricKey}"]`);
        if (panel) panel.remove();
        if (chartInstances[metricKey]) {
          chartInstances[metricKey].destroy();
          delete chartInstances[metricKey];
        }
      } else {
        card.classList.add("expanded");
        const panel = document.createElement("div");
        panel.className = "metric-expanded";
        panel.dataset.metric = metricKey;
        panel.innerHTML = `
          <div class="metric-expanded-header">
            <span class="metric-expanded-title">${metricLabel} by Member</span>
            <button class="metric-expanded-close" data-metric="${metricKey}">×</button>
          </div>
          <div class="metric-expanded-chart">
            <canvas id="chart-${metricKey}"></canvas>
          </div>
        `;
        expansionArea.appendChild(panel);

        panel.querySelector(".metric-expanded-close").addEventListener("click", (e) => {
          e.stopPropagation();
          card.classList.remove("expanded");
          panel.remove();
          if (chartInstances[metricKey]) {
            chartInstances[metricKey].destroy();
            delete chartInstances[metricKey];
          }
        });

        setTimeout(() => renderMetricChart(metricKey), 50);
      }
    });
  });
}

/**
 * Attach member card click listeners (for TAs)
 */
function attachMemberClickListeners() {
  const cards = document.querySelectorAll(".member-card.clickable");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const userUuid = card.dataset.userId;
      const userName = card.dataset.userName;
      if (userUuid) {
        navigateToView("history", { userUuid, userName });
      }
    });
  });
}

/**
 * Render submission chart (team-level or per-member)
 */
function renderSubmissionChart(byMember = false) {
  const ctx = document.getElementById("submissionChart");
  if (!ctx) return;

  if (chartInstances.submission) {
    chartInstances.submission.destroy();
  }

  const { standups, members, dates } = teamData;
  const labels = dates.map(d => d.slice(5));

  let datasets;
  if (byMember) {
    datasets = Object.values(members).map((member, i) => {
      const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
      const data = dates.map(date =>
        member.standups.filter(s => s.dateSubmitted.startsWith(date)).length
      );
      return {
        label: `${member.user.firstName} ${member.user.lastName.charAt(0)}.`,
        data,
        borderColor: color,
        backgroundColor: color + "33",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: color
      };
    });
  } else {
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
    options: getChartOptions(byMember)
  });
}

/**
 * Render sentiment chart (team-level or per-member)
 */
function renderSentimentChart(byMember = false) {
  const ctx = document.getElementById("sentimentChart");
  if (!ctx) return;

  if (chartInstances.sentiment) {
    chartInstances.sentiment.destroy();
  }

  const { standups, members, dates } = teamData;
  const labels = dates.map(d => d.slice(5));

  let datasets;
  if (byMember) {
    datasets = Object.values(members).map((member, i) => {
      const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
      const data = dates.map(date => {
        const dayStandups = member.standups.filter(s =>
          s.dateSubmitted.startsWith(date) && s.sentimentScore
        );
        if (dayStandups.length === 0) return null;
        return (dayStandups.reduce((sum, s) => sum + s.sentimentScore, 0) / dayStandups.length).toFixed(1);
      });
      return {
        label: `${member.user.firstName} ${member.user.lastName.charAt(0)}.`,
        data,
        borderColor: color,
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 4,
        pointBackgroundColor: color
      };
    });
  } else {
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
      ...getChartOptions(byMember),
      scales: {
        ...getChartOptions(byMember).scales,
        y: { ...getChartOptions(byMember).scales.y, min: 1, max: 5 }
      }
    }
  });
}

/**
 * Render member submissions bar chart
 */
function renderMemberSubmissionsChart() {
  const ctx = document.getElementById("memberSubmissionsChart");
  if (!ctx) return;

  if (chartInstances.memberSubmissions) {
    chartInstances.memberSubmissions.destroy();
  }

  const { members } = teamData;
  const memberList = Object.values(members);
  const labels = memberList.map(m => `${m.user.firstName} ${m.user.lastName.charAt(0)}.`);
  const data = memberList.map(m => m.standups.length);
  const colors = memberList.map((_, i) => MEMBER_COLORS[i % MEMBER_COLORS.length]);

  chartInstances.memberSubmissions = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Submissions",
        data,
        backgroundColor: colors,
        borderColor: "#052B08",
        borderWidth: 1
      }]
    },
    options: {
      ...getChartOptions(false),
      indexAxis: "y",
      plugins: { legend: { display: false } }
    }
  });
}

/**
 * Render member sentiment bar chart
 */
function renderMemberSentimentChart() {
  const ctx = document.getElementById("memberSentimentChart");
  if (!ctx) return;

  if (chartInstances.memberSentiment) {
    chartInstances.memberSentiment.destroy();
  }

  const { members } = teamData;
  const memberList = Object.values(members);
  const labels = memberList.map(m => `${m.user.firstName} ${m.user.lastName.charAt(0)}.`);
  const data = memberList.map(m => {
    const withSentiment = m.standups.filter(s => s.sentimentScore);
    if (withSentiment.length === 0) return 0;
    return (withSentiment.reduce((sum, s) => sum + s.sentimentScore, 0) / withSentiment.length).toFixed(1);
  });
  const colors = memberList.map((_, i) => MEMBER_COLORS[i % MEMBER_COLORS.length]);

  chartInstances.memberSentiment = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Avg Sentiment",
        data,
        backgroundColor: colors,
        borderColor: "#052B08",
        borderWidth: 1
      }]
    },
    options: {
      ...getChartOptions(false),
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        ...getChartOptions(false).scales,
        x: { ...getChartOptions(false).scales.x, min: 0, max: 5 }
      }
    }
  });
}

/**
 * Render metric expansion chart
 */
function renderMetricChart(metricKey) {
  const ctx = document.getElementById(`chart-${metricKey}`);
  if (!ctx) return;

  if (chartInstances[metricKey]) {
    chartInstances[metricKey].destroy();
  }

  const { members } = teamData;
  const memberList = Object.values(members);
  const labels = memberList.map(m => `${m.user.firstName} ${m.user.lastName.charAt(0)}.`);
  const colors = memberList.map((_, i) => MEMBER_COLORS[i % MEMBER_COLORS.length]);

  let data;
  switch (metricKey) {
  case "members":
  case "submissions":
    data = memberList.map(m => m.standups.length);
    break;
  case "sentiment":
    data = memberList.map(m => {
      const withSentiment = m.standups.filter(s => s.sentimentScore);
      if (withSentiment.length === 0) return 0;
      return (withSentiment.reduce((sum, s) => sum + s.sentimentScore, 0) / withSentiment.length).toFixed(1);
    });
    break;
  case "blockers":
    data = memberList.map(m => m.standups.filter(s => s.blockers).length);
    break;
  default:
    data = memberList.map(m => m.standups.length);
  }

  chartInstances[metricKey] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: metricKey,
        data,
        backgroundColor: colors,
        borderColor: "#052B08",
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
          text: "Breakdown by Member",
          color: "#052B08",
          font: { family: "Monaco", size: 14 }
        }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: "#D3FBD6" }, ticks: { font: { family: "Monaco" } } },
        x: { grid: { display: false }, ticks: { font: { family: "Monaco" } } }
      }
    }
  });
}

/**
 * Common chart options
 */
function getChartOptions(showLegend = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: "bottom",
        labels: { boxWidth: 12, padding: 8, font: { family: "Monaco", size: 10 } }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "Monaco" } } },
      y: { beginAtZero: true, grid: { color: "#D3FBD6" }, ticks: { font: { family: "Monaco" } } }
    }
  };
}

/**
 * Group standups by member
 */
function groupStandupsByMember(standups) {
  const members = {};
  standups.forEach(standup => {
    if (!standup.user) return;
    const userId = standup.user.userUuid;
    if (!members[userId]) {
      members[userId] = { user: standup.user, standups: [] };
    }
    members[userId].standups.push(standup);
  });
  return members;
}

/**
 * Calculate team stats
 */
function calculateTeamStats(standups, members) {
  const totalMembers = Object.keys(members).length;
  const totalSubmissions = standups.length;
  const withSentiment = standups.filter(s => s.sentimentScore);
  const avgSentiment = withSentiment.length > 0
    ? (withSentiment.reduce((sum, s) => sum + s.sentimentScore, 0) / withSentiment.length).toFixed(1)
    : "N/A";
  const totalBlockers = standups.filter(s => s.blockers).length;

  return { totalMembers, totalSubmissions, avgSentiment, totalBlockers };
}

/**
 * Calculate submission streak
 */
function calculateStreak(standups) {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const hasSubmission = standups.some(s => s.dateSubmitted.startsWith(dateStr));
    if (hasSubmission) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Render compact feed items for team dashboard
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
      standupUuid: standup.standupUuid,
      userUuid: standup.user?.userUuid || "",
      userName: standup.user ? `${standup.user.firstName} ${standup.user.lastName}` : "Unknown",
      teamName: "",
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
 * Render feeds count text
 */
function renderFeedsCount(standups, days) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const count = standups.filter(s => new Date(s.dateSubmitted) >= cutoff).length;
  return `${count} standup${count !== 1 ? "s" : ""}`;
}

/**
 * Attach feed filter listener for team dashboard
 */
function attachFeedFilterListener(standups) {
  const filterContainer = document.getElementById("team-feeds-filter");
  if (!filterContainer) return;

  const buttons = filterContainer.querySelectorAll(".feeds-filter-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", async () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const days = parseInt(btn.dataset.days, 10);
      const feedsList = document.getElementById("team-feeds-list");
      const feedsCount = document.getElementById("team-feeds-count");

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
 * Attach click listeners to feed items to show standup detail modal
 */
function attachFeedClickListeners(container) {
  if (!container) return;

  const items = container.querySelectorAll(".feed-item[data-standup-id]");
  items.forEach(item => {
    item.addEventListener("click", () => {
      const standupId = item.dataset.standupId;
      if (standupId && teamData.standupMap[standupId]) {
        showStandupDetailModal(teamData.standupMap[standupId]);
      }
    });
  });
}

/**
 * Show standup detail modal (uses history card format)
 */
function showStandupDetailModal(standup) {
  const date = new Date(standup.dateSubmitted);
  const userName = standup.user ? `${standup.user.firstName} ${standup.user.lastName}` : "Unknown";
  const hasBlocker = !!standup.blockers;
  const moodScore = standup.sentimentScore || 3;

  const overlay = document.createElement("div");
  overlay.className = "confirm-modal-overlay";
  overlay.innerHTML = `
    <div class="confirm-modal standup-detail-modal">
      <div class="confirm-modal-header">
        <h3 class="confirm-modal-title">${userName}'s Standup</h3>
      </div>
      <div class="standup-detail-content">
        <div class="history-card ${hasBlocker ? "has-blocker" : ""}">
          <div class="history-card-header">
            <div class="history-card-left">
              <div class="mood-indicator mood-${moodScore}">
                <svg class="mood-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path class="mood-mouth"/>
                  <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/>
                  <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"/>
                </svg>
                <span class="mood-score">${moodScore}</span>
              </div>
              <div class="history-date-info">
                <span class="history-date">${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                <span class="history-time">${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
              </div>
            </div>
            <div class="history-card-right">
              <span class="history-team">${standup.team?.teamName || ""}</span>
              ${hasBlocker ? "<span class=\"history-blocker-badge\">Blocker</span>" : ""}
            </div>
          </div>
          <div class="history-card-body">
            <div class="history-field">
              <span class="history-field-label">Done:</span>
              <span class="history-field-text">${standup.whatDone || ""}</span>
            </div>
            <div class="history-field">
              <span class="history-field-label">Next:</span>
              <span class="history-field-text">${standup.whatNext || ""}</span>
            </div>
            ${hasBlocker ? `
            <div class="history-field blocker">
              <span class="history-field-label">Blocker:</span>
              <span class="history-field-text">${standup.blockers}</span>
            </div>
            ` : ""}
            ${standup.reflection ? `
            <div class="history-field">
              <span class="history-field-label">Reflection:</span>
              <span class="history-field-text">${standup.reflection}</span>
            </div>
            ` : ""}
          </div>
        </div>
      </div>
      <div class="confirm-modal-actions">
        <button class="confirm-modal-btn confirm">Close</button>
      </div>
    </div>
  `;

  const closeModal = () => overlay.remove();

  overlay.querySelector(".confirm-modal-btn").addEventListener("click", closeModal);

  // Close on overlay click (outside modal)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  // Close on Escape key
  const handleKeydown = (e) => {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", handleKeydown);
      closeModal();
    }
  };
  document.addEventListener("keydown", handleKeydown);

  document.body.appendChild(overlay);
}

/**
 * Helper: Truncate text
 */
function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}
