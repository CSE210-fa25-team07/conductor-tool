// =============================================
// User Analytics JavaScript
// Individual student view with clickable bar chart
// =============================================

let userChart = null;

// Initialize user analytics
function initUserAnalytics(userId = 1) {
  // eslint-disable-next-line no-console
  console.log("Initializing User Analytics...");

  // Load initial data
  loadUserData(userId);

  // Set up event listeners
  setupUserEventListeners();
}

// Load user attendance data
async function loadUserData(userId) {
  try {
    // Show loading state
    showUserLoadingState();

    // Fetch data from API
    const data = await API.getUserAttendance(userId);

    // Update UI
    // updateUserStats(data);
    updateUserChart(data.meetingTypes);
    updateUserInfo(data);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error loading user data:", error);
    showUserErrorState("Failed to load user data");
  }
}

// Update statistics cards
// eslint-disable-next-line no-unused-vars
function updateUserStats(data) {
  document.getElementById("overallUserAttendance").textContent =
    ChartHelper.formatPercentage(data.overall);
  document.getElementById("lectureAttendance").textContent =
    ChartHelper.formatPercentage(data.lecture);
  document.getElementById("officeHoursAttendance").textContent =
    ChartHelper.formatPercentage(data.officeHours);
  document.getElementById("teamMeetingAttendance").textContent =
    ChartHelper.formatPercentage(data.teamMeeting);
}

// Update user information
function updateUserInfo(data) {
  const userNameElement = document.getElementById("userName");
  if (userNameElement) {
    userNameElement.textContent = data.userName;
  }
}

// Update attendance by type bar chart
function updateUserChart(meetingTypes) {
  const types = meetingTypes.map(mt => mt.type);
  const rates = meetingTypes.map(mt => mt.rate);

  if (userChart) {
    userChart.destroy();
  }

  // Create chart with click handler
  userChart = ChartHelper.createAttendanceByTypeChart(
    "userAttendanceChart",
    types,
    rates,
    (event, activeElements) => {
      if (activeElements.length > 0) {
        // const index = activeElements[0].index;
        // showMeetingListModal(meetingTypes[index]);
      }
    }
  );
}

// Show meeting list modal when clicking on chart bar
// eslint-disable-next-line no-unused-vars
function showMeetingListModal(meetingType) {
  // eslint-disable-next-line no-console
  console.log("Showing meeting list for:", meetingType.type);

  const modal = document.getElementById("meetingListModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalMeetingList");

  if (!modal) return;

  // Set modal title
  modalTitle.textContent = `${meetingType.type} Meetings (${meetingType.attended}/${meetingType.total})`;

  // Load meetings for this type
  loadMeetingsForType(meetingType.type.toLowerCase().replace(" ", "-"), modalBody);

  // Show modal
  modal.classList.add("show");
}

// Load meetings for a specific type and display in modal
async function loadMeetingsForType(type, container) {
  try {
    // Fetch meetings filtered by type
    const data = await API.getMeetingList({ type });

    // Render meeting list in modal
    if (data.meetings.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-text">No meetings found</div>
        </div>
      `;
      return;
    }

    // Create meeting list HTML
    let html = "<ul class=\"meeting-list\" style=\"margin: 0;\">";

    data.meetings.forEach(meeting => {
      const statusClass = meeting.status === "attended" ? "attended" : "missed";
      const statusText = meeting.status === "attended" ? "Attended" : "Missed";
      const icon = getMeetingIcon(meeting.type);

      html += `
        <li class="meeting-item ${meeting.type} ${statusClass}" data-meeting-id="${meeting.id}">
          <div class="meeting-icon ${meeting.type}">${icon}</div>
          <div class="meeting-info">
            <div class="meeting-type">${meeting.title}</div>
            <div class="meeting-date">${formatDate(meeting.date)} at ${meeting.time}</div>
            <div class="meeting-time">${meeting.location} • ${meeting.duration}</div>
          </div>
          <span class="meeting-status ${statusClass}">${statusText}</span>
        </li>
      `;
    });

    html += "</ul>";
    container.innerHTML = html;

    // Add click handlers to meeting items
    container.querySelectorAll(".meeting-item").forEach(item => {
      item.addEventListener("click", () => {
        const meetingId = item.dataset.meetingId;
        showMeetingDetails(meetingId);
      });
    });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error loading meetings:", error);
    container.innerHTML = "<p style=\"color: #999; text-align: center; padding: 20px;\">Error loading meetings</p>";
  }
}

// Get icon for meeting type
function getMeetingIcon(type) {
  const icons = {
    "lecture": "📚",
    "office-hours": "💬",
    "team-meeting": "👥"
  };
  return icons[type] || "📅";
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

// Show meeting details (placeholder)
function showMeetingDetails(meetingId) {
  alert(`Meeting Details (ID: ${meetingId})\n\nDetailed meeting information will be displayed here.`);
}

// Set up event listeners
function setupUserEventListeners() {
  // Close modal button
  const closeButton = document.getElementById("closeModal");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      closeMeetingListModal();
    });
  }

  // Close modal when clicking outside
  const modal = document.getElementById("meetingListModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeMeetingListModal();
      }
    });
  }

  // ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMeetingListModal();
    }
  });
}

// Close meeting list modal
function closeMeetingListModal() {
  const modal = document.getElementById("meetingListModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

// Loading state
function showUserLoadingState() {
  const card = document.getElementById("userAnalyticsCard");
  if (card) {
    card.style.opacity = "0.6";
  }
}

// Error state
function showUserErrorState(message) {
  // eslint-disable-next-line no-console
  console.error(message);
  alert(message);

  const card = document.getElementById("userAnalyticsCard");
  if (card) {
    card.style.opacity = "1";
  }
}

// Auto-initialize if the page is already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initUserAnalytics());
} else {
  initUserAnalytics();
}

// Export for demo page
if (typeof window !== "undefined") {
  window.initUserAnalytics = initUserAnalytics;
}
