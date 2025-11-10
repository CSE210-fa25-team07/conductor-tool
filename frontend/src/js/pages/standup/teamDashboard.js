// Team Dashboard Page - Shows team members' standups
// NO STYLING - Pure HTML elements only

import {
  currentUser,
  mockTeams,
  getStandupsByTeam,
  getUserById,
  getCommentsByStandup,
  mockComments
} from './mockData.js';

export function renderTeamDashboard(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // Header
  const header = document.createElement('h1');
  header.textContent = 'Team Dashboard';
  container.appendChild(header);

  // User info
  const userInfo = document.createElement('p');
  userInfo.textContent = `Logged in as: ${currentUser.name}`;
  container.appendChild(userInfo);

  // Team selector
  const teamSelectorLabel = document.createElement('label');
  teamSelectorLabel.textContent = 'Select Team: ';
  container.appendChild(teamSelectorLabel);

  const teamSelect = document.createElement('select');
  teamSelect.id = 'team-selector';

  mockTeams.forEach(team => {
    const option = document.createElement('option');
    option.value = team.team_uuid;
    option.textContent = team.name;
    teamSelect.appendChild(option);
  });

  teamSelect.onchange = () => {
    renderTeamStandups(container, teamSelect.value);
  };

  container.appendChild(teamSelect);
  container.appendChild(document.createElement('br'));
  container.appendChild(document.createElement('br'));

  // Dashboard content container
  const dashboardContent = document.createElement('div');
  dashboardContent.id = 'dashboard-content';
  container.appendChild(dashboardContent);

  // Initial render
  renderTeamStandups(container, mockTeams[0].team_uuid);
}

function renderTeamStandups(container, teamId) {
  const dashboardContent = document.getElementById('dashboard-content');
  dashboardContent.innerHTML = '';

  const team = mockTeams.find(t => t.team_uuid === teamId);
  const standups = getStandupsByTeam(teamId);

  // Team name
  const teamHeader = document.createElement('h2');
  teamHeader.textContent = `${team.name} - Recent Standups`;
  dashboardContent.appendChild(teamHeader);

  // Filter by date
  const filterLabel = document.createElement('label');
  filterLabel.textContent = 'Filter by date: ';
  dashboardContent.appendChild(filterLabel);

  const dateFilter = document.createElement('input');
  dateFilter.type = 'date';
  dateFilter.value = new Date().toISOString().split('T')[0];
  dashboardContent.appendChild(dateFilter);

  const filterBtn = document.createElement('button');
  filterBtn.textContent = 'Filter';
  filterBtn.onclick = () => {
    alert(`Filtering by date: ${dateFilter.value} (mock action)`);
  };
  dashboardContent.appendChild(filterBtn);

  dashboardContent.appendChild(document.createElement('br'));
  dashboardContent.appendChild(document.createElement('br'));

  // Sentiment trend summary
  const sentimentSummary = document.createElement('div');
  sentimentSummary.innerHTML = '<h3>7-Day Sentiment Trend</h3>';

  const avgSentiment = standups.reduce((sum, s) => sum + s.sentiment_score, 0) / standups.length;
  const avgText = document.createElement('p');
  avgText.textContent = `Average team sentiment: ${avgSentiment.toFixed(2)} (${avgSentiment > 0.5 ? 'Positive' : avgSentiment > 0 ? 'Neutral' : 'Negative'})`;
  sentimentSummary.appendChild(avgText);

  const trendMock = document.createElement('p');
  trendMock.textContent = '[MOCK CHART: Line graph showing sentiment over 7 days would appear here]';
  sentimentSummary.appendChild(trendMock);

  dashboardContent.appendChild(sentimentSummary);

  dashboardContent.appendChild(document.createElement('hr'));

  // Active blockers section
  const blockersSection = document.createElement('div');
  blockersSection.innerHTML = '<h3>Active Blockers</h3>';

  const activeBlockers = standups.filter(s => s.blockers && s.blockers.trim() !== '');

  if (activeBlockers.length === 0) {
    const noBlockers = document.createElement('p');
    noBlockers.textContent = 'No active blockers!';
    blockersSection.appendChild(noBlockers);
  } else {
    activeBlockers.forEach(standup => {
      const user = getUserById(standup.user_uuid);
      const blockerDiv = document.createElement('div');
      blockerDiv.innerHTML = `<strong>BLOCKER from ${user.name}:</strong>`;

      const blockerText = document.createElement('p');
      blockerText.textContent = standup.blockers;
      blockerDiv.appendChild(blockerText);

      const helpBtn = document.createElement('button');
      helpBtn.textContent = 'I can help!';
      helpBtn.onclick = () => {
        alert(`You offered to help ${user.name} with their blocker! (mock action - would add comment and notify user)`);
      };
      blockerDiv.appendChild(helpBtn);

      const escalateBtn = document.createElement('button');
      escalateBtn.textContent = 'Escalate to TA';
      escalateBtn.onclick = () => {
        alert(`Blocker escalated to TA! (mock action - would send notification to TA)`);
      };
      blockerDiv.appendChild(escalateBtn);

      const timeInfo = document.createElement('p');
      const hoursSince = Math.floor((new Date() - new Date(standup.date_submitted)) / (1000 * 60 * 60));
      timeInfo.textContent = `Posted ${hoursSince} hours ago ${hoursSince >= 4 ? '⚠️ AUTO-ESCALATION PENDING' : ''}`;
      blockerDiv.appendChild(timeInfo);

      blockerDiv.appendChild(document.createElement('hr'));
      blockersSection.appendChild(blockerDiv);
    });
  }

  dashboardContent.appendChild(blockersSection);

  dashboardContent.appendChild(document.createElement('hr'));

  // All standups
  const standupsHeader = document.createElement('h3');
  standupsHeader.textContent = 'All Team Standups';
  dashboardContent.appendChild(standupsHeader);

  if (standups.length === 0) {
    const noStandups = document.createElement('p');
    noStandups.textContent = 'No standups submitted yet.';
    dashboardContent.appendChild(noStandups);
  } else {
    // Sort by date (most recent first)
    const sortedStandups = [...standups].sort((a, b) =>
      new Date(b.date_submitted) - new Date(a.date_submitted)
    );

    sortedStandups.forEach(standup => {
      const standupCard = createStandupCard(standup);
      dashboardContent.appendChild(standupCard);
      dashboardContent.appendChild(document.createElement('hr'));
    });
  }

  // Missing submissions section
  const missingSection = document.createElement('div');
  missingSection.innerHTML = '<h3>Missing Submissions</h3>';

  const missingText = document.createElement('p');
  missingText.textContent = '[MOCK: Would show team members who haven\'t submitted today]';
  missingSection.appendChild(missingText);

  dashboardContent.appendChild(missingSection);
}

function createStandupCard(standup) {
  const user = getUserById(standup.user_uuid);
  const comments = getCommentsByStandup(standup.standup_uuid);

  const card = document.createElement('div');

  // Header
  const cardHeader = document.createElement('h4');
  cardHeader.textContent = `${user.name} - ${new Date(standup.date_submitted).toLocaleString()}`;
  card.appendChild(cardHeader);

  // Sentiment
  const sentiment = document.createElement('p');
  sentiment.textContent = `Sentiment: ${standup.sentiment_emoji} (${standup.sentiment_score})`;
  card.appendChild(sentiment);

  // What done
  const whatDoneLabel = document.createElement('strong');
  whatDoneLabel.textContent = 'What they accomplished:';
  card.appendChild(whatDoneLabel);
  card.appendChild(document.createElement('br'));

  const whatDoneText = document.createElement('p');
  whatDoneText.textContent = standup.what_done;
  card.appendChild(whatDoneText);

  // What next
  const whatNextLabel = document.createElement('strong');
  whatNextLabel.textContent = 'What they\'re working on next:';
  card.appendChild(whatNextLabel);
  card.appendChild(document.createElement('br'));

  const whatNextText = document.createElement('p');
  whatNextText.textContent = standup.what_next;
  card.appendChild(whatNextText);

  // Blockers (if any)
  if (standup.blockers && standup.blockers.trim() !== '') {
    const blockersLabel = document.createElement('strong');
    blockersLabel.textContent = '🚨 BLOCKERS:';
    card.appendChild(blockersLabel);
    card.appendChild(document.createElement('br'));

    const blockersText = document.createElement('p');
    blockersText.textContent = standup.blockers;
    card.appendChild(blockersText);
  }

  // Reflection (if any)
  if (standup.reflection && standup.reflection.trim() !== '') {
    const reflectionLabel = document.createElement('strong');
    reflectionLabel.textContent = 'Reflection:';
    card.appendChild(reflectionLabel);
    card.appendChild(document.createElement('br'));

    const reflectionText = document.createElement('p');
    reflectionText.textContent = standup.reflection;
    card.appendChild(reflectionText);
  }

  // Comments section
  const commentsHeader = document.createElement('strong');
  commentsHeader.textContent = `Comments (${comments.length}):`;
  card.appendChild(commentsHeader);
  card.appendChild(document.createElement('br'));

  if (comments.length > 0) {
    comments.forEach(comment => {
      const commenter = getUserById(comment.commenter_uuid);
      const commentDiv = document.createElement('div');

      const commentAuthor = document.createElement('em');
      commentAuthor.textContent = `${commenter.name} - ${new Date(comment.created_at).toLocaleString()}:`;
      commentDiv.appendChild(commentAuthor);
      commentDiv.appendChild(document.createElement('br'));

      const commentText = document.createElement('p');
      commentText.textContent = comment.comment_text;
      commentDiv.appendChild(commentText);

      card.appendChild(commentDiv);
    });
  }

  // Add comment form
  const addCommentLabel = document.createElement('label');
  addCommentLabel.textContent = 'Add a comment:';
  card.appendChild(addCommentLabel);
  card.appendChild(document.createElement('br'));

  const commentInput = document.createElement('textarea');
  commentInput.rows = 2;
  commentInput.cols = 60;
  commentInput.placeholder = 'Write a comment...';
  card.appendChild(commentInput);
  card.appendChild(document.createElement('br'));

  const submitCommentBtn = document.createElement('button');
  submitCommentBtn.textContent = 'Add Comment';
  submitCommentBtn.onclick = () => {
    if (commentInput.value.trim()) {
      // Mock adding comment
      mockComments.push({
        comment_uuid: `comment-${Date.now()}`,
        standup_uuid: standup.standup_uuid,
        commenter_uuid: currentUser.user_uuid,
        comment_text: commentInput.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      alert('Comment added! (mock action - page would refresh)');
      commentInput.value = '';
    }
  };
  card.appendChild(submitCommentBtn);

  return card;
}
