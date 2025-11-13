// =============================================
// Group Analytics JavaScript
// Team profile view for group attendance
// =============================================

let groupChart = null;
let currentGroupData = null;

// Initialize group analytics
function initGroupAnalytics(groupId = 1) {
  // eslint-disable-next-line no-console
  console.log("Initializing Group Analytics...");

  // Load initial data
  loadGroupData(groupId);

  // Set up event listeners
  setupGroupEventListeners();
}

// Load group attendance data
async function loadGroupData(groupId) {
  try {
    // Show loading state
    showGroupLoadingState();

    // Fetch data from API
    const data = await API.getGroupAttendance(groupId);
    currentGroupData = data;

    // Update UI
    // updateGroupStats(data);
    updateGroupChart(data.trendData);
    updateGroupInfo(data);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error loading group data:", error);
    showGroupErrorState("Failed to load group data");
  }
}

// Update statistics cards
// eslint-disable-next-line no-unused-vars
function updateGroupStats(data) {
  document.getElementById("teamAttendanceRate").textContent =
    ChartHelper.formatPercentage(data.teamRate);
  document.getElementById("teamMemberCount").textContent = data.memberCount;
  document.getElementById("teamMeetingCount").textContent = data.meetingCount;
  document.getElementById("avgResponseTime").textContent = data.avgResponseTime + "h";
}

// Update group information
function updateGroupInfo(data) {
  const teamNameElement = document.getElementById("teamName");
  if (teamNameElement) {
    teamNameElement.textContent = data.groupName;
  }
}

// Update attendance trend chart
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

// Set up event listeners
function setupGroupEventListeners() {
  // Team members toggle (future feature)
  const toggleButton = document.getElementById("teamMembersToggle");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      toggleTeamMembers();
    });
  }
}

// Toggle team members list (future feature)
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

// Load team members (future feature)
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

// Show member details
function showMemberDetails(member) {
  alert(`Team Member Details:\nName: ${member.name}\nAttendance: ${member.attendanceRate}%\n\n(Full details view to be implemented)`);
}

// Loading state
function showGroupLoadingState() {
  const card = document.getElementById("groupAnalyticsCard");
  if (card) {
    card.style.opacity = "0.6";
  }
}

// Error state
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
