/**
 * @fileoverview Individual Student History - Shows personal standup history
 * NO STYLING - Pure HTML elements only
 * @module standup/individualHistory
 */

import {
  currentUser,
  getStandupsByUser,
  getGithubStatsByUser,
  getGithubActivityByUser
} from "./mockData.js";

/**
 * Renders the individual student's standup history and statistics
 * @function renderIndividualHistory
 * @param {string} containerId - ID of the container element to render into
 * @returns {void}
 */
export function renderIndividualHistory(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // Header
  const header = document.createElement("h1");
  header.textContent = "My Standup History";
  container.appendChild(header);

  // User info
  const userInfo = document.createElement("p");
  userInfo.textContent = `Logged in as: ${currentUser.name} (${currentUser.email})`;
  container.appendChild(userInfo);

  container.appendChild(document.createElement("hr"));

  // Filter controls
  renderFilters(container);

  container.appendChild(document.createElement("hr"));

  // Stats summary
  renderStatsSummary(container);

  container.appendChild(document.createElement("hr"));

  // GitHub activity stats
  renderGithubStats(container);

  container.appendChild(document.createElement("hr"));

  // Sentiment trend
  renderSentimentTrend(container);

  container.appendChild(document.createElement("hr"));

  // Standup history
  renderStandupHistory(container);
}

function renderFilters(container) {
  const filtersDiv = document.createElement("div");

  const filtersHeader = document.createElement("h3");
  filtersHeader.textContent = "Filter History";
  filtersDiv.appendChild(filtersHeader);

  // Date range filter
  const dateRangeLabel = document.createElement("label");
  dateRangeLabel.textContent = "Date Range: ";
  filtersDiv.appendChild(dateRangeLabel);

  const startDate = document.createElement("input");
  startDate.type = "date";
  startDate.id = "start-date";
  filtersDiv.appendChild(startDate);

  const toLabel = document.createElement("span");
  toLabel.textContent = " to ";
  filtersDiv.appendChild(toLabel);

  const endDate = document.createElement("input");
  endDate.type = "date";
  endDate.id = "end-date";
  endDate.value = new Date().toISOString().split("T")[0];
  filtersDiv.appendChild(endDate);

  filtersDiv.appendChild(document.createElement("br"));
  filtersDiv.appendChild(document.createElement("br"));

  // Sentiment filter
  const sentimentLabel = document.createElement("label");
  sentimentLabel.textContent = "Filter by Sentiment: ";
  filtersDiv.appendChild(sentimentLabel);

  const sentimentSelect = document.createElement("select");
  sentimentSelect.id = "sentiment-filter";

  ["All", "Positive (>0.5)", "Neutral (0 to 0.5)", "Negative (<0)"].forEach(option => {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    sentimentSelect.appendChild(opt);
  });

  filtersDiv.appendChild(sentimentSelect);

  filtersDiv.appendChild(document.createElement("br"));
  filtersDiv.appendChild(document.createElement("br"));

  // Blocker filter
  const blockerCheckbox = document.createElement("input");
  blockerCheckbox.type = "checkbox";
  blockerCheckbox.id = "blocker-filter";

  const blockerLabel = document.createElement("label");
  blockerLabel.htmlFor = "blocker-filter";
  blockerLabel.textContent = " Only show entries with blockers";

  filtersDiv.appendChild(blockerCheckbox);
  filtersDiv.appendChild(blockerLabel);

  filtersDiv.appendChild(document.createElement("br"));
  filtersDiv.appendChild(document.createElement("br"));

  // Apply filter button
  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Apply Filters";
  applyBtn.onclick = () => {
    alert("Filters applied! (mock action - would re-render with filtered data)");
  };
  filtersDiv.appendChild(applyBtn);

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset";
  resetBtn.onclick = () => {
    startDate.value = "";
    endDate.value = new Date().toISOString().split("T")[0];
    sentimentSelect.value = "All";
    blockerCheckbox.checked = false;
  };
  filtersDiv.appendChild(resetBtn);

  container.appendChild(filtersDiv);
}

function renderStatsSummary(container) {
  const statsDiv = document.createElement("div");

  const statsHeader = document.createElement("h3");
  statsHeader.textContent = "My Statistics";
  statsDiv.appendChild(statsHeader);

  const standups = getStandupsByUser(currentUser.user_uuid);

  // Total submissions
  const totalStat = document.createElement("p");
  totalStat.textContent = `Total Standups Submitted: ${standups.length}`;
  statsDiv.appendChild(totalStat);

  // Average sentiment
  if (standups.length > 0) {
    const avgSentiment = standups.reduce((sum, s) => sum + s.sentiment_score, 0) / standups.length;
    const avgStat = document.createElement("p");
    avgStat.textContent = `Average Sentiment Score: ${avgSentiment.toFixed(2)}`;
    statsDiv.appendChild(avgStat);

    // Blockers count
    const blockersCount = standups.filter(s => s.blockers && s.blockers.trim() !== "").length;
    const blockersStat = document.createElement("p");
    blockersStat.textContent = `Total Blockers Reported: ${blockersCount}`;
    statsDiv.appendChild(blockersStat);

    // Streak
    const streakStat = document.createElement("p");
    streakStat.textContent = "Current Streak: 5 days (mock)";
    statsDiv.appendChild(streakStat);

    // Participation rate
    const participationStat = document.createElement("p");
    participationStat.textContent = "Participation Rate: 85% (mock - based on expected submissions)";
    statsDiv.appendChild(participationStat);
  }

  container.appendChild(statsDiv);
}

function renderGithubStats(container) {
  const githubDiv = document.createElement("div");

  const githubHeader = document.createElement("h3");
  githubHeader.textContent = "My GitHub Activity";
  githubDiv.appendChild(githubHeader);

  if (!currentUser.github_connected) {
    const notConnected = document.createElement("p");
    notConnected.textContent = "⚠️ GitHub not connected. Connect your GitHub account to track coding activity.";
    githubDiv.appendChild(notConnected);

    const connectBtn = document.createElement("button");
    connectBtn.textContent = "Connect GitHub";
    connectBtn.onclick = () => {
      alert("Would redirect to GitHub OAuth flow (mock action)");
    };
    githubDiv.appendChild(connectBtn);
  } else {
    // GitHub username
    const usernameP = document.createElement("p");
    usernameP.textContent = `GitHub: @${currentUser.github_username}`;
    githubDiv.appendChild(usernameP);

    // Stats for different time periods
    [7, 30].forEach(days => {
      const periodHeader = document.createElement("h4");
      periodHeader.textContent = `Last ${days} Days`;
      githubDiv.appendChild(periodHeader);

      const stats = getGithubStatsByUser(currentUser.user_uuid, days);

      const statsList = document.createElement("ul");

      const commitsStat = document.createElement("li");
      commitsStat.textContent = `Commits: ${stats.total_commits} (+${stats.total_additions}/-${stats.total_deletions} lines)`;
      statsList.appendChild(commitsStat);

      const prsStat = document.createElement("li");
      prsStat.textContent = `Pull Requests: ${stats.prs_created} created, ${stats.prs_reviewed} reviewed`;
      statsList.appendChild(prsStat);

      const issuesStat = document.createElement("li");
      issuesStat.textContent = `Issues: ${stats.issues_opened} opened, ${stats.issues_commented} commented`;
      statsList.appendChild(issuesStat);

      githubDiv.appendChild(statsList);
    });

    // Recent activity feed
    const recentHeader = document.createElement("h4");
    recentHeader.textContent = "Recent Activity (Last 7 Days)";
    githubDiv.appendChild(recentHeader);

    const recentActivity = getGithubActivityByUser(currentUser.user_uuid, 24 * 7);

    if (recentActivity.length === 0) {
      const noActivity = document.createElement("p");
      noActivity.textContent = "No recent GitHub activity in the last 7 days.";
      githubDiv.appendChild(noActivity);
    } else {
      const activityList = document.createElement("ul");

      // Sort by timestamp, most recent first
      const sortedActivity = [...recentActivity].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      sortedActivity.slice(0, 10).forEach(activity => {
        const listItem = document.createElement("li");
        const timeAgo = Math.floor((Date.now() - new Date(activity.timestamp)) / (1000 * 60 * 60));

        let activityText = "";
        switch (activity.activity_type) {
        case "commit":
          activityText = `📝 Commit: ${activity.data.message} (+${activity.data.additions}/-${activity.data.deletions}) - ${activity.repo_name}`;
          break;
        case "pr_created":
          activityText = `🔀 Created PR: ${activity.data.title} - ${activity.repo_name}`;
          break;
        case "pr_reviewed":
          activityText = `👀 Reviewed PR #${activity.data.pr_number} - ${activity.repo_name}`;
          break;
        case "issue_opened":
          activityText = `🐛 Opened issue: ${activity.data.title} - ${activity.repo_name}`;
          break;
        case "issue_comment":
          activityText = `💬 Commented on issue #${activity.data.issue_number} - ${activity.repo_name}`;
          break;
        default:
          activityText = `${activity.activity_type} - ${activity.repo_name}`;
        }

        listItem.textContent = `${activityText} (${timeAgo}h ago)`;
        activityList.appendChild(listItem);
      });

      githubDiv.appendChild(activityList);

      if (recentActivity.length > 10) {
        const moreText = document.createElement("p");
        moreText.textContent = `... and ${recentActivity.length - 10} more activities`;
        githubDiv.appendChild(moreText);
      }
    }

    // Contribution trend mock
    const trendHeader = document.createElement("h4");
    trendHeader.textContent = "Contribution Trend (Last 30 Days)";
    githubDiv.appendChild(trendHeader);

    const trendMock = document.createElement("p");
    trendMock.textContent = "[MOCK: Contribution graph would appear here]";
    githubDiv.appendChild(trendMock);

    const trendAscii = document.createElement("pre");
    trendAscii.textContent = `
Commits per week:
Week 1: ████████░░ 8
Week 2: ██████████ 10
Week 3: ████░░░░░░ 4
Week 4: ██████████ 10
    `;
    githubDiv.appendChild(trendAscii);
  }

  container.appendChild(githubDiv);
}

function renderSentimentTrend(container) {
  const trendDiv = document.createElement("div");

  const trendHeader = document.createElement("h3");
  trendHeader.textContent = "My Sentiment Trend (Last 30 Days)";
  trendDiv.appendChild(trendHeader);

  const standups = getStandupsByUser(currentUser.user_uuid);

  if (standups.length === 0) {
    const noData = document.createElement("p");
    noData.textContent = "No data to display.";
    trendDiv.appendChild(noData);
  } else {
    // Mock chart
    const chartMock = document.createElement("p");
    chartMock.textContent = "[MOCK CHART: Line graph showing sentiment over time would appear here]";
    trendDiv.appendChild(chartMock);

    // Simple text representation
    const textTrend = document.createElement("pre");
    textTrend.textContent = `
Sentiment Trend (mock visualization):
  1.0 |     *
  0.8 |   *   *
  0.6 | *       *
  0.4 |
  0.2 |
  0.0 |___________
     Day 1  ...  Day 30
    `;
    trendDiv.appendChild(textTrend);
  }

  container.appendChild(trendDiv);
}

function renderStandupHistory(container) {
  const historyDiv = document.createElement("div");

  const historyHeader = document.createElement("h3");
  historyHeader.textContent = "Standup Entries";
  historyDiv.appendChild(historyHeader);

  const standups = getStandupsByUser(currentUser.user_uuid);

  if (standups.length === 0) {
    const noEntries = document.createElement("p");
    noEntries.textContent = "No standup entries found. Submit your first standup!";
    historyDiv.appendChild(noEntries);
  } else {
    // Sort by date (most recent first)
    const sortedStandups = [...standups].sort((a, b) =>
      new Date(b.date_submitted) - new Date(a.date_submitted)
    );

    sortedStandups.forEach(standup => {
      const entryCard = createHistoryCard(standup);
      historyDiv.appendChild(entryCard);
      historyDiv.appendChild(document.createElement("hr"));
    });
  }

  // Export button
  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export History (CSV)";
  exportBtn.onclick = () => {
    alert("Exporting standup history to CSV! (mock action)");
  };
  historyDiv.appendChild(exportBtn);

  container.appendChild(historyDiv);
}

function createHistoryCard(standup) {
  const card = document.createElement("div");

  // Header with date
  const cardHeader = document.createElement("h4");
  cardHeader.textContent = `Standup - ${new Date(standup.date_submitted).toLocaleString()}`;
  card.appendChild(cardHeader);

  // Sentiment
  const sentiment = document.createElement("p");
  sentiment.textContent = `Sentiment: ${standup.sentiment_emoji} (Score: ${standup.sentiment_score})`;
  card.appendChild(sentiment);

  // Visibility
  const visibility = document.createElement("p");
  visibility.textContent = `Visibility: ${standup.visibility}`;
  card.appendChild(visibility);

  // What done
  const whatDoneLabel = document.createElement("strong");
  whatDoneLabel.textContent = "What I accomplished:";
  card.appendChild(whatDoneLabel);
  card.appendChild(document.createElement("br"));

  const whatDoneText = document.createElement("p");
  whatDoneText.textContent = standup.what_done;
  card.appendChild(whatDoneText);

  // What next
  const whatNextLabel = document.createElement("strong");
  whatNextLabel.textContent = "What I worked on next:";
  card.appendChild(whatNextLabel);
  card.appendChild(document.createElement("br"));

  const whatNextText = document.createElement("p");
  whatNextText.textContent = standup.what_next;
  card.appendChild(whatNextText);

  // Blockers (if any)
  if (standup.blockers && standup.blockers.trim() !== "") {
    const blockersLabel = document.createElement("strong");
    blockersLabel.textContent = "🚨 Blockers:";
    card.appendChild(blockersLabel);
    card.appendChild(document.createElement("br"));

    const blockersText = document.createElement("p");
    blockersText.textContent = standup.blockers;
    card.appendChild(blockersText);
  }

  // Reflection (if any)
  if (standup.reflection && standup.reflection.trim() !== "") {
    const reflectionLabel = document.createElement("strong");
    reflectionLabel.textContent = "Reflection:";
    card.appendChild(reflectionLabel);
    card.appendChild(document.createElement("br"));

    const reflectionText = document.createElement("p");
    reflectionText.textContent = standup.reflection;
    card.appendChild(reflectionText);
  }

  // Action buttons
  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.onclick = () => {
    alert("Edit functionality (mock action - would open edit form)");
  };
  card.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.onclick = () => {
    if (confirm("Are you sure you want to delete this standup entry?")) {
      alert("Standup deleted! (mock action)");
    }
  };
  card.appendChild(deleteBtn);

  return card;
}
