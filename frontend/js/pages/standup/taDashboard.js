// TA Multi-Team Dashboard - Shows overview of all teams
// NO STYLING - Pure HTML elements only

import {
  mockTeams,
  mockStandups,
  getUserById,
  getStandupsByTeam
} from "./mockData.js";

export function renderTADashboard(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // Header
  const header = document.createElement("h1");
  header.textContent = "TA Dashboard - Multi-Team Overview";
  container.appendChild(header);

  // TA info
  const taInfo = document.createElement("p");
  taInfo.textContent = "Logged in as: Eva Rodriguez (TA)";
  container.appendChild(taInfo);

  const dateInfo = document.createElement("p");
  dateInfo.textContent = `Date: ${new Date().toLocaleDateString()}`;
  container.appendChild(dateInfo);

  container.appendChild(document.createElement("hr"));

  // Priority alerts section
  renderPriorityAlerts(container);

  container.appendChild(document.createElement("hr"));

  // Team overview table
  renderTeamOverview(container);

  container.appendChild(document.createElement("hr"));

  // At-risk students section
  renderAtRiskStudents(container);

  container.appendChild(document.createElement("hr"));

  // Detailed team drill-down
  renderTeamDrillDown(container);
}

function renderPriorityAlerts(container) {
  const alertsSection = document.createElement("div");

  const alertsHeader = document.createElement("h2");
  alertsHeader.textContent = "🚨 Priority Alerts";
  alertsSection.appendChild(alertsHeader);

  // Active blockers
  const activeBlockers = mockStandups.filter(s => s.blockers && s.blockers.trim() !== "");

  const blockersHeader = document.createElement("h3");
  blockersHeader.textContent = `Active Blockers (${activeBlockers.length})`;
  alertsSection.appendChild(blockersHeader);

  if (activeBlockers.length === 0) {
    const noBlockers = document.createElement("p");
    noBlockers.textContent = "No active blockers!";
    alertsSection.appendChild(noBlockers);
  } else {
    const blockerList = document.createElement("ul");
    activeBlockers.forEach(standup => {
      const user = getUserById(standup.user_uuid);
      const team = mockTeams.find(t => t.team_uuid === standup.team_uuid);

      const listItem = document.createElement("li");

      const hoursSince = Math.floor((new Date() - new Date(standup.date_submitted)) / (1000 * 60 * 60));
      const isEscalated = hoursSince >= 4;

      listItem.textContent = `${isEscalated ? "⚠️ ESCALATED" : "🔴"} ${user.name} (${team.name}): ${standup.blockers} - ${hoursSince}h ago`;

      const viewBtn = document.createElement("button");
      viewBtn.textContent = "View Details";
      viewBtn.onclick = () => {
        alert(`Blocker details:\n\nStudent: ${user.name}\nTeam: ${team.name}\nBlocker: ${standup.blockers}\n\nTime: ${hoursSince} hours ago\nStatus: ${isEscalated ? "ESCALATED" : "Active"}`);
      };

      listItem.appendChild(document.createElement("br"));
      listItem.appendChild(viewBtn);

      blockerList.appendChild(listItem);
    });
    alertsSection.appendChild(blockerList);
  }

  // Sentiment drops
  const sentimentHeader = document.createElement("h3");
  sentimentHeader.textContent = "Recent Sentiment Drops";
  alertsSection.appendChild(sentimentHeader);

  const lowSentiment = mockStandups.filter(s => s.sentiment_score < 0);

  if (lowSentiment.length === 0) {
    const noDrops = document.createElement("p");
    noDrops.textContent = "No significant sentiment drops detected.";
    alertsSection.appendChild(noDrops);
  } else {
    const sentimentList = document.createElement("ul");
    lowSentiment.forEach(standup => {
      const user = getUserById(standup.user_uuid);
      const team = mockTeams.find(t => t.team_uuid === standup.team_uuid);

      const listItem = document.createElement("li");
      listItem.textContent = `${user.name} (${team.name}): ${standup.sentiment_emoji} Score: ${standup.sentiment_score}`;

      sentimentList.appendChild(listItem);
    });
    alertsSection.appendChild(sentimentList);
  }

  // Missing submissions
  const missingHeader = document.createElement("h3");
  missingHeader.textContent = "Missing Submissions (Today)";
  alertsSection.appendChild(missingHeader);

  const missingText = document.createElement("p");
  missingText.textContent = "[MOCK: Would show students who haven't submitted today]";
  alertsSection.appendChild(missingText);

  container.appendChild(alertsSection);
}

function renderTeamOverview(container) {
  const overviewSection = document.createElement("div");

  const overviewHeader = document.createElement("h2");
  overviewHeader.textContent = "Team Health Overview";
  overviewSection.appendChild(overviewHeader);

  // Create table
  const table = document.createElement("table");
  table.border = "1";

  // Table header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  ["Team Name", "Avg Sentiment", "Trend", "Active Blockers", "Participation %", "Status", "Actions"].forEach(header => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Table body
  const tbody = document.createElement("tbody");

  mockTeams.forEach(team => {
    const teamStandups = getStandupsByTeam(team.team_uuid);
    const avgSentiment = teamStandups.length > 0
      ? (teamStandups.reduce((sum, s) => sum + s.sentiment_score, 0) / teamStandups.length).toFixed(2)
      : "N/A";

    const activeBlockers = teamStandups.filter(s => s.blockers && s.blockers.trim() !== "").length;

    // Mock participation (in real app, would calculate based on team size)
    const participation = teamStandups.length > 0 ? "75%" : "0%";

    const trend = avgSentiment > 0.5 ? "↑" : avgSentiment > 0 ? "→" : "↓";
    const status = activeBlockers > 0 ? "⚠️ Needs Attention" : avgSentiment < 0 ? "⚠️ Low Morale" : "✅ Healthy";

    const row = document.createElement("tr");

    // Team name
    const nameCell = document.createElement("td");
    nameCell.textContent = team.name;
    row.appendChild(nameCell);

    // Avg sentiment
    const sentimentCell = document.createElement("td");
    sentimentCell.textContent = avgSentiment;
    row.appendChild(sentimentCell);

    // Trend
    const trendCell = document.createElement("td");
    trendCell.textContent = trend;
    row.appendChild(trendCell);

    // Active blockers
    const blockersCell = document.createElement("td");
    blockersCell.textContent = activeBlockers;
    row.appendChild(blockersCell);

    // Participation
    const participationCell = document.createElement("td");
    participationCell.textContent = participation;
    row.appendChild(participationCell);

    // Status
    const statusCell = document.createElement("td");
    statusCell.textContent = status;
    row.appendChild(statusCell);

    // Actions
    const actionsCell = document.createElement("td");
    const viewDetailsBtn = document.createElement("button");
    viewDetailsBtn.textContent = "View Team";
    viewDetailsBtn.onclick = () => {
      scrollToTeamDetails(team.team_uuid);
    };
    actionsCell.appendChild(viewDetailsBtn);
    row.appendChild(actionsCell);

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  overviewSection.appendChild(table);

  container.appendChild(overviewSection);
}

function renderAtRiskStudents(container) {
  const atRiskSection = document.createElement("div");

  const atRiskHeader = document.createElement("h2");
  atRiskHeader.textContent = "At-Risk Students (Auto-Detected)";
  atRiskSection.appendChild(atRiskHeader);

  const explanation = document.createElement("p");
  explanation.textContent = "Students detected as at-risk based on: low sentiment, unresolved blockers, or low participation";
  atRiskSection.appendChild(explanation);

  // Mock at-risk detection
  const atRiskStudents = mockStandups.filter(s =>
    s.sentiment_score < 0 || (s.blockers && s.blockers.trim() !== "")
  );

  if (atRiskStudents.length === 0) {
    const noRisk = document.createElement("p");
    noRisk.textContent = "No at-risk students detected!";
    atRiskSection.appendChild(noRisk);
  } else {
    const riskList = document.createElement("ul");

    // Get unique users
    const uniqueUsers = [...new Set(atRiskStudents.map(s => s.user_uuid))];

    uniqueUsers.forEach(userId => {
      const user = getUserById(userId);
      const userStandups = atRiskStudents.filter(s => s.user_uuid === userId);

      const listItem = document.createElement("li");

      const reasons = [];
      if (userStandups.some(s => s.sentiment_score < 0)) reasons.push("Low sentiment");
      if (userStandups.some(s => s.blockers && s.blockers.trim() !== "")) reasons.push("Active blocker");

      listItem.textContent = `${user.name} - Risk factors: ${reasons.join(", ")}`;

      const reachOutBtn = document.createElement("button");
      reachOutBtn.textContent = "Send Check-in Email";
      reachOutBtn.onclick = () => {
        alert(`Check-in email sent to ${user.name}! (mock action)`);
      };

      listItem.appendChild(document.createElement("br"));
      listItem.appendChild(reachOutBtn);

      riskList.appendChild(listItem);
    });

    atRiskSection.appendChild(riskList);
  }

  container.appendChild(atRiskSection);
}

function renderTeamDrillDown(container) {
  const drillDownSection = document.createElement("div");

  const drillDownHeader = document.createElement("h2");
  drillDownHeader.textContent = "Team Details Drill-Down";
  drillDownSection.appendChild(drillDownHeader);

  mockTeams.forEach(team => {
    const teamDiv = document.createElement("div");
    teamDiv.id = `team-details-${team.team_uuid}`;

    const teamHeader = document.createElement("h3");
    teamHeader.textContent = team.name;
    teamDiv.appendChild(teamHeader);

    const teamStandups = getStandupsByTeam(team.team_uuid);

    if (teamStandups.length === 0) {
      const noStandups = document.createElement("p");
      noStandups.textContent = "No standups submitted for this team yet.";
      teamDiv.appendChild(noStandups);
    } else {
      // Recent standups summary
      const recentHeader = document.createElement("h4");
      recentHeader.textContent = "Recent Activity:";
      teamDiv.appendChild(recentHeader);

      const summaryList = document.createElement("ul");

      const sortedStandups = [...teamStandups]
        .sort((a, b) => new Date(b.date_submitted) - new Date(a.date_submitted))
        .slice(0, 5); // Show last 5

      sortedStandups.forEach(standup => {
        const user = getUserById(standup.user_uuid);
        const listItem = document.createElement("li");
        listItem.textContent = `${user.name} - ${new Date(standup.date_submitted).toLocaleDateString()} - ${standup.sentiment_emoji}`;

        if (standup.blockers && standup.blockers.trim() !== "") {
          listItem.textContent += " 🚨 HAS BLOCKER";
        }

        summaryList.appendChild(listItem);
      });

      teamDiv.appendChild(summaryList);

      const viewFullBtn = document.createElement("button");
      viewFullBtn.textContent = "View Full Team Dashboard";
      viewFullBtn.onclick = () => {
        alert(`Would navigate to full team dashboard for ${team.name} (mock action)`);
      };
      teamDiv.appendChild(viewFullBtn);
    }

    teamDiv.appendChild(document.createElement("hr"));
    drillDownSection.appendChild(teamDiv);
  });

  container.appendChild(drillDownSection);
}

function scrollToTeamDetails(teamId) {
  const element = document.getElementById(`team-details-${teamId}`);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}
