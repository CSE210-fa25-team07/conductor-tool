/**
 * Group Profile View
 * Renders detailed information about a project team
 */

import { getTeamProfile } from "../../../api/directory/directoryApiMock.js";

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) {
    return "?";
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "?";
}

function renderTagList(tags) {
  if (!tags || tags.length === 0) {
    return "";
  }

  const tagChips = tags.map((tag) => `<span class="team-tag">${tag}</span>`).join("");
  return `<div class="team-tags">${tagChips}</div>`;
}

function renderResourceLinks(resources) {
  if (!resources || resources.length === 0) {
    return "";
  }

  const links = resources.map((resource) => {
    const label = resource.label || resource.url || "Resource";
    const target = resource.url ? `href="${resource.url}" target="_blank" rel="noopener noreferrer"` : "";
    return `<a ${target}>${label}</a>`;
  }).join("");

  return `<div class="team-links">${links}</div>`;
}

function renderStatus(teamInfo) {
  if (!teamInfo) {
    return "";
  }

  const health = teamInfo.status_health || "Unknown";
  const summary = teamInfo.status_summary || "No status summary available.";
  const updated = teamInfo.status_updated ? formatDate(teamInfo.status_updated) : null;

  return `
    <div class="team-status">
      <div class="status-header">
        <span class="status-pill">${health}</span>
        ${updated ? `<span class="note-date">Updated ${updated}</span>` : ""}
      </div>
      <p class="status-summary">${summary}</p>
    </div>
  `;
}

function renderMetrics(metrics = {}) {
  const entries = [];

  if (metrics.current_sprint) {
    entries.push({ label: "Current Sprint", value: metrics.current_sprint });
  }
  if (typeof metrics.story_points_completed === "number") {
    entries.push({ label: "Story Points", value: metrics.story_points_completed });
  }
  if (typeof metrics.velocity === "number") {
    entries.push({ label: "Velocity", value: metrics.velocity });
  }
  if (typeof metrics.bug_count === "number") {
    entries.push({ label: "Open Bugs", value: metrics.bug_count });
  }

  if (entries.length === 0) {
    return "";
  }

  const cards = entries.map((entry) => `
    <div class="metric-card">
      <div class="metric-value">${entry.value}</div>
      <div class="metric-label">${entry.label}</div>
    </div>
  `).join("");

  return `<div class="team-metrics">${cards}</div>`;
}

function renderMeetingSchedule(meetings) {
  if (!meetings || meetings.length === 0) {
    return "";
  }

  const items = meetings.map((meeting) => `
    <div class="meeting-item">
      <div class="meeting-header">
        <h3>${meeting.title || "Team Meeting"}</h3>
        <span class="meeting-date">${meeting.schedule || ""}</span>
      </div>
      ${meeting.description ? `<p class="meeting-summary">${meeting.description}</p>` : ""}
    </div>
  `).join("");

  return `
    <div class="card">
      <div class="section-title">Meeting Cadence</div>
      <div class="meeting-list">
        ${items}
      </div>
    </div>
  `;
}

function renderHero(profile) {
  const info = profile.team_info || {};
  const resources = profile.resources || [];

  return `
    <section class="card team-hero">
      <div>
        <h1>${info.team_name || "Project Team"}</h1>
        <div class="team-course">
          ${info.course_name ? `<span>${info.course_name}</span>` : ""}
          ${info.project_name ? `<span>${info.project_name}</span>` : ""}
        </div>
        ${info.summary ? `<p class="team-summary">${info.summary}</p>` : ""}
        ${info.mission ? `<p class="team-summary"><strong>Mission:</strong> ${info.mission}</p>` : ""}
        ${renderTagList(info.tags)}
        ${renderResourceLinks(resources)}
      </div>
      <div>
        ${renderStatus(info)}
        ${renderMetrics(profile.metrics)}
      </div>
    </section>
  `;
}

function renderMembers(members) {
  if (!members || members.length === 0) {
    return `
      <div class="card team-members">
        <div class="section-title">Team Members</div>
        <p class="placeholder">No members have been added yet.</p>
      </div>
    `;
  }

  const cards = members.map((member) => `
    <div class="member-card">
      <div class="member-avatar">${getInitials(member.name)}</div>
      <div>
        <div class="member-name">${member.name || "Team Member"}</div>
        ${member.role ? `<div class="member-role">${member.role}</div>` : ""}
        <div class="member-meta">
          ${member.pronouns ? `<span>Pronouns: ${member.pronouns}</span>` : ""}
          ${member.responsibilities ? `<span>${member.responsibilities}</span>` : ""}
          ${member.email ? `<span>Email: <a href="mailto:${member.email}">${member.email}</a></span>` : ""}
          ${member.github ? `<span>GitHub: <a href="https://github.com/${member.github}" target="_blank">@${member.github}</a></span>` : ""}
        </div>
      </div>
    </div>
  `).join("");

  return `
    <div class="card team-members">
      <div class="section-title">Team Members</div>
      <div class="member-list">
        ${cards}
      </div>
    </div>
  `;
}

function renderTimeline(entries, title, emptyMessage) {
  if (!entries || entries.length === 0) {
    return `
      <div class="card">
        <div class="section-title">${title}</div>
        <p class="placeholder">${emptyMessage}</p>
      </div>
    `;
  }

  const items = entries.map((entry) => `
    <div class="timeline-item">
      <div class="timeline-header">
        <h3>${entry.title || "Update"}</h3>
        <span class="timeline-date">${formatDate(entry.date)}</span>
      </div>
      ${entry.summary ? `<p class="timeline-summary">${entry.summary}</p>` : ""}
    </div>
  `).join("");

  return `
    <div class="card">
      <div class="section-title">${title}</div>
      <div class="timeline-list">
        ${items}
      </div>
    </div>
  `;
}

function renderMilestones(milestones) {
  if (!milestones || milestones.length === 0) {
    return `
      <div class="card">
        <div class="section-title">Upcoming Milestones</div>
        <p class="placeholder">No upcoming milestones have been scheduled.</p>
      </div>
    `;
  }

  const items = milestones.map((milestone) => `
    <div class="milestone-item">
      <div class="milestone-header">
        <h3>${milestone.title || "Milestone"}</h3>
        <span class="milestone-date">${formatDate(milestone.due_date)}</span>
      </div>
      <span class="milestone-status">${milestone.status || "Planned"}</span>
      ${milestone.summary ? `<p class="milestone-summary">${milestone.summary}</p>` : ""}
    </div>
  `).join("");

  return `
    <div class="card">
      <div class="section-title">Upcoming Milestones</div>
      <div class="milestone-list">
        ${items}
      </div>
    </div>
  `;
}

function renderStatusNotes(notes) {
  if (!notes || notes.length === 0) {
    return `
      <div class="card">
        <div class="section-title">Team Notes</div>
        <p class="placeholder">No internal notes recorded yet.</p>
      </div>
    `;
  }

  const items = notes.map((note) => {
    const sentimentClass = note.sentiment ? ` ${note.sentiment}` : "";
    return `
      <div class="note-item${sentimentClass}">
        <div class="note-header">
          <span><span class="note-author">${note.author || "Team Member"}</span>${note.mood || ""}</span>
          <span class="note-date">${formatDate(note.date)}</span>
        </div>
        <p class="note-body">${note.note || ""}</p>
      </div>
    `;
  }).join("");

  return `
    <div class="card">
      <div class="section-title">Team Notes</div>
      <div class="notes-list">
        ${items}
      </div>
    </div>
  `;
}

export async function renderGroupProfile(teamUuid, container) {
  try {
    container.innerHTML = "<div class=\"loading\">Loading team profile...</div>";

    const profile = await getTeamProfile(teamUuid);

    container.innerHTML = `
      <div class="team-profile">
        ${renderHero(profile)}
        <div class="team-grid">
          ${renderMembers(profile.members)}
          <div class="side-panel">
            ${renderTimeline(profile.recent_updates, "Recent Updates", "No updates have been shared yet.")}
            ${renderMilestones(profile.upcoming_milestones)}
            ${renderStatusNotes(profile.status_notes)}
            ${renderMeetingSchedule(profile.meeting_schedule)}
          </div>
        </div>
      </div>
    `;

    return profile;
  } catch (error) {
    container.innerHTML = `
      <div class="error-message">
        <h2>Unable to Load Team</h2>
        <p>${error.message || "We couldn't load the team profile right now. Please try again later."}</p>
        <a href="class-dashboard.html?course=test-course" class="btn btn-primary">Back to Dashboard</a>
      </div>
    `;
    return null;
  }
}

