// Standup Form Page - Student submits daily standup
// NO STYLING - Pure HTML elements only

import { currentUser, getGithubActivityByUser, mockTeams } from "./mockData.js";

export function renderStandupForm(containerId) {
  const container = document.getElementById(containerId);

  // Clear container
  container.innerHTML = "";

  // Header
  const header = document.createElement("h1");
  header.textContent = "Daily Standup";
  container.appendChild(header);

  // User info
  const userInfo = document.createElement("p");
  userInfo.textContent = `Logged in as: ${currentUser.name} (${currentUser.email})`;
  container.appendChild(userInfo);

  // Date info
  const dateInfo = document.createElement("p");
  dateInfo.textContent = `Date: ${new Date().toLocaleDateString()}`;
  container.appendChild(dateInfo);

  // Form
  const form = document.createElement("form");
  form.id = "standup-form";

  // Question 1: What did you accomplish yesterday?
  const q1Label = document.createElement("label");
  q1Label.textContent = "1. What did you accomplish yesterday?";
  form.appendChild(q1Label);

  form.appendChild(document.createElement("br"));

  const q1Textarea = document.createElement("textarea");
  q1Textarea.id = "what-done";
  q1Textarea.name = "what-done";
  q1Textarea.rows = 5;
  q1Textarea.cols = 80;
  q1Textarea.placeholder = "Describe what you accomplished...";
  form.appendChild(q1Textarea);

  form.appendChild(document.createElement("br"));
  form.appendChild(document.createElement("br"));

  // GitHub status and auto-populate button
  if (!currentUser.github_connected) {
    const githubWarning = document.createElement("p");
    githubWarning.textContent = "⚠️ GitHub not connected. Connect your GitHub account to auto-populate activity.";
    form.appendChild(githubWarning);

    const connectBtn = document.createElement("button");
    connectBtn.type = "button";
    connectBtn.textContent = "Connect GitHub Account";
    connectBtn.onclick = () => {
      alert("Would redirect to GitHub OAuth (mock action)");
    };
    form.appendChild(connectBtn);
  } else {
    // Show GitHub org info
    const team = mockTeams.find(t => t.team_uuid === "team-001");
    const githubInfo = document.createElement("p");
    githubInfo.textContent = `GitHub connected: @${currentUser.github_username} | Team org: ${team.github_org}`;
    form.appendChild(githubInfo);

    // GitHub auto-populate button
    const githubBtn = document.createElement("button");
    githubBtn.type = "button";
    githubBtn.textContent = "Auto-populate from GitHub (last 24h)";
    githubBtn.onclick = () => {
      const activities = getGithubActivityByUser(currentUser.user_uuid, 24);

      if (activities.length === 0) {
        q1Textarea.value = "No GitHub activity in the last 24 hours.";
        return;
      }

      let content = "GitHub Activity (last 24h):\n\n";

      // Group by type
      const commits = activities.filter(a => a.activity_type === "commit");
      const prs = activities.filter(a => a.activity_type === "pull_request");
      const reviews = activities.filter(a => a.activity_type === "review");
      const issues = activities.filter(a => a.activity_type === "issue");

      if (commits.length > 0) {
        content += "Commits:\n";
        commits.forEach(activity => {
          const hoursAgo = Math.floor((Date.now() - new Date(activity.timestamp)) / (1000 * 60 * 60));
          content += `  ✓ ${activity.data.sha}: ${activity.data.message} (${activity.repo_name}) - ${hoursAgo}h ago - +${activity.data.additions}/-${activity.data.deletions} lines\n`;
        });
        content += "\n";
      }

      if (prs.length > 0) {
        content += "Pull Requests:\n";
        prs.forEach(activity => {
          const hoursAgo = Math.floor((Date.now() - new Date(activity.timestamp)) / (1000 * 60 * 60));
          content += `  ✓ PR #${activity.data.number}: ${activity.data.title} (${activity.repo_name}) - ${activity.data.state.toUpperCase()} - ${hoursAgo}h ago\n`;
        });
        content += "\n";
      }

      if (reviews.length > 0) {
        content += "Code Reviews:\n";
        reviews.forEach(activity => {
          const hoursAgo = Math.floor((Date.now() - new Date(activity.timestamp)) / (1000 * 60 * 60));
          content += `  ✓ Reviewed PR #${activity.data.pr_number}: ${activity.data.pr_title} (${activity.repo_name}) - ${activity.data.review_state.toUpperCase()} - ${hoursAgo}h ago\n`;
        });
        content += "\n";
      }

      if (issues.length > 0) {
        content += "Issues:\n";
        issues.forEach(activity => {
          const hoursAgo = Math.floor((Date.now() - new Date(activity.timestamp)) / (1000 * 60 * 60));
          content += `  ✓ Issue #${activity.data.number}: ${activity.data.title} (${activity.repo_name}) - ${activity.data.action.toUpperCase()} - ${hoursAgo}h ago\n`;
        });
        content += "\n";
      }

      content += "\n[You can edit above or add non-code work below]";

      q1Textarea.value = content;
    };
    form.appendChild(githubBtn);
  }

  form.appendChild(document.createElement("br"));
  form.appendChild(document.createElement("br"));

  // Question 2: What will you work on today?
  const q2Label = document.createElement("label");
  q2Label.textContent = "2. What will you work on today?";
  form.appendChild(q2Label);

  form.appendChild(document.createElement("br"));

  const q2Textarea = document.createElement("textarea");
  q2Textarea.id = "what-next";
  q2Textarea.name = "what-next";
  q2Textarea.rows = 5;
  q2Textarea.cols = 80;
  q2Textarea.placeholder = "Describe your plans for today...";
  form.appendChild(q2Textarea);

  form.appendChild(document.createElement("br"));
  form.appendChild(document.createElement("br"));

  // Question 3: Any blockers?
  const q3Label = document.createElement("label");
  q3Label.textContent = "3. Any blockers?";
  form.appendChild(q3Label);

  form.appendChild(document.createElement("br"));

  const q3Textarea = document.createElement("textarea");
  q3Textarea.id = "blockers";
  q3Textarea.name = "blockers";
  q3Textarea.rows = 3;
  q3Textarea.cols = 80;
  q3Textarea.placeholder = "Describe any blockers (leave empty if none)...";
  form.appendChild(q3Textarea);

  form.appendChild(document.createElement("br"));
  form.appendChild(document.createElement("br"));

  // Reflection (optional)
  const reflectionLabel = document.createElement("label");
  reflectionLabel.textContent = "Personal reflection (optional):";
  form.appendChild(reflectionLabel);

  form.appendChild(document.createElement("br"));

  const reflectionTextarea = document.createElement("textarea");
  reflectionTextarea.id = "reflection";
  reflectionTextarea.name = "reflection";
  reflectionTextarea.rows = 3;
  reflectionTextarea.cols = 80;
  reflectionTextarea.placeholder = "How are you feeling about the project?";
  form.appendChild(reflectionTextarea);

  form.appendChild(document.createElement("br"));
  form.appendChild(document.createElement("br"));

  // Sentiment emoji selector
  const sentimentLabel = document.createElement("label");
  sentimentLabel.textContent = "How are you feeling today?";
  form.appendChild(sentimentLabel);

  form.appendChild(document.createElement("br"));

  const sentiments = [
    { emoji: "😄", score: 1.0, label: "Very Happy" },
    { emoji: "😊", score: 0.7, label: "Happy" },
    { emoji: "🙂", score: 0.5, label: "Good" },
    { emoji: "😐", score: 0.0, label: "Neutral" },
    { emoji: "😕", score: -0.3, label: "Concerned" },
    { emoji: "😞", score: -0.7, label: "Sad" }
  ];

  const sentimentDiv = document.createElement("div");
  sentimentDiv.id = "sentiment-selector";

  let selectedSentiment = null;

  sentiments.forEach(sentiment => {
    const radioInput = document.createElement("input");
    radioInput.type = "radio";
    radioInput.name = "sentiment";
    radioInput.value = sentiment.score;
    radioInput.id = `sentiment-${sentiment.score}`;

    const radioLabel = document.createElement("label");
    radioLabel.htmlFor = `sentiment-${sentiment.score}`;
    radioLabel.textContent = `${sentiment.emoji} ${sentiment.label}`;

    radioInput.onchange = () => {
      selectedSentiment = {
        score: sentiment.score,
        emoji: sentiment.emoji
      };
    };

    sentimentDiv.appendChild(radioInput);
    sentimentDiv.appendChild(radioLabel);
    sentimentDiv.appendChild(document.createElement("br"));
  });

  form.appendChild(sentimentDiv);

  form.appendChild(document.createElement("br"));

  // Visibility selector
  const visibilityLabel = document.createElement("label");
  visibilityLabel.textContent = "Who can see this standup?";
  form.appendChild(visibilityLabel);

  form.appendChild(document.createElement("br"));

  const visibilitySelect = document.createElement("select");
  visibilitySelect.id = "visibility";
  visibilitySelect.name = "visibility";

  ["Team", "Instructor", "Private"].forEach(vis => {
    const option = document.createElement("option");
    option.value = vis;
    option.textContent = vis;
    if (vis === "Team") option.selected = true;
    visibilitySelect.appendChild(option);
  });

  form.appendChild(visibilitySelect);

  form.appendChild(document.createElement("br"));
  form.appendChild(document.createElement("br"));

  // Buttons
  const saveDraftBtn = document.createElement("button");
  saveDraftBtn.type = "button";
  saveDraftBtn.textContent = "Save Draft";
  saveDraftBtn.onclick = () => {
    alert("Draft saved! (mock action)");
  };
  form.appendChild(saveDraftBtn);

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Submit Standup";
  form.appendChild(submitBtn);

  // Form submit handler
  form.onsubmit = (e) => {
    e.preventDefault();

    /* eslint-disable camelcase */
    // Using snake_case to match database schema
    const formData = {
      what_done: q1Textarea.value,
      what_next: q2Textarea.value,
      blockers: q3Textarea.value,
      reflection: reflectionTextarea.value,
      sentiment_score: selectedSentiment?.score || 0,
      sentiment_emoji: selectedSentiment?.emoji || "😐",
      visibility: visibilitySelect.value,
      date_submitted: new Date().toISOString()
    };
    /* eslint-enable camelcase */

    // Standup submitted (mock - would send to backend)
    alert(`Standup submitted successfully!\n\nSentiment: ${formData.sentiment_emoji}\nVisibility: ${formData.visibility}`);

    // Clear form
    form.reset();
  };

  container.appendChild(form);

  // Display submission time estimate
  const timeEstimate = document.createElement("p");
  timeEstimate.textContent = "Estimated time to complete: < 2 minutes";
  container.appendChild(timeEstimate);
}
