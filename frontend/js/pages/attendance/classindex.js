// =============================================
// Class Analytics JavaScript
// Professor/TA view for class-wide attendance
// =============================================

/**
 * @typedef {Object} StudentRisk
 * @property {number} id - Unique student identifier.
 * @property {string} name - Student full name.
 * @property {string} [group] - Team or cohort assignment.
 * @property {number} attendanceRate - Attendance percentage in range 0-100.
 */

/**
 * @typedef {Object} ClassTrendData
 * @property {string[]} dates - Ordered labels for each data point.
 * @property {number[]} lecture - Attendance percentages for lectures.
 * @property {number[]} officeHours - Attendance percentages for office hours.
 * @property {number[]} taCheckin - Attendance percentages for TA check-ins.
 */

/**
 * @typedef {Object} ClassAttendanceData
 * @property {number} overallRate - Average attendance across all meetings.
 * @property {number} totalStudents - Count of enrolled students.
 * @property {number} totalMeetings - Number of meetings analysed.
 * @property {StudentRisk[]} students - Full roster with latest attendance values.
 * @property {StudentRisk[]} studentsAtRisk - Students below the defined threshold.
 * @property {ClassTrendData} trendData - Time-series data for charting.
 */

let classChart = null;
let currentClassData = null;

/**
 * Initializes the class analytics dashboard by loading initial data
 * and wiring up UI interactions.
 *
 * @returns {void}
 */
function initClassAnalytics() {
  // eslint-disable-next-line no-console
  console.log("Initializing Class Analytics...");

  // Load initial data
  loadClassData();

  // Set up event listeners
  setupClassEventListeners();
}

/**
 * Fetches class-level attendance data based on the meeting filter
 * and updates the associated UI widgets.
 *
 * @param {"all"|"lecture"|"office-hours"|"ta-checkin"} [meetingType="all"] - Meeting type filter.
 * @returns {Promise<void>} Resolves once the UI is updated.
 */
async function loadClassData(meetingType = "all") {
  try {
    // Show loading state
    showLoadingState();

    // Fetch data from API
    const data = await API.getClassAttendance(meetingType);
    currentClassData = data;

    // Update UI
    updateClassStats(data);
    updateClassChart(data.trendData, meetingType);
    updateStudentRiskList(data.studentsAtRisk);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error loading class data:", error);
    showErrorState("Failed to load class data");
  }
}

/**
 * Updates the headline metrics and at-risk count using the latest data payload.
 *
 * @param {ClassAttendanceData} data - Aggregated class attendance details.
 * @returns {void}
 */
function updateClassStats(data) {
  // Update students at risk count in the risk section
  const threshold = parseFloat(document.getElementById("thresholdInput").value) || 75;
  const atRiskCount = data.students.filter(s => s.attendanceRate < threshold).length;

  // Update count in the risk section header
  const riskTitle = document.querySelector(".students-at-risk-title");
  if (riskTitle) {
    riskTitle.textContent = `Students At Risk (${atRiskCount})`;
  }
}

/**
 * Renders or updates the attendance line chart depending on the active meeting filter.
 *
 * @param {ClassTrendData} trendData - Time-series data for each meeting type.
 * @param {"all"|"lecture"|"office-hours"|"ta-checkin"} [meetingType="all"] - Selected meeting type filter.
 * @returns {void}
 */
function updateClassChart(trendData, meetingType = "all") {
  // Destroy existing chart
  if (classChart) {
    classChart.destroy();
    classChart = null;
  }

  // If "all" types, show multi-line chart
  if (meetingType === "all") {
    classChart = ChartHelper.createMultiLineAttendanceChart(
      "classAttendanceChart",
      trendData.dates,
      {
        lecture: trendData.lecture,
        officeHours: trendData.officeHours,
        taCheckin: trendData.taCheckin
      }
    );
  } else {
    // Show single line for specific type
    let dataPoints, label;

    switch(meetingType) {
    case "lecture":
      dataPoints = trendData.lecture;
      label = "Lecture Attendance";
      break;
    case "office-hours":
      dataPoints = trendData.officeHours;
      label = "Office Hours Attendance";
      break;
    case "ta-checkin":
      dataPoints = trendData.taCheckin;
      label = "TA Check-in Attendance";
      break;
    default:
      dataPoints = trendData.lecture;
      label = "Attendance Rate";
    }

    classChart = ChartHelper.createAttendanceTrendChart(
      "classAttendanceChart",
      trendData.dates,
      dataPoints,
      label
    );
  }
}

/**
 * Populates the students-at-risk list with the provided roster, ordered by attendance.
 *
 * @param {StudentRisk[]} studentsAtRisk - Students currently below the threshold.
 * @returns {void}
 */
function updateStudentRiskList(studentsAtRisk) {
  const listElement = document.getElementById("studentRiskList");
  const noRiskElement = document.getElementById("noRiskStudents");

  if (!studentsAtRisk || studentsAtRisk.length === 0) {
    listElement.style.display = "none";
    noRiskElement.style.display = "block";
    return;
  }

  listElement.style.display = "block";
  noRiskElement.style.display = "none";

  // Clear existing list
  listElement.innerHTML = "";

  // Sort by attendance rate (lowest first)
  const sorted = [...studentsAtRisk].sort((a, b) => a.attendanceRate - b.attendanceRate);

  // Create list items
  sorted.forEach(student => {
    const li = document.createElement("li");
    li.className = "student-risk-item";
    li.innerHTML = `
      <div class="student-risk-meta">
        <span class="student-name">${student.name}</span>
        <span class="student-group-tag">${student.group || "Unassigned"}</span>
      </div>
      <span class="student-attendance-rate">${ChartHelper.formatPercentage(student.attendanceRate)}</span>
    `;

    // Make clickable to view student details
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      showStudentDetails(student);
    });

    listElement.appendChild(li);
  });
}

/**
 * Displays a placeholder alert with student details. Future iterations
 * will replace this with a dedicated profile view.
 *
 * @param {StudentRisk} student - Selected student record.
 * @returns {void}
 */
function showStudentDetails(student) {
  alert(`Student Details:\nName: ${student.name}\nGroup: ${student.group || "Unassigned"}\nAttendance: ${student.attendanceRate}%\n\n(Full details view to be implemented)`);
}

/**
 * Binds DOM event listeners for filters and threshold adjustments.
 *
 * @returns {void}
 */
function setupClassEventListeners() {
  // Meeting type filter
  const filterSelect = document.getElementById("meetingTypeFilter");
  if (filterSelect) {
    filterSelect.addEventListener("change", (e) => {
      loadClassData(e.target.value);
    });
  }

  // Threshold input
  const thresholdInput = document.getElementById("thresholdInput");
  if (thresholdInput) {
    thresholdInput.addEventListener("input", debounce(() => {
      const threshold = parseFloat(thresholdInput.value) || 75;
      if (currentClassData) {
        const atRisk = currentClassData.students.filter(s => s.attendanceRate < threshold);
        updateStudentRiskList(atRisk);

        // Update count in title
        const riskTitle = document.querySelector(".students-at-risk-title");
        if (riskTitle) {
          riskTitle.textContent = `Students At Risk (${atRisk.length})`;
        }
      }
    }, 300));
  }
}

/**
 * Applies a temporary loading state to the class analytics card.
 *
 * @returns {void}
 */
function showLoadingState() {
  const card = document.getElementById("classAnalyticsCard");
  if (card) {
    card.style.opacity = "0.6";
  }
}

/**
 * Presents an error notification and restores the analytics card state.
 *
 * @param {string} message - Error message shown to the user.
 * @returns {void}
 */
function showErrorState(message) {
  // eslint-disable-next-line no-console
  console.error(message);
  alert(message);
}

/**
 * Creates a debounced wrapper that delays execution until after the specified wait time.
 *
 * @param {Function} func - Callback to debounce.
 * @param {number} wait - Delay in milliseconds.
 * @returns {Function} Debounced function respecting the provided delay.
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Auto-initialize if the page is already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initClassAnalytics);
} else {
  initClassAnalytics();
}

// Export for demo page
if (typeof window !== "undefined") {
  window.initClassAnalytics = initClassAnalytics;
}
