// =============================================
// Group Analytics JavaScript
// Team profile view for group attendance
// =============================================

/**
 * @typedef {Object} GroupTrendPoint
 * @property {string} date - Label for the data point.
 * @property {number} attendanceRate - Attendance percentage for the date.
 */

/**
 * @typedef {Object} GroupMember
 * @property {number} id - Unique identifier for the team member.
 * @property {string} name - Team member name.
 * @property {number} attendanceRate - Attendance percentage for the member.
 */

/**
 * @typedef {Object} GroupAttendanceData
 * @property {string} groupName - Display name of the group.
 * @property {number} teamRate - Overall team attendance percentage.
 * @property {number} memberCount - Number of members in the group.
 * @property {number} meetingCount - Total meetings considered.
 * @property {number} avgResponseTime - Average response time in hours.
 * @property {GroupTrendPoint[]} trendData - Time-series data for the team chart.
 * @property {GroupMember[]} [members] - Optional roster for future enhancements.
 */

let groupChart = null;
let currentGroupData = null;

/**
 * Initializes the group analytics card, loading initial data and events.
 *
 * @param {number} [groupId=1] - Identifier for the group to load.
 * @returns {void}
 */
function initGroupAnalytics(groupId = 1) {
  // eslint-disable-next-line no-console
  console.log("Initializing Group Analytics...");

  // Load initial data
  loadGroupData(groupId);

  // Set up event listeners
  setupGroupEventListeners();
}

/**
 * Retrieves group attendance data and refreshes key UI components.
 *
 * @param {number} groupId - Identifier for the group to retrieve.
 * @returns {Promise<void>} Resolves once the view has been updated.
 */
async function loadGroupData(groupId) {
  try {
    // Show loading state
    showGroupLoadingState();

    // Fetch data from API
    const data = await API.getGroupAttendance(groupId);
    currentGroupData = data;

    // Update UI
    updateGroupStats(data);
    updateGroupChart(data.trendData);
    updateGroupInfo(data);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error loading group data:", error);
    showGroupErrorState("Failed to load group data");
  }
}

// Update statistics cards
/**
 * Updates the summary statistic tiles with the provided group data.
 *
 * @param {GroupAttendanceData} data - Group attendance overview.
 * @returns {void}
 */
function updateGroupStats(data) {
  const attendanceRateElement = document.getElementById("teamAttendanceRate");
  const memberCountElement = document.getElementById("teamMemberCount");
  const meetingCountElement = document.getElementById("teamMeetingCount");
  const responseTimeElement = document.getElementById("avgResponseTime");

  if (attendanceRateElement) {
    attendanceRateElement.textContent = ChartHelper.formatPercentage(data.teamRate);
  }

  if (memberCountElement) {
    memberCountElement.textContent = data.memberCount;
  }

  if (meetingCountElement) {
    meetingCountElement.textContent = data.meetingCount;
  }

  if (responseTimeElement) {
    responseTimeElement.textContent = `${data.avgResponseTime}h`;
  }
}

/**
 * Synchronises the UI labels with the latest group information.
 *
 * @param {GroupAttendanceData} data - Group attendance overview.
 * @returns {void}
 */
function updateGroupInfo(data) {
  const teamNameElement = document.getElementById("teamName");
  if (teamNameElement) {
    teamNameElement.textContent = data.groupName;
  }
}

/**
 * Renders or updates the group attendance chart using time-series data.
 *
 * @param {GroupTrendPoint[]} trendData - Chronological attendance records.
 * @returns {void}
 */
function updateGroupChart(trendData) {
  const labels = trendData.map(d => d.date);
  const dataPoints = trendData.map(d => d.attendanceRate);

  if (groupChart) {
    ChartHelper.updateChart(groupChart, labels, dataPoints);
  } else {
    groupChart = ChartHelper.createAttendanceTrendChart(
      "groupAttendanceChart",
      labels,
      dataPoints,
      "Team Attendance Rate"
    );
  }
}

/**
 * Binds UI interactions related to the group analytics card.
 *
 * @returns {void}
 */
function setupGroupEventListeners() {
  // Team members toggle (future feature)
  const toggleButton = document.getElementById("teamMembersToggle");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      toggleTeamMembers();
    });
  }
}

/**
 * Expands or collapses the team member list container.
 *
 * @returns {void}
 */
function toggleTeamMembers() {
  const membersList = document.getElementById("teamMembersList");
  const expandIcon = document.querySelector(".expand-icon");

  if (membersList && expandIcon) {
    membersList.classList.toggle("show");
    expandIcon.classList.toggle("expanded");

    // Load members if not already loaded
    if (membersList.classList.contains("show") && membersList.children.length === 0) {
      loadTeamMembers();
    }
  }
}

/**
 * Lazily populates the team member list using the cached data set.
 *
 * @returns {void}
 */
function loadTeamMembers() {
  if (!currentGroupData || !currentGroupData.members) return;

  const membersList = document.getElementById("teamMembersList");
  if (!membersList) return;

  membersList.innerHTML = "";

  currentGroupData.members.forEach(member => {
    const li = document.createElement("li");
    li.className = "team-member-item";
    li.innerHTML = `
      <span class="student-name">${member.name}</span>
      <span class="student-attendance-rate" style="color: ${ChartHelper.getColorByRate(member.attendanceRate)}">
        ${ChartHelper.formatPercentage(member.attendanceRate)}
      </span>
    `;

    // Make clickable
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      showMemberDetails(member);
    });

    membersList.appendChild(li);
  });
}

/**
 * Displays a placeholder alert for the selected team member.
 *
 * @param {GroupMember} member - Team member whose details are requested.
 * @returns {void}
 */
function showMemberDetails(member) {
  alert(`Team Member Details:\nName: ${member.name}\nAttendance: ${member.attendanceRate}%\n\n(Full details view to be implemented)`);
}

/**
 * Applies a loading affordance to the group analytics card.
 *
 * @returns {void}
 */
function showGroupLoadingState() {
  const card = document.getElementById("groupAnalyticsCard");
  if (card) {
    card.style.opacity = "0.6";
  }
}

/**
 * Displays an error notification and restores the card opacity.
 *
 * @param {string} message - Error message shown to the user.
 * @returns {void}
 */
function showGroupErrorState(message) {
  // eslint-disable-next-line no-console
  console.error(message);
  alert(message);

  const card = document.getElementById("groupAnalyticsCard");
  if (card) {
    card.style.opacity = "1";
  }
}

// Auto-initialize if the page is already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initGroupAnalytics());
} else {
  initGroupAnalytics();
}

// Export for demo page
if (typeof window !== "undefined") {
  window.initGroupAnalytics = initGroupAnalytics;
}
