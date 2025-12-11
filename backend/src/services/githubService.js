/**
 * GitHub Service
 *
 * Fetches GitHub activity (commits, PRs, reviews) for standup auto-populate.
 * @module github/service
 */
import fetch from "node-fetch";
import * as userRepository from "../repositories/userRepository.js";

/**
 * Fetch recent GitHub activity for a user
 * @param {string} userUuid - User UUID
 * @param {number} hours - Number of hours to look back (default: 24)
 * @returns {Promise<Object>} Activity data with commits, PRs, reviews
 */
async function fetchUserActivity(userUuid, hours = 24) {
  const user = await userRepository.getUserByUuid(userUuid);

  if (!user || !user.githubAccessToken) {
    throw new Error("GitHub not connected");
  }

  const accessToken = user.githubAccessToken;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Conductor-Tool"
  };

  try {
    // Fetch user's recent events (commits, PRs, etc.)
    const eventsRes = await fetch(
      `https://api.github.com/users/${user.githubUsername}/events?per_page=100`,
      { headers }
    );

    if (!eventsRes.ok) {
      if (eventsRes.status === 401) {
        throw new Error("GitHub token expired");
      }
      throw new Error(`GitHub API error: ${eventsRes.status}`);
    }

    const events = await eventsRes.json();

    // Filter events by time
    const sinceDate = new Date(since);
    const recentEvents = events.filter(e => new Date(e.created_at) >= sinceDate);

    // Process events into activity categories
    const activity = {
      commits: [],
      pullRequests: [],
      reviews: [],
      issues: []
    };

    for (const event of recentEvents) {
      const repoName = event.repo?.name || "unknown";

      switch (event.type) {
      case "PushEvent":
        // Extract commits from push events
        for (const commit of event.payload?.commits || []) {
          activity.commits.push({
            repo: repoName,
            sha: commit.sha?.substring(0, 7),
            fullSha: commit.sha,
            message: commit.message?.split("\n")[0], // First line only
            timestamp: event.created_at,
            url: `https://github.com/${repoName}/commit/${commit.sha}`
          });
        }
        break;

      case "PullRequestEvent":
        activity.pullRequests.push({
          repo: repoName,
          number: event.payload?.pull_request?.number,
          title: event.payload?.pull_request?.title,
          action: event.payload?.action, // opened, closed, merged
          timestamp: event.created_at,
          url: event.payload?.pull_request?.html_url || `https://github.com/${repoName}/pull/${event.payload?.pull_request?.number}`
        });
        break;

      case "PullRequestReviewEvent":
        activity.reviews.push({
          repo: repoName,
          prNumber: event.payload?.pull_request?.number,
          state: event.payload?.review?.state, // approved, commented, changes_requested
          timestamp: event.created_at,
          url: event.payload?.review?.html_url || event.payload?.pull_request?.html_url || `https://github.com/${repoName}/pull/${event.payload?.pull_request?.number}`
        });
        break;

      case "IssuesEvent":
        activity.issues.push({
          repo: repoName,
          number: event.payload?.issue?.number,
          title: event.payload?.issue?.title,
          action: event.payload?.action, // opened, closed
          timestamp: event.created_at,
          url: event.payload?.issue?.html_url || `https://github.com/${repoName}/issues/${event.payload?.issue?.number}`
        });
        break;
      }
    }

    return {
      githubUsername: user.githubUsername,
      period: { hours, since },
      activity,
      summary: {
        totalCommits: activity.commits.length,
        totalPRs: activity.pullRequests.length,
        totalReviews: activity.reviews.length,
        totalIssues: activity.issues.length
      }
    };

  } catch (error) {
    throw error;
  }
}

/**
 * Format GitHub activity as text for standup auto-populate
 * @param {string} userUuid - User UUID
 * @param {number} hours - Number of hours to look back
 * @returns {Promise<string>} Formatted text for "What done" field
 */
async function getFormattedActivity(userUuid, hours = 24) {
  const data = await fetchUserActivity(userUuid, hours);
  const lines = [];

  // Format commits
  if (data.activity.commits.length > 0) {
    lines.push("**Commits:**");
    for (const commit of data.activity.commits.slice(0, 10)) { // Limit to 10
      const shortRepo = commit.repo.split("/").pop();
      lines.push(`- [${shortRepo}] ${commit.message}`);
    }
    if (data.activity.commits.length > 10) {
      lines.push(`- ... and ${data.activity.commits.length - 10} more commits`);
    }
  }

  // Format PRs
  if (data.activity.pullRequests.length > 0) {
    lines.push("");
    lines.push("**Pull Requests:**");
    for (const pr of data.activity.pullRequests) {
      const shortRepo = pr.repo.split("/").pop();
      const action = pr.action === "opened" ? "Opened" : pr.action === "closed" ? "Closed" : pr.action;
      lines.push(`- [${shortRepo}] #${pr.number}: ${pr.title} (${action})`);
    }
  }

  // Format reviews
  if (data.activity.reviews.length > 0) {
    lines.push("");
    lines.push("**Reviews:**");
    for (const review of data.activity.reviews) {
      const shortRepo = review.repo.split("/").pop();
      const state = review.state === "approved" ? "Approved" :
        review.state === "changes_requested" ? "Requested changes" : "Commented";
      lines.push(`- [${shortRepo}] Reviewed PR #${review.prNumber} (${state})`);
    }
  }

  // Format issues
  if (data.activity.issues.length > 0) {
    lines.push("");
    lines.push("**Issues:**");
    for (const issue of data.activity.issues) {
      const shortRepo = issue.repo.split("/").pop();
      const action = issue.action === "opened" ? "Opened" : "Closed";
      lines.push(`- [${shortRepo}] #${issue.number}: ${issue.title} (${action})`);
    }
  }

  if (lines.length === 0) {
    return "No GitHub activity in the last " + hours + " hours.";
  }

  return lines.join("\n");
}

export { fetchUserActivity, getFormattedActivity };
