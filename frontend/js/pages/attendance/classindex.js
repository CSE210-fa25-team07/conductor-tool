// =============================================
// Class Analytics JavaScript
// Professor/TA view for class-wide attendance
// =============================================

let classChart = null;
let currentClassData = null;

// Initialize class analytics
function initClassAnalytics() {
  // eslint-disable-next-line no-console
  console.log("Initializing Class Analytics...");

  // Load initial data
  loadClassData();

  // Set up event listeners
  setupClassEventListeners();
}

// Load class attendance data
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

// Update statistics display
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

// Update attendance trend chart
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

// Update students at risk list
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

// Show student details (placeholder for future implementation)
function showStudentDetails(student) {
  alert(`Student Details:\nName: ${student.name}\nGroup: ${student.group || "Unassigned"}\nAttendance: ${student.attendanceRate}%\n\n(Full details view to be implemented)`);
}

// Set up event listeners
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

// Loading state
function showLoadingState() {
  const card = document.getElementById("classAnalyticsCard");
  if (card) {
    card.style.opacity = "0.6";
  }
}

// Error state
function showErrorState(message) {
  // eslint-disable-next-line no-console
  console.error(message);
  alert(message);
}

// Debounce utility
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
