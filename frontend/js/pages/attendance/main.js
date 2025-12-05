/**
 * @fileoverview Attendance Feature Main Entry Point
 * Handles calendar and meeting creation on Attendance tab
 * @module pages/attendance/main
 */

import { loadTemplate } from "../../utils/templateLoader.js";
import { createMeeting, deleteMeeting, getMeetingList, getAllCourseUsers, getCourseTeams, getMeetingCode, recordAttendanceByCode, getCourseDetails, getMeetingParticipants } from "../../api/attendanceApi.js";
import { loadUserContext, isProfessorOrTA, getCurrentUser, getUserRoleInCourse } from "../../utils/userContext.js";

const meetings = {};
let currentDate = new Date();
let courseStartDate = null;
let courseEndDate = null;

const MEETING_TYPES = {
  "Lecture": 0, "OH": 1, "TA Check-In": 2, "Team Meeting": 3
};

const MEETING_TYPE_NAMES = { 0: "Lecture", 1: "OH", 2: "TA Check-In", 3: "Team Meeting" };

/**
 * Map meeting type string to integer (0-3)
 * @param {string} typeString - Meeting type as string
 * @returns {number} Meeting type as integer
 */
function mapMeetingTypeToInt(typeString) {
  return MEETING_TYPES[typeString] ?? 0;
}

/**
 * Map meeting type integer to string (0-3)
 * @param {number} typeInt - Meeting type as integer
 * @returns {string} Meeting type as string
 */
function mapMeetingTypeToString(typeInt) {
  return MEETING_TYPE_NAMES[typeInt] || "Lecture";
}

/**
 * Parse a local date string (YYYY-MM-DD) to Date object
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date|null} Parsed date or null if invalid
 */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a Date object to YYYY-MM-DD string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Parse meeting date from various formats (Date object, ISO string, or date string)
 * @param {Date|string} date - Date in various formats
 * @returns {Date|null} Parsed date or null if invalid
 */
function parseMeetingDate(date) {
  if (date instanceof Date) return date;
  if (typeof date !== "string") return null;

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  return parseLocalDate(date);
}

/**
 * Validate meeting location input
 * Accepts Zoom links, Google Meet links, or plain text
 * @param {string} location - Location string (URL or plain text)
 * @returns {boolean} True if valid or empty, false if invalid URL format
 */
function isValidMeetingLocation(location) {
  if (!location || location.trim() === "") return true; // Empty is valid (optional field)
  
  const trimmedLocation = location.trim();
  
  // If it's a URL, validate it's Zoom or Google Meet
  if (trimmedLocation.startsWith("http://") || trimmedLocation.startsWith("https://")) {
    // Zoom link patterns:
    // - https://zoom.us/j/123456789
    // - https://us02web.zoom.us/j/123456789
    // - https://zoom.us/s/123456789
    // - https://us02web.zoom.us/s/123456789
    // - Can have query params like ?pwd=xxx
    const zoomPattern = /^https?:\/\/([a-z0-9-]+\.)?zoom\.us\/(j|s)\/[0-9]+(\?.*)?$/i;
    
    // Google Meet link patterns:
    // - https://meet.google.com/abc-defg-hij
    // - https://meet.google.com/abc-defg-hij?authuser=...
    // - https://meet.google.com/abc-defg-hij?pli=1&authuser=0
    const googleMeetPattern = /^https?:\/\/(meet\.)?google\.(com|co\.[a-z]{2})\/[a-z]+(-[a-z]+)+(\?.*)?$/i;
    
    return zoomPattern.test(trimmedLocation) || googleMeetPattern.test(trimmedLocation);
  }
  
  // If it's not a URL, accept any text (like "CSE Building, Room 202")
  return true;
}

/**
 * Render the attendance calendar and meeting management interface
 * @param {HTMLElement} container - Container element to render into
 * @param {string} view - View name (default: "dashboard")
 * @returns {Promise<void>}
 */
export async function render(container, view = "dashboard") {
  try {
    container.innerHTML = await loadTemplate("attendance", view);

    const getCourseIdFromUrl = () => {
      const match = window.location.pathname.match(/^\/courses\/([^/]+)/);
      return match ? match[1] : null;
    };

    const els = {
      calendarGrid: container.querySelector("#calendar-grid"),
      currentMonthEl: container.querySelector("#current-month"),
      prevBtn: container.querySelector("#prev-month"),
      nextBtn: container.querySelector("#next-month"),
      todayBtn: container.querySelector("#today-btn"),
      meetingModal: container.querySelector("#meeting-modal"),
      closeModalBtn: container.querySelector("#close-modal"),
      meetingForm: container.querySelector("#meeting-form"),
      meetingContentModalWrapper: container.querySelector("#meeting-content-modal-wrapper"),
      closeMeetingContentBtn: container.querySelector("#close-meeting-content"),
      meetingTitleInput: container.querySelector("#meeting-title"),
      meetingDateInput: container.querySelector("#meeting-date"),
      meetingTimeInput: container.querySelector("#meeting-time"),
      meetingEndTimeInput: container.querySelector("#meeting-end-time"),
      meetingTypeSelect: container.querySelector("#meeting-type"),
      meetingDescTextarea: container.querySelector("#meeting-description"),
      meetingLocationInput: container.querySelector("#meeting-location"),
      participantsContainer: container.querySelector("#meeting-participants"),
      selectAllBtn: container.querySelector("#select-all-participants"),
      deselectAllBtn: container.querySelector("#deselect-all-participants"),
      selectByTeamDropdown: container.querySelector("#select-by-team"),
      recurringCheckbox: container.querySelector("#recurring"),
      recurringEndInput: container.querySelector("#recurring-end-date"),
      recurringSummaryEl: container.querySelector("#recurring-summary"),
      deleteMeetingBtn: container.querySelector("#delete-meeting"),
      deleteAllFutureBtn: container.querySelector("#delete-future-meetings"),
      creatorView: container.querySelector("#creator-attendance-view"),
      participantView: container.querySelector("#participant-attendance-view"),
      qrCodeImage: container.querySelector("#meeting-qr-code"),
      meetingCodeDisplay: container.querySelector("#meeting-code-display"),
      copyCodeBtn: container.querySelector("#copy-code-btn"),
      qrScannerVideo: container.querySelector("#qr-scanner-video"),
      qrScannerCanvas: container.querySelector("#qr-scanner-canvas"),
      startCameraBtn: container.querySelector("#start-camera-btn"),
      stopCameraBtn: container.querySelector("#stop-camera-btn"),
      submitAttendanceBtn: container.querySelector("#submit-attendance"),
      attendancePasscodeInput: container.querySelector("#attendance-passcode")
    };

    let selectedCalendarDate = "";
    let allUsers = [];
    let allTeams = [];
    let activeMeetingContext = { date: null, index: null, chainId: null };
    let cameraStream = null;
    let qrScanningInterval = null;

    /**
     * Setup meeting type options based on user role
     * Professors can create: Lecture, OH, TA Check-In, Team Meeting
     * TAs can create: OH, TA Check-In, Team Meeting
     * Students can only create: Team Meeting
     */
    function setupMeetingTypeOptions() {
      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) return;

      const role = getUserRoleInCourse(courseUUID);
      els.meetingTypeSelect.innerHTML = "";

      let options;
      let defaultType;

      if (role === "Professor") {
        // Professor can create any type
        options = ["Lecture", "OH", "TA Check-In", "Team Meeting"];
        defaultType = "Lecture";
      } else if (role === "TA") {
        // TA can create any type except Lecture
        options = ["OH", "TA Check-In", "Team Meeting"];
        defaultType = "OH";
      } else {
        // Students can only create Team Meeting
        options = ["Team Meeting"];
        defaultType = "Team Meeting";
      }

      options.forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        els.meetingTypeSelect.appendChild(option);
      });

      els.meetingTypeSelect.value = defaultType;
    }

    /**
     * Load all users and teams for the course
     * @returns {Promise<void>}
     */
    async function loadAllUsersAndTeams() {
      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) return;

      try {
        allUsers = await getAllCourseUsers(courseUUID) || [];
        } catch (error) {
          allUsers = [];
        els.participantsContainer.innerHTML = `<p style="color: #666; padding: 10px;">Unable to load participants: ${error.message}</p>`;
          return;
        }

        try {
        allTeams = await getCourseTeams(courseUUID) || [];
      } catch {
          allTeams = [];
        }

        populateParticipantsContainer();
        populateTeamSelector();
    }

    /**
     * Populate the team selector dropdown with course teams
     */
    function populateTeamSelector() {
      if (!els.selectByTeamDropdown) return;
      els.selectByTeamDropdown.innerHTML = "<option value=\"\">Add by Team...</option>";
      if (!allTeams?.length) return;

      allTeams.forEach(team => {
        const option = document.createElement("option");
        option.value = team.teamUuid;
        option.textContent = team.teamName || `Team ${team.teamUuid.substring(0, 8)}`;
        els.selectByTeamDropdown.appendChild(option);
      });
    }

    /**
     * Create a participant checkbox element
     * @param {Object} user - User object with userUuid, firstName, lastName
     * @returns {HTMLElement} Label element with checkbox
     */
    function createParticipantCheckbox(user) {
      const label = document.createElement("label");
      label.classList.add("participant");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = user.userUuid;
      checkbox.dataset.userUuid = user.userUuid;

      const nameSpan = document.createElement("span");
      nameSpan.classList.add("participant-name");
      nameSpan.textContent = `${user.firstName} ${user.lastName}`;

      label.appendChild(checkbox);
      label.appendChild(nameSpan);
      return label;
    }

    /**
     * Populate the participants container with user data, organized by team
     */
    function populateParticipantsContainer() {
      els.participantsContainer.innerHTML = "";

      if (!allUsers?.length) {
        els.participantsContainer.innerHTML = "<p style='padding: 10px; color: #666;'>No users found for this course.</p>";
        return;
      }

      const usersByTeam = {};
      const usersWithoutTeam = [];

      allUsers.forEach(user => {
        if (user.teamUuid?.trim()) {
          if (!usersByTeam[user.teamUuid]) usersByTeam[user.teamUuid] = [];
          usersByTeam[user.teamUuid].push(user);
        } else {
          usersWithoutTeam.push(user);
        }
      });

      allTeams.forEach(team => {
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

          els.participantsContainer.appendChild(teamSection);
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

        els.participantsContainer.appendChild(noTeamSection);
      }
    }

    /**
     * Select all participants in the participants container
     */
    function selectAllParticipants() {
      els.participantsContainer.querySelectorAll("input[type=\"checkbox\"]").forEach(cb => cb.checked = true);
    }

    /**
     * Deselect all participants in the participants container
     */
    function deselectAllParticipants() {
      els.participantsContainer.querySelectorAll("input[type=\"checkbox\"]").forEach(cb => cb.checked = false);
    }

    /**
     * Select participants by team
     * @param {string} teamUuid - Team UUID to select
     */
    function selectParticipantsByTeam(teamUuid) {
      if (!teamUuid) return;

      const team = allTeams.find(t => t.teamUuid === teamUuid);
      if (!team) return;

      const teamUserUuids = new Set();
      if (team.members?.length) {
        team.members.forEach(member => teamUserUuids.add(member.userUuid));
      } else {
        allUsers.forEach(user => {
          if (user.teamUuid === teamUuid) teamUserUuids.add(user.userUuid);
        });
      }

      els.participantsContainer.querySelectorAll("input[type=\"checkbox\"]").forEach(cb => {
        if (teamUserUuids.has(cb.value)) cb.checked = true;
      });

      els.selectByTeamDropdown.value = "";
    }

    /**
     * Load meetings from the backend and populate the calendar
     * Filters meetings where user is creator or participant
     * @returns {Promise<void>}
     */
    async function loadMeetingsFromBackend() {
      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) return;

      try {
        const meetingList = await getMeetingList(courseUUID);
        Object.keys(meetings).forEach(key => delete meetings[key]);

        meetingList.forEach(meeting => {
          const meetingDateObj = parseMeetingDate(meeting.meetingDate);
          if (!meetingDateObj || isNaN(meetingDateObj.getTime())) return;

          const dateStr = formatDate(meetingDateObj);
          if (!meetings[dateStr]) meetings[dateStr] = [];

          const startTime = meeting.meetingStartTime instanceof Date
            ? meeting.meetingStartTime
            : new Date(meeting.meetingStartTime);

          if (isNaN(startTime.getTime())) return;

          const timeStr = `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`;

          meetings[dateStr].push({
            title: meeting.meetingTitle,
            time: timeStr,
            type: mapMeetingTypeToString(meeting.meetingType),
            desc: meeting.meetingDescription || "",
            participants: [],
            chainId: meeting.parentMeetingUUID || meeting.parentMeetingUuid || null,
            meetingUUID: meeting.meetingUUID || meeting.meetingUuid,
            isRecurring: meeting.isRecurring,
            creatorUUID: meeting.creatorUUID || meeting.creatorUuid || null,
            meetingStartTime: meeting.meetingStartTime,
            meetingEndTime: meeting.meetingEndTime
          });
        });

        // Sort meetings by start time for each date
        Object.keys(meetings).forEach(dateKey => {
          meetings[dateKey].sort((a, b) => {
            const timeA = a.meetingStartTime instanceof Date ? a.meetingStartTime : new Date(a.meetingStartTime);
            const timeB = b.meetingStartTime instanceof Date ? b.meetingStartTime : new Date(b.meetingStartTime);
            return timeA - timeB;
          });
        });

        renderCalendar();
      } catch (error) {
        // Continue with empty meetings if load fails
      }
    }

    /**
     * Load course dates to restrict calendar navigation
     * @returns {Promise<void>}
     */
    async function loadCourseDates() {
      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) return;

      try {
        const course = await getCourseDetails(courseUUID);
        if (course?.term) {
          courseStartDate = course.term.startDate ? new Date(course.term.startDate) : null;
          courseEndDate = course.term.endDate ? new Date(course.term.endDate) : null;

          if (courseStartDate) courseStartDate.setHours(0, 0, 0, 0);
          if (courseEndDate) courseEndDate.setHours(23, 59, 59, 999);

          if (courseStartDate && currentDate < courseStartDate) currentDate = new Date(courseStartDate);
          if (courseEndDate && currentDate > courseEndDate) currentDate = new Date(courseEndDate);

          updateNavigationButtons();
        }
      } catch (error) {
        // Continue without date restrictions
      }
    }

    /**
     * Check if a date is within the course date range
     * @param {Date} date - Date to check
     * @returns {boolean} True if date is within course dates
     */
    function isDateWithinCourseRange(date) {
      if (!courseStartDate || !courseEndDate) return false;
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate >= courseStartDate && checkDate <= courseEndDate;
    }

    /**
     * Check if a month is within the course date range
     * @param {Date} date - Date representing the month to check
     * @returns {boolean} True if any day in the month is within course dates
     */
    function isMonthWithinCourseRange(date) {
      if (!courseStartDate || !courseEndDate) return false;
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      return firstDayOfMonth <= courseEndDate && lastDayOfMonth >= courseStartDate;
    }

    /**
     * Update navigation button states based on course dates
     */
    function updateNavigationButtons() {
      if (!els.prevBtn || !els.nextBtn || !els.todayBtn) return;

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const canGoPrev = isMonthWithinCourseRange(new Date(year, month - 1, 1));
      const canGoNext = isMonthWithinCourseRange(new Date(year, month + 1, 1));
      const canGoToToday = isDateWithinCourseRange(new Date());

      els.prevBtn.disabled = !canGoPrev;
      els.prevBtn.title = canGoPrev ? "Previous month" : "Cannot navigate before course start date";
      els.nextBtn.disabled = !canGoNext;
      els.nextBtn.title = canGoNext ? "Next month" : "Cannot navigate after course end date";
      els.todayBtn.disabled = !canGoToToday;
      els.todayBtn.title = canGoToToday ? "Go to today" : "Today is outside the course date range";
    }

    /**
     * Update the recurring meeting summary text based on selected dates
     */
    function updateRecurringSummary() {
      if (!els.recurringSummaryEl) return;

      const anchorValue = selectedCalendarDate || els.meetingDateInput?.value || "";
      const startValue = els.meetingDateInput?.value || anchorValue;
      const endValue = els.recurringEndInput?.value || "";

      if (!anchorValue) {
        els.recurringSummaryEl.textContent = "Select a date to preview the repeating schedule.";
        return;
      }

      const anchorDate = parseLocalDate(anchorValue);
      if (!anchorDate) {
        els.recurringSummaryEl.textContent = "Choose a valid start date to see the repeat range.";
        return;
      }

      if (!els.recurringCheckbox?.checked) {
        els.recurringSummaryEl.textContent = "Recurring is off.";
        return;
      }

      if (!endValue) {
      const startLabel = anchorDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        els.recurringSummaryEl.textContent = `Repeats weekly beginning on the selected date, ${startLabel}. Pick an end date to finish the series.`;
        return;
      }

      const endDate = parseLocalDate(endValue);
      if (!endDate) {
        els.recurringSummaryEl.textContent = "Choose a valid end date to finish the series.";
        return;
      }

      const baseDate = parseLocalDate(startValue || anchorValue);
      if (endDate < baseDate) {
        els.recurringSummaryEl.textContent = "End date must be on or after the first meeting.";
        return;
      }

      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const totalMeetings = Math.max(1, Math.floor((endDate - baseDate) / weekMs) + 1);
      const endLabel = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      els.recurringSummaryEl.textContent = `Creates ${totalMeetings} weekly meetings through ${endLabel}.`;
    }

    /**
     * Sync recurring control state and update summary
     */
    function syncRecurringControlState() {
      if (els.recurringEndInput) {
        els.recurringEndInput.disabled = !els.recurringCheckbox?.checked;
      }
      updateRecurringSummary();
    }

    els.meetingDateInput?.addEventListener("change", e => {
      selectedCalendarDate = e.target.value || selectedCalendarDate;
      updateRecurringSummary();
    });
    els.recurringEndInput?.addEventListener("change", updateRecurringSummary);
    els.recurringCheckbox?.addEventListener("change", syncRecurringControlState);

    // Auto-set end time to 1 hour after start time when start time changes
    els.meetingTimeInput?.addEventListener("change", () => {
      if (!els.meetingEndTimeInput) return;
      const startTime = els.meetingTimeInput.value;
      if (!startTime) return;

      // Only auto-set if end time is empty
      if (!els.meetingEndTimeInput.value) {
        const [hours, minutes] = startTime.split(":").map(Number);
        const endHours = (hours + 1) % 24;
        const endTimeStr = `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        els.meetingEndTimeInput.value = endTimeStr;
      }
    });

    /**
     * Render the calendar grid with meetings for the current month
     */
    function renderCalendar() {
      els.calendarGrid.innerHTML = "";

      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const headersDiv = document.createElement("div");
      headersDiv.classList.add("calendar-days");
      daysOfWeek.forEach(day => {
        const dayDiv = document.createElement("div");
        dayDiv.textContent = day;
        headersDiv.appendChild(dayDiv);
      });
      els.calendarGrid.appendChild(headersDiv);

      const datesContainer = document.createElement("div");
      datesContainer.classList.add("calendar-dates");

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      els.currentMonthEl.textContent = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.classList.add("calendar-day");
        datesContainer.appendChild(empty);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let day = 1; day <= daysInMonth; day++) {
        const dateDiv = document.createElement("div");
        dateDiv.classList.add("calendar-day");

        const fullDate = formatDate(new Date(year, month, day));
        const currentDateObj = new Date(year, month, day);
        const isPastDate = currentDateObj < today;

        if (isPastDate) dateDiv.classList.add("past-date");
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
          dateDiv.classList.add("today");
        }

        const num = document.createElement("div");
        num.classList.add("date-number");
        num.textContent = day;
        dateDiv.appendChild(num);

        if (meetings[fullDate]) {
          meetings[fullDate].forEach((m, idx) => {
            const meetDiv = document.createElement("div");
            meetDiv.classList.add("meeting-tag", `type-${m.type.toLowerCase().replace(/\s+/g, "")}`);
            meetDiv.textContent = m.title;
            meetDiv.addEventListener("click", async (e) => {
              e.stopPropagation();
              await openMeetingAttendance(fullDate, idx);
            });
            dateDiv.appendChild(meetDiv);
          });
        }

        if (!isPastDate) {
          dateDiv.addEventListener("click", async () => {
            els.meetingTitleInput.value = "";
            els.meetingDateInput.value = fullDate;
            selectedCalendarDate = fullDate;
            els.meetingTimeInput.value = "";
            if (els.meetingEndTimeInput) els.meetingEndTimeInput.value = "";
            // Set default meeting type based on user role
            const courseUUID = getCourseIdFromUrl();
            const role = getUserRoleInCourse(courseUUID);
            if (role === "Professor") {
              els.meetingTypeSelect.value = "Lecture";
            } else if (role === "TA") {
              els.meetingTypeSelect.value = "OH";
            } else {
              els.meetingTypeSelect.value = "Team Meeting";
            }
            els.meetingDescTextarea.value = "";
            if (els.meetingLocationInput) els.meetingLocationInput.value = "";
            els.recurringCheckbox.checked = false;
            if (els.recurringEndInput) els.recurringEndInput.value = "";
            syncRecurringControlState();
            els.participantsContainer.querySelectorAll("input[type=\"checkbox\"]").forEach(cb => cb.checked = false);
            await loadAllUsersAndTeams();
            els.meetingModal.classList.remove("hidden");
          });
        }

        datesContainer.appendChild(dateDiv);
      }

      els.calendarGrid.appendChild(datesContainer);
      updateNavigationButtons();
    }

    /**
     * Open meeting attendance modal with meeting details
     * Shows different views for creator vs participant
     * @param {string} date - Date string (YYYY-MM-DD)
     * @param {number} index - Index of meeting in the date's meetings array
     * @returns {Promise<void>}
     */
    async function openMeetingAttendance(date, index) {
      const meeting = meetings[date][index];
      const currentUser = getCurrentUser();
      const creatorUUID = meeting.creatorUUID || meeting.creatorUuid;
      const isCreator = currentUser && creatorUUID && creatorUUID === currentUser.userUuid;

      container.querySelector("#attendance-meeting-title").textContent = meeting.title;
      container.querySelector("#attendance-meeting-date").textContent = date;
      container.querySelector("#attendance-meeting-time").textContent = meeting.time;
      container.querySelector("#attendance-meeting-type").textContent = meeting.type;
      container.querySelector("#attendance-meeting-desc").textContent = meeting.desc || "";
      container.querySelector("#attendance-meeting-participants").textContent = "Loading...";

      let participantNames = [];
      if (meeting.meetingUUID) {
        try {
          const courseUUID = getCourseIdFromUrl();
          const participants = await getMeetingParticipants(meeting.meetingUUID, courseUUID);

          participantNames = participants
            .map(p => {
              if (p.user) return `${p.user.firstName} ${p.user.lastName}`;
              const participantUuid = p.participantUuid || p.participantUUID;
              const user = allUsers.find(u => u.userUuid === participantUuid);
              if (user) return `${user.firstName} ${user.lastName}`;
              return participantUuid ? `User ${participantUuid.substring(0, 8)}...` : "Unknown";
            })
            .filter(name => name);

          if (participantNames.length === 0) participantNames = ["No participants"];
        } catch (error) {
          participantNames = ["Unable to load participants"];
        }
      }

      container.querySelector("#attendance-meeting-participants").textContent = participantNames.length > 0
        ? participantNames.join(", ")
        : "No participants";

      activeMeetingContext = {
        date, index, chainId: meeting.chainId || null,
        meetingUUID: meeting.meetingUUID || null,
        creatorUUID: meeting.creatorUUID || null,
        isRecurring: meeting.isRecurring || false,
        parentMeetingUUID: meeting.chainId || null,
        meetingStartTime: meeting.meetingStartTime || null,
        meetingEndTime: meeting.meetingEndTime || null
      };

      if (els.deleteAllFutureBtn) {
        els.deleteAllFutureBtn.disabled = !(meeting.isRecurring || meeting.chainId);
      }

      const showDelete = isCreator ? "block" : "none";
      if (els.deleteMeetingBtn) els.deleteMeetingBtn.style.display = showDelete;
      if (els.deleteAllFutureBtn) els.deleteAllFutureBtn.style.display = showDelete;

      if (isCreator) {
        if (els.creatorView) els.creatorView.classList.remove("hidden");
        if (els.participantView) els.participantView.classList.add("hidden");
        await loadMeetingCode(meeting.meetingUUID);
      } else {
        if (els.creatorView) els.creatorView.classList.add("hidden");
        if (els.participantView) els.participantView.classList.remove("hidden");
        if (els.attendancePasscodeInput) els.attendancePasscodeInput.value = "";
      }

      els.meetingContentModalWrapper.classList.remove("hidden");
    }

    /**
     * Load meeting code and QR code for creator view
     * Creates code on-demand if it doesn't exist
     * @param {string} meetingUUID - Meeting UUID
     * @returns {Promise<void>}
     */
    async function loadMeetingCode(meetingUUID) {
      if (!meetingUUID) return;

      try {
        const codeData = await getMeetingCode(meetingUUID);
        const qrUrl = codeData.qrUrl || codeData.qr_code_url || codeData.qrCodeUrl;
        const meetingCode = codeData.meetingCode || codeData.meeting_code || codeData.code;

        if (els.qrCodeImage) {
          if (qrUrl) {
            els.qrCodeImage.src = qrUrl;
            els.qrCodeImage.alt = "Meeting QR Code";
            els.qrCodeImage.style.display = "block";
          } else {
            els.qrCodeImage.src = "";
            els.qrCodeImage.alt = "QR code not available";
            els.qrCodeImage.style.display = "none";
          }
        }

        if (els.meetingCodeDisplay) {
          els.meetingCodeDisplay.textContent = meetingCode || "No code generated yet";
        }
      } catch (error) {
        if (error.message?.includes("404") || error.message?.includes("not found")) {
          try {
            const createResponse = await fetch(`/v1/api/attendance/meeting_code/${meetingUUID}`, {
              method: "POST",
              credentials: "include"
            });

            if (createResponse.ok) {
              const newCodeData = await createResponse.json();
              const createdCode = newCodeData.data || newCodeData;

              if (els.qrCodeImage && createdCode.qrUrl) {
                els.qrCodeImage.src = createdCode.qrUrl;
                els.qrCodeImage.alt = "Meeting QR Code";
                els.qrCodeImage.style.display = "block";
              }
              if (els.meetingCodeDisplay && createdCode.meetingCode) {
                els.meetingCodeDisplay.textContent = createdCode.meetingCode;
              }
              return;
            }
          } catch (createError) {
            // Failed to create code
          }
        }

        if (els.meetingCodeDisplay) els.meetingCodeDisplay.textContent = "No code generated yet";
        if (els.qrCodeImage) {
          els.qrCodeImage.src = "";
          els.qrCodeImage.alt = "QR code not available";
          els.qrCodeImage.style.display = "none";
        }
      }
    }

    /**
     * Copy meeting code to clipboard
     */
    function copyMeetingCode() {
      if (!els.meetingCodeDisplay) return;

      const code = (els.meetingCodeDisplay.textContent || "").trim();
      if (!code || code === "No code generated yet") {
        alert("No meeting code available to copy yet.");
        return;
      }

      const showCopiedState = () => {
        if (!els.copyCodeBtn) return;
        const originalText = els.copyCodeBtn.textContent;
        els.copyCodeBtn.textContent = "Copied!";
        els.copyCodeBtn.disabled = true;
        setTimeout(() => {
          els.copyCodeBtn.textContent = originalText;
          els.copyCodeBtn.disabled = false;
        }, 2000);
      };

      const fallbackCopy = text => {
        const tempInput = document.createElement("textarea");
        tempInput.value = text;
        tempInput.setAttribute("readonly", "");
        tempInput.style.position = "absolute";
        tempInput.style.left = "-9999px";
        document.body.appendChild(tempInput);
        tempInput.select();
        tempInput.setSelectionRange(0, text.length);
        let copied = false;
        try {
          copied = document.execCommand("copy");
        } catch {
          copied = false;
        }
        document.body.removeChild(tempInput);
        return copied;
      };

      (navigator.clipboard?.writeText(code) || Promise.reject(new Error("Clipboard API unavailable")))
        .then(showCopiedState)
        .catch(() => {
          if (fallbackCopy(code)) {
            showCopiedState();
          } else {
            alert("Failed to copy code. Please copy manually: " + code);
          }
        });
    }

    /**
     * Start camera for QR code scanning
     * @returns {Promise<void>}
     */
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
        });

        cameraStream = stream;
        if (els.qrScannerVideo) els.qrScannerVideo.srcObject = stream;
        if (els.startCameraBtn) els.startCameraBtn.classList.add("hidden");
        if (els.stopCameraBtn) els.stopCameraBtn.classList.remove("hidden");
        startQRScanning();
      } catch (error) {
        alert("Failed to access camera. Please check permissions and try again.");
      }
    }

    /**
     * Stop camera and QR scanning
     */
    function stopCamera() {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }

      if (els.qrScannerVideo) els.qrScannerVideo.srcObject = null;
      if (qrScanningInterval) {
        clearInterval(qrScanningInterval);
        qrScanningInterval = null;
      }

      if (els.startCameraBtn) els.startCameraBtn.classList.remove("hidden");
      if (els.stopCameraBtn) els.stopCameraBtn.classList.add("hidden");
    }

    /**
     * Load jsQR library dynamically for QR code scanning
     * @returns {Promise<void>}
     */
    function loadQRCodeLibrary() {
      return new Promise((resolve, reject) => {
        if (typeof jsQR !== "undefined") {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    /**
     * Start QR code scanning using camera
     * Uses jsQR library if available
     */
    function startQRScanning() {
      if (!els.qrScannerVideo || !els.qrScannerCanvas) return;

      if (typeof jsQR === "undefined") {
        loadQRCodeLibrary().then(() => {
          if (typeof jsQR !== "undefined") startQRScanningWithLibrary();
        }).catch(() => {
          alert("QR code scanning library could not be loaded. Please use manual code entry.");
        });
        return;
      }

      startQRScanningWithLibrary();
    }

    /**
     * Start QR code scanning with jsQR library
     */
    function startQRScanningWithLibrary() {
      if (!els.qrScannerVideo || !els.qrScannerCanvas || typeof jsQR === "undefined") return;

      qrScanningInterval = setInterval(() => {
        if (els.qrScannerVideo.readyState === els.qrScannerVideo.HAVE_ENOUGH_DATA) {
          const canvas = els.qrScannerCanvas;
          const video = els.qrScannerVideo;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            clearInterval(qrScanningInterval);
            qrScanningInterval = null;

            let extractedCode = code.data;
            const codeMatch = code.data.match(/[?&]code=([A-Z0-9]+)/i);
            if (codeMatch) extractedCode = codeMatch[1].toUpperCase();

            handleQRCodeScan(extractedCode);
          }
        }
      }, 100);
    }

    /**
     * Check if current time is within meeting time window
     * @param {string|Date} startTime - Meeting start time
     * @param {string|Date} endTime - Meeting end time
     * @returns {Object} { isValid: boolean, message: string }
     */
    function validateMeetingTimeWindow(startTime, endTime) {
      if (!startTime || !endTime) {
        return { isValid: false, message: "Meeting time information not available" };
      }

      const now = new Date();
      const start = startTime instanceof Date ? startTime : new Date(startTime);
      const end = endTime instanceof Date ? endTime : new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { isValid: false, message: "Invalid meeting time format" };
      }

      if (now < start) {
        const startStr = start.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
        return { isValid: false, message: `Attendance can only be submitted during the meeting time.\n\nMeeting starts at: ${startStr}` };
      }

      if (now > end) {
        const endStr = end.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
        return { isValid: false, message: `Attendance submission window has closed.\n\nMeeting ended at: ${endStr}` };
      }

      return { isValid: true, message: "" };
    }

    /**
     * Submit attendance using code (manual entry)
     * @returns {Promise<void>}
     */
    async function submitAttendance() {
      const code = els.attendancePasscodeInput?.value.trim().toUpperCase() || "";
      const { meetingUUID, meetingStartTime, meetingEndTime } = activeMeetingContext;

      if (!code) {
        alert("Please enter a code");
        return;
      }

      if (!meetingUUID) {
        alert("Meeting information not available");
        return;
      }

      const timeValidation = validateMeetingTimeWindow(meetingStartTime, meetingEndTime);
      if (!timeValidation.isValid) {
        alert(timeValidation.message);
        return;
      }

      try {
        await recordAttendanceByCode(meetingUUID, code);
        alert("Attendance recorded successfully!");
        els.meetingContentModalWrapper.classList.add("hidden");
        stopCamera();
        if (els.attendancePasscodeInput) els.attendancePasscodeInput.value = "";
      } catch (error) {
        const isTimeError = error.message?.includes("not valid at this time") || error.message?.includes("time");
        alert(isTimeError
          ? `Cannot submit attendance: ${error.message}\n\nPlease ensure you are submitting during the meeting's scheduled time.`
          : `Failed to submit attendance: ${error.message}`);
      }
    }

    /**
     * Handle QR code scan result
     * @param {string} code - Scanned QR code
     * @returns {Promise<void>}
     */
    async function handleQRCodeScan(code) {
      if (!code?.trim()) return;

      const { meetingUUID, meetingStartTime, meetingEndTime } = activeMeetingContext;
      if (!meetingUUID) return;

      const timeValidation = validateMeetingTimeWindow(meetingStartTime, meetingEndTime);
      if (!timeValidation.isValid) {
        alert(timeValidation.message);
        return;
      }

      try {
        await recordAttendanceByCode(meetingUUID, code.trim().toUpperCase());
        alert("Attendance recorded successfully from QR code!");
        els.meetingContentModalWrapper.classList.add("hidden");
        stopCamera();
      } catch (error) {
        const isTimeError = error.message?.includes("not valid at this time") || error.message?.includes("time");
        alert(isTimeError
          ? `Cannot submit attendance: ${error.message}\n\nPlease ensure you are submitting during the meeting's scheduled time.`
          : `Failed to submit attendance: ${error.message}`);
      }
    }

    els.deleteMeetingBtn?.addEventListener("click", async () => {
      const { date, index, meetingUUID } = activeMeetingContext;

      if (!date || typeof index !== "number" || !meetingUUID) {
        alert("Meeting information not available.");
        return;
      }

      const meeting = meetings[date]?.[index];
      const isRecurring = meeting?.isRecurring || meeting?.chainId;

      const confirmMessage = isRecurring
        ? "Delete this meeting? (This will only delete this occurrence, not future recurring meetings.)"
        : "Delete this meeting from the calendar?";

      if (!confirm(confirmMessage)) return;

      try {
        await deleteMeeting(meetingUUID, false);
      } catch (error) {
        alert(`Failed to delete meeting: ${error.message}\n\nThe meeting may have already been deleted or you may not have permission.`);
        return;
      }

      await loadMeetingsFromBackend();
      activeMeetingContext = { date: null, index: null, chainId: null, meetingUUID: null, creatorUUID: null };
      if (els.deleteAllFutureBtn) els.deleteAllFutureBtn.disabled = true;
      els.meetingContentModalWrapper.classList.add("hidden");
    });

    els.deleteAllFutureBtn?.addEventListener("click", async () => {
      const { chainId, date, meetingUUID } = activeMeetingContext;

      if (!chainId || !date || !meetingUUID) {
        alert("Cannot delete future meetings: Meeting information not available.");
        return;
      }

      const meeting = meetings[date]?.[activeMeetingContext.index];
      if (!meeting?.isRecurring) {
        alert("This meeting is not part of a recurring series.");
        return;
      }

      if (!confirm("Delete this meeting and ALL future recurring meetings in this series?\n\nThis action cannot be undone. All future occurrences will be removed from the calendar.")) return;

      try {
        await deleteMeeting(meetingUUID, true);
      } catch (error) {
        alert(`Failed to delete future meetings: ${error.message}\n\nThe meetings may have already been deleted or you may not have permission.`);
        return;
      }

      await loadMeetingsFromBackend();
      activeMeetingContext = { date: null, index: null, chainId: null, meetingUUID: null, creatorUUID: null };
      if (els.deleteAllFutureBtn) els.deleteAllFutureBtn.disabled = true;
      els.meetingContentModalWrapper.classList.add("hidden");
    });

    if (els.startCameraBtn) els.startCameraBtn.onclick = startCamera;
    if (els.stopCameraBtn) els.stopCameraBtn.onclick = stopCamera;
    if (els.submitAttendanceBtn) els.submitAttendanceBtn.onclick = submitAttendance;
    if (els.copyCodeBtn) els.copyCodeBtn.addEventListener("click", copyMeetingCode);

    els.meetingForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) {
        alert("Course ID not found. Please navigate to a course page.");
        return;
      }

      const title = els.meetingTitleInput.value.trim();
      const date = els.meetingDateInput.value;
      const time = els.meetingTimeInput.value;
      const endTime = els.meetingEndTimeInput?.value || "";
      const type = els.meetingTypeSelect.value;
      const desc = els.meetingDescTextarea.value.trim();
      const location = els.meetingLocationInput?.value.trim() || "";
      const recurring = els.recurringCheckbox.checked;

      // Validate end time is provided
      if (!endTime) {
        alert("Please enter an end time for the meeting.");
        return;
      }

      // Validate time constraints
      const meetingStart = new Date(`${date}T${time}`);
      const meetingEnd = new Date(`${date}T${endTime}`);

      if (isNaN(meetingStart.getTime()) || isNaN(meetingEnd.getTime())) {
        alert("Please enter valid start and end times.");
        return;
      }

      if (meetingEnd <= meetingStart) {
        alert("End time must be after start time.");
          return;
        }

      const durationMs = meetingEnd - meetingStart;
      const durationMinutes = durationMs / (1000 * 60);
      const durationHours = durationMinutes / 60;

      if (durationMinutes < 15) {
        alert("Meeting must be at least 15 minutes long.");
        return;
      }

      if (durationHours > 12) {
        alert("Meeting cannot be longer than 12 hours.");
          return;
        }

      // Validate location if provided (must be Zoom link, Google Meet link, or plain text)
      if (location && !isValidMeetingLocation(location)) {
        alert("If entering a URL, please use a valid Zoom link (e.g., https://zoom.us/j/123456789) or Google Meet link (e.g., https://meet.google.com/abc-defg-hij). Otherwise, enter plain text like 'CSE Building, Room 202'.");
          return;
        }

      const allParticipants = Array.from(els.participantsContainer.querySelectorAll("input[type=\"checkbox\"]:checked"))
        .map(cb => cb.value);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const participants = [...new Set(allParticipants.filter(p => uuidRegex.test(p)))];

      const meetingDateTime = new Date(`${date}T${time}`);
      const now = new Date();

      if (meetingDateTime < now) {
        alert("You cannot create a meeting in the past.");
        return;
      }

          const currentUser = getCurrentUser();
      if (!currentUser?.userUuid) {
            alert("User information not available. Please refresh the page.");
            return;
          }

          const meetingTypeInt = parseInt(mapMeetingTypeToInt(type), 10);
          if (!Number.isInteger(meetingTypeInt) || meetingTypeInt < 0 || meetingTypeInt > 3) {
            alert(`Invalid meeting type: ${type}. Please select a valid meeting type.`);
            return;
          }

      const createMeetingData = (dateStr, timeStr, endTimeStr) => {
        const meetingStart = new Date(`${dateStr}T${timeStr}`);
        const meetingEnd = new Date(`${dateStr}T${endTimeStr}`);

        const [dateYear, dateMonth, dateDay] = dateStr.split("-").map(Number);
          const dateWithNoon = new Date(dateYear, dateMonth - 1, dateDay, 12, 0, 0);
          const meetingDateISO = dateWithNoon.toISOString();

        return {
            creatorUUID: currentUser.userUuid,
            courseUUID: courseUUID,
            meetingStartTime: meetingStart.toISOString(),
            meetingEndTime: meetingEnd.toISOString(),
          meetingDate: meetingDateISO,
            meetingTitle: title,
            meetingDescription: desc || null,
          meetingLocation: location || null,
            meetingType: meetingTypeInt,
          isRecurring: false,
          participants
        };
      };

      if (recurring) {
        if (!els.recurringEndInput?.value) {
          alert("Please select an end date for recurring meetings.");
          return;
        }

        const [year, month, day] = date.split("-").map(Number);
        const startDate = new Date(year, month - 1, day);

        const [endYear, endMonth, endDay] = els.recurringEndInput.value.split("-").map(Number);
        const endDate = new Date(endYear, (endMonth || 1) - 1, endDay || 1);

        if (isNaN(endDate.getTime()) || endDate < startDate) {
          alert(endDate < startDate ? "Recurring end date must be on or after the first meeting." : "Please select a valid end date for recurring meetings.");
          return;
        }

        const nextDate = new Date(startDate);
        let parentMeetingUUID = null;

        while (nextDate <= endDate) {
          const nextDateStr = formatDate(nextDate);
          const meetingData = createMeetingData(nextDateStr, time, endTime);

          if (parentMeetingUUID) {
            meetingData.parentMeetingUUID = parentMeetingUUID;
            meetingData.isRecurring = true;
          }

          try {
            const response = await createMeeting(meetingData);
            if (response?.meeting && !parentMeetingUUID) {
              parentMeetingUUID = response.meeting.meetingUUID;
            }
          } catch (error) {
            if (!error.message.includes("201") && !error.message.includes("Created") && !error.message.includes("Failed to fetch")) {
              alert(`Failed to create meeting on ${nextDateStr}: ${error.message}`);
              return;
            }
          }

          nextDate.setDate(nextDate.getDate() + 7);
        }
      } else {
        try {
          await createMeeting(createMeetingData(date, time, endTime));
        } catch (error) {
          if (!error.message.includes("201") && !error.message.includes("Created") && !error.message.includes("Failed to fetch")) {
            alert(`Failed to create meeting: ${error.message}`);
            return;
          }
        }
      }

      await loadMeetingsFromBackend();
      els.meetingModal.classList.add("hidden");
      els.meetingForm.reset();
      if (els.recurringEndInput) els.recurringEndInput.value = "";
      syncRecurringControlState();
    });

    els.closeModalBtn.onclick = () => els.meetingModal.classList.add("hidden");
    els.closeMeetingContentBtn.onclick = () => {
      stopCamera();
      activeMeetingContext = { date: null, index: null, chainId: null, meetingUUID: null, creatorUUID: null };
      if (els.deleteAllFutureBtn) els.deleteAllFutureBtn.disabled = true;
      els.meetingContentModalWrapper.classList.add("hidden");
    };

    els.prevBtn.onclick = () => {
      if (els.prevBtn.disabled) return;
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      if (isMonthWithinCourseRange(newDate)) {
        currentDate = newDate;
        renderCalendar();
        updateNavigationButtons();
      } else {
        alert("Cannot navigate before the course start date.");
        updateNavigationButtons();
      }
    };

    els.nextBtn.onclick = () => {
      if (els.nextBtn.disabled) return;
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      if (isMonthWithinCourseRange(newDate)) {
        currentDate = newDate;
        renderCalendar();
        updateNavigationButtons();
      } else {
        alert("Cannot navigate after the course end date.");
        updateNavigationButtons();
      }
    };

    els.todayBtn.onclick = () => {
      if (els.todayBtn.disabled) return;
      const today = new Date();
      if (isDateWithinCourseRange(today)) {
        currentDate = today;
        renderCalendar();
        updateNavigationButtons();
      } else {
        alert("Today is outside the course date range. Please select a date within the course period.");
        updateNavigationButtons();
      }
    };

    syncRecurringControlState();
    renderCalendar();

    if (els.prevBtn) els.prevBtn.disabled = true;
    if (els.nextBtn) els.nextBtn.disabled = true;
    if (els.todayBtn) els.todayBtn.disabled = true;

    const courseUUID = getCourseIdFromUrl();
    if (courseUUID) {
      await loadUserContext(courseUUID);
      setupMeetingTypeOptions();
    }

    if (els.selectAllBtn) els.selectAllBtn.addEventListener("click", selectAllParticipants);
    if (els.deselectAllBtn) els.deselectAllBtn.addEventListener("click", deselectAllParticipants);
    if (els.selectByTeamDropdown) {
      els.selectByTeamDropdown.addEventListener("change", (e) => selectParticipantsByTeam(e.target.value));
    }

    await loadCourseDates();
    await loadMeetingsFromBackend();
    await loadAllUsersAndTeams();

  } catch (error) {
    container.innerHTML = `<div class='error'>Failed to load calendar: ${error.message}</div>`;
  }
}
