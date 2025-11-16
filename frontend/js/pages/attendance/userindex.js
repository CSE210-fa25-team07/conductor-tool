// =============================================
// User Analytics JavaScript
// Individual student view with clickable bar chart
// =============================================

/**
 * @typedef {Object} MeetingTypeSummary
 * @property {string} type - Human-readable meeting type label.
 * @property {number} rate - Attendance percentage for the type.
 * @property {number} attended - Number of meetings attended.
 * @property {number} total - Total meetings scheduled.
 */

/**
 * @typedef {Object} UserAttendanceData
 * @property {string} userName - Display name for the user.
 * @property {number} overall - Aggregate attendance rate.
 * @property {number} lecture - Lecture attendance percentage.
 * @property {number} officeHours - Office hours attendance percentage.
 * @property {number} teamMeeting - Team meeting attendance percentage.
 * @property {MeetingTypeSummary[]} meetingTypes - Attendance breakdown by meeting type.
 */

/**
 * @typedef {Object} MeetingDetail
 * @property {number} id - Identifier for the meeting.
 * @property {string} type - Machine-readable meeting type.
 * @property {string} typeName - Display label for the type.
 * @property {string} title - Meeting title.
 * @property {string} date - ISO date string.
 * @property {string} time - Meeting start time.
 * @property {"attended"|"missed"} status - Attendance status flag.
 * @property {string} location - Meeting location descriptor.
 * @property {string} duration - Meeting duration summary (e.g. "90 min").
 */

let userChart = null;

/**
 * Bootstraps the user analytics view for the supplied user identifier.
 *
 * @param {number} [userId=1] - Identifier for the user to load.
 * @returns {void}
 */
function initUserAnalytics(userId = 1) {
  // eslint-disable-next-line no-console
  console.log("Initializing User Analytics...");

  // Load initial data
  loadUserData(userId);

  // Set up event listeners
  setupUserEventListeners();
}

/**
 * Fetches user-level analytics data and updates key UI components.
 *
 * @param {number} userId - Identifier for the user to retrieve.
 * @returns {Promise<void>} Resolves once UI elements have been refreshed.
 */
async function loadUserData(userId) {
  try {
    // Show loading state
    showUserLoadingState();

    // Fetch data from API
    const data = await API.getUserAttendance(userId);

    // Update UI
    updateUserStats(data);
    updateUserChart(data.meetingTypes);
    updateUserInfo(data);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error loading user data:", error);
    showUserErrorState("Failed to load user data");
  }
}

// Update statistics cards
/**
 * Writes the numeric attendance metrics into the stat tiles.
 *
 * @param {UserAttendanceData} data - Attendance summary payload.
 * @returns {void}
 */
function updateUserStats(data) {
  const overallElement = document.getElementById("overallUserAttendance");
  const lectureElement = document.getElementById("lectureAttendance");
  const officeHoursElement = document.getElementById("officeHoursAttendance");
  const teamMeetingElement = document.getElementById("teamMeetingAttendance");

  if (overallElement) {
    overallElement.textContent = ChartHelper.formatPercentage(data.overall);
  }

  if (lectureElement) {
    lectureElement.textContent = ChartHelper.formatPercentage(data.lecture);
  }

  if (officeHoursElement) {
    officeHoursElement.textContent = ChartHelper.formatPercentage(data.officeHours);
  }

  if (teamMeetingElement) {
    teamMeetingElement.textContent = ChartHelper.formatPercentage(data.teamMeeting);
  }
}

/**
 * Updates the user-specific labels (e.g., display name).
 *
 * @param {UserAttendanceData} data - Attendance summary payload.
 * @returns {void}
 */
function updateUserInfo(data) {
  const userNameElement = document.getElementById("userName");
  if (userNameElement) {
    userNameElement.textContent = data.userName;
  }
}

/**
 * Renders the bar chart showing attendance by meeting type.
 *
 * @param {MeetingTypeSummary[]} meetingTypes - Attendance rates grouped by meeting type.
 * @returns {void}
 */
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
        const index = activeElements[0].index;
        showMeetingListModal(meetingTypes[index]);
      }
    }
  );
}

// Show meeting list modal when clicking on chart bar
/**
 * Opens the meeting list modal for the provided meeting type data.
 *
 * @param {MeetingTypeSummary} meetingType - Meeting type meta with counts used for the modal.
 * @returns {void}
 */
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
  loadMeetingsForType(meetingType.type.toLowerCase().replace(/\s+/g, "-"), modalBody);

  // Show modal
  modal.classList.add("show");
}

/**
 * Loads meetings filtered by type and injects the rendered list into the modal.
 *
 * @param {string} type - Meeting type slug used for filtering.
 * @param {HTMLElement} container - DOM container that receives the rendered list.
 * @returns {Promise<void>} Resolves once the list has been rendered.
 */
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

/**
 * Selects an emoji icon corresponding to the meeting type.
 *
 * @param {string} type - Meeting type slug.
 * @returns {string} Icon representing the type.
 */
function getMeetingIcon(type) {
  const icons = {
    "lecture": "📚",
    "office-hours": "💬",
    "team-meeting": "👥"
  };
  return icons[type] || "📅";
}

/**
 * Formats an ISO date string into a short, user-friendly label.
 *
 * @param {string} dateString - Date string to format.
 * @returns {string} Localised date label.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

/**
 * Displays a placeholder alert for meeting details.
 *
 * @param {number} meetingId - Identifier for the meeting.
 * @returns {void}
 */
function showMeetingDetails(meetingId) {
  alert(`Meeting Details (ID: ${meetingId})\n\nDetailed meeting information will be displayed here.`);
}

/**
 * Binds DOM events for modal interactions in the user analytics view.
 *
 * @returns {void}
 */
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

/**
 * Hides the meeting list modal if it is open.
 *
 * @returns {void}
 */
function closeMeetingListModal() {
  const modal = document.getElementById("meetingListModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

/**
 * Applies a loading affordance to the user analytics card.
 *
 * @returns {void}
 */
function showUserLoadingState() {
  const card = document.getElementById("userAnalyticsCard");
  if (card) {
    card.style.opacity = "0.6";
  }
}

/**
 * Displays an error notification and restores the card state.
 *
 * @param {string} message - Error message presented to the user.
 * @returns {void}
 */
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
