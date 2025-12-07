/**
 * Participant and team loading helpers for the attendance dashboard.
 */

import { getAllCourseUsers, getCourseTeams } from "../../api/attendanceApi.js";
import { getCurrentUser } from "../../utils/userContext.js";
import { getCourseIdFromUrl } from "./utils.js";

export async function loadAllUsersAndTeams(ctx) {
  const courseUUID = getCourseIdFromUrl();
  if (!courseUUID) return;

  try {
    ctx.state.allUsers = await getAllCourseUsers(courseUUID) || [];
  } catch (error) {
    ctx.state.allUsers = [];
    ctx.els.participantsContainer.innerHTML = `<p style="color: #666; padding: 10px;">Unable to load participants: ${error.message}</p>`;
    return;
  }

  try {
    ctx.state.allTeams = await getCourseTeams(courseUUID) || [];
  } catch {
    ctx.state.allTeams = [];
  }

  populateTeamSelector(ctx);
  populateParticipantsContainer(ctx);
}

export function populateTeamSelector(ctx) {
  if (!ctx.els.selectByTeamDropdown) return;
  ctx.els.selectByTeamDropdown.innerHTML = "<option value=\"\">Add by Team...</option>";
  if (!ctx.state.allTeams?.length) return;

  ctx.state.allTeams.forEach(team => {
    const option = document.createElement("option");
    option.value = team.teamUuid;
    option.textContent = team.teamName || `Team ${team.teamUuid.substring(0, 8)}`;
    ctx.els.selectByTeamDropdown.appendChild(option);
  });
}

function formatUserNameWithRole(user) {
  const name = `${user.firstName} ${user.lastName}`;
  const role = user.role;
  if (role === "Professor") return `${name} (Prof)`;
  if (role === "TA") return `${name} (TA)`;
  return name;
}

function createParticipantCheckbox(user) {
  const label = document.createElement("label");
  label.classList.add("participant");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.value = user.userUuid;
  checkbox.dataset.userUuid = user.userUuid;

  const nameSpan = document.createElement("span");
  nameSpan.classList.add("participant-name");
  nameSpan.textContent = formatUserNameWithRole(user);

  label.appendChild(checkbox);
  label.appendChild(nameSpan);
  return label;
}

export function populateParticipantsContainer(ctx) {
  ctx.els.participantsContainer.innerHTML = "";

  if (!ctx.state.allUsers?.length) {
    ctx.els.participantsContainer.innerHTML = "<p style='padding: 10px; color: #666;'>No users found for this course.</p>";
    return;
  }

  const currentUser = getCurrentUser();
  const creatorUuid = currentUser?.userUuid;
  const availableUsers = creatorUuid
    ? ctx.state.allUsers.filter(user => user.userUuid !== creatorUuid)
    : ctx.state.allUsers;

  if (!availableUsers?.length) {
    ctx.els.participantsContainer.innerHTML = "<p style='padding: 10px; color: #666;'>No other users found for this course.</p>";
    return;
  }

  const usersByTeam = {};
  const usersWithoutTeam = [];

  availableUsers.forEach(user => {
    if (user.teamUuid?.trim()) {
      if (!usersByTeam[user.teamUuid]) usersByTeam[user.teamUuid] = [];
      usersByTeam[user.teamUuid].push(user);
    } else {
      usersWithoutTeam.push(user);
    }
  });

  ctx.state.allTeams.forEach(team => {
    if (usersByTeam[team.teamUuid]?.length) {
      const teamSection = document.createElement("div");
      teamSection.classList.add("team-section");

      const teamHeader = document.createElement("div");
      teamHeader.classList.add("team-header");
      teamHeader.textContent = team.teamName || `Team ${team.teamUuid.substring(0, 8)}`;
      teamSection.appendChild(teamHeader);

      usersByTeam[team.teamUuid].forEach(user => {
        teamSection.appendChild(createParticipantCheckbox(user));
      });

      ctx.els.participantsContainer.appendChild(teamSection);
    }
  });

  if (usersWithoutTeam.length > 0) {
    const noTeamSection = document.createElement("div");
    noTeamSection.classList.add("team-section");

    const noTeamHeader = document.createElement("div");
    noTeamHeader.classList.add("team-header");
    noTeamHeader.textContent = "No Team";
    noTeamSection.appendChild(noTeamHeader);

    usersWithoutTeam.forEach(user => {
      noTeamSection.appendChild(createParticipantCheckbox(user));
    });

    ctx.els.participantsContainer.appendChild(noTeamSection);
  }
}

export function selectAllParticipants(ctx) {
  ctx.els.participantsContainer.querySelectorAll("input[type=\"checkbox\"]").forEach(cb => cb.checked = true);
}

export function deselectAllParticipants(ctx) {
  ctx.els.participantsContainer.querySelectorAll("input[type=\"checkbox\"]").forEach(cb => cb.checked = false);
}

export function selectParticipantsByTeam(ctx, teamUuid) {
  if (!teamUuid) return;

  const team = ctx.state.allTeams.find(t => t.teamUuid === teamUuid);
  if (!team) return;

  const teamUserUuids = new Set();
  if (team.members?.length) {
    team.members.forEach(member => teamUserUuids.add(member.userUuid));
  } else {
    ctx.state.allUsers.forEach(user => {
      if (user.teamUuid === teamUuid) teamUserUuids.add(user.userUuid);
    });
  }

  ctx.els.participantsContainer.querySelectorAll("input[type=\"checkbox\"]").forEach(cb => {
    if (teamUserUuids.has(cb.value)) cb.checked = true;
  });

  ctx.els.selectByTeamDropdown.value = "";
}

export function populateMeetingParticipantsDisplay(ctx, container, participantUsers) {
  container.innerHTML = "";

  if (!participantUsers?.length) {
    container.innerHTML = "<p style='padding: 10px; color: #666; text-align: center;'>No participants</p>";
    return;
  }

  const usersByTeam = {};
  const usersWithoutTeam = [];

  participantUsers.forEach(user => {
    const teamUuid = user.teamUuid?.trim();
    if (teamUuid) {
      if (!usersByTeam[teamUuid]) usersByTeam[teamUuid] = [];
      usersByTeam[teamUuid].push(user);
    } else {
      usersWithoutTeam.push(user);
    }
  });

  const displayedTeamUuids = new Set();
  ctx.state.allTeams.forEach(team => {
    const teamUuid = team.teamUuid?.trim();
    if (teamUuid && usersByTeam[teamUuid]?.length) {
      displayedTeamUuids.add(teamUuid);
      const teamSection = document.createElement("div");
      teamSection.classList.add("team-section");

      const teamHeader = document.createElement("div");
      teamHeader.classList.add("team-header");
      teamHeader.textContent = team.teamName || `Team ${teamUuid.substring(0, 8)}`;
      teamSection.appendChild(teamHeader);

      usersByTeam[teamUuid].forEach(user => {
        const participantItem = document.createElement("div");
        participantItem.classList.add("meeting-participant-item");
        const nameSpan = document.createElement("span");
        nameSpan.classList.add("meeting-participant-name");
        nameSpan.textContent = formatUserNameWithRole(user);
        participantItem.appendChild(nameSpan);
        teamSection.appendChild(participantItem);
      });

      container.appendChild(teamSection);
    }
  });

  Object.keys(usersByTeam).forEach(teamUuid => {
    if (!displayedTeamUuids.has(teamUuid) && usersByTeam[teamUuid]?.length) {
      const teamSection = document.createElement("div");
      teamSection.classList.add("team-section");

      const teamHeader = document.createElement("div");
      teamHeader.classList.add("team-header");
      teamHeader.textContent = `Team ${teamUuid.substring(0, 8)}`;
      teamSection.appendChild(teamHeader);

      usersByTeam[teamUuid].forEach(user => {
        const participantItem = document.createElement("div");
        participantItem.classList.add("meeting-participant-item");
        const nameSpan = document.createElement("span");
        nameSpan.classList.add("meeting-participant-name");
        nameSpan.textContent = formatUserNameWithRole(user);
        participantItem.appendChild(nameSpan);
        teamSection.appendChild(participantItem);
      });

      container.appendChild(teamSection);
    }
  });

  if (usersWithoutTeam.length > 0) {
    const noTeamSection = document.createElement("div");
    noTeamSection.classList.add("team-section");

    const noTeamHeader = document.createElement("div");
    noTeamHeader.classList.add("team-header");
    noTeamHeader.textContent = "No Team";
    noTeamSection.appendChild(noTeamHeader);

    usersWithoutTeam.forEach(user => {
      const participantItem = document.createElement("div");
      participantItem.classList.add("meeting-participant-item");
      const nameSpan = document.createElement("span");
      nameSpan.classList.add("meeting-participant-name");
      nameSpan.textContent = formatUserNameWithRole(user);
      participantItem.appendChild(nameSpan);
      noTeamSection.appendChild(participantItem);
    });

    container.appendChild(noTeamSection);
  }
}

