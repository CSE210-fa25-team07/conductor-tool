/**
 * @fileoverview Attendace Feature Main Entry Point
 * Handles calendar and meeting creation on Attendance tab
 */

import { loadTemplate } from "../../utils/templateLoader.js";
import { createMeeting, deleteMeeting, getMeetingList, getAllCourseUsers, getCourseTeams, getMeetingCode, recordAttendanceByCode, getCourseDetails, getMeetingParticipants } from "../../api/attendanceApi.js";
import { loadUserContext, isProfessorOrTA, getUserRoleInCourse, getCurrentUser, getUserTeams } from "../../utils/userContext.js";
import { showClassAnalytics, showIndividualAnalytics, showGroupAnalytics} from "./analyticsindex.js";

const meetings = {};
let currentDate = new Date();
let courseStartDate = null;
let courseEndDate = null;

/**
 * Map meeting type string to integer (0–3)
 * @param {string} typeString - Meeting type as string
 * @returns {number} Meeting type as integer
 */
function mapMeetingTypeToInt(typeString) {
  const typeMap = {
    "Lecture": 0,
    "OH": 1,
    "TA Check-In": 2,
    "Team Meeting": 3
  };
  // Default to Lecture (0) if unknown
  return typeMap[typeString] ?? 0;
}

/**
 * Map meeting type integer to string (0–3)
 * @param {number} typeInt - Meeting type as integer
 * @returns {string} Meeting type as string
 */
function mapMeetingTypeToString(typeInt) {
  const typeMap = {
    0: "Lecture",
    1: "OH",
    2: "TA Check-In",
    3: "Team Meeting"
  };
  return typeMap[typeInt] || "Lecture";
}

export async function render(container, view = "dashboard") {
  if (view == "analysis") {
      await renderAnalysisView(container);
      return;
    }
  try {
    const templateHTML = await loadTemplate("attendance", view);
    container.innerHTML = templateHTML;

    const wrapper = container;
    const calendarGrid = wrapper.querySelector("#calendar-grid");
    const currentMonthEl = wrapper.querySelector("#current-month");
    const prevBtn = wrapper.querySelector("#prev-month");
    const nextBtn = wrapper.querySelector("#next-month");
    const todayBtn = wrapper.querySelector("#today-btn");

    const meetingModal = wrapper.querySelector("#meeting-modal");
    const closeModalBtn = wrapper.querySelector("#close-modal");
    const meetingForm = wrapper.querySelector("#meeting-form");

    const meetingContentModalWrapper = wrapper.querySelector("#meeting-content-modal-wrapper");
    const closeMeetingContentBtn = wrapper.querySelector("#close-meeting-content");

    const meetingTitleInput = wrapper.querySelector("#meeting-title");
    const meetingDateInput = wrapper.querySelector("#meeting-date");
    const meetingTimeInput = wrapper.querySelector("#meeting-time");
    const meetingTypeSelect = wrapper.querySelector("#meeting-type");
    const meetingDescTextarea = wrapper.querySelector("#meeting-description");
    const participantsContainer = wrapper.querySelector("#meeting-participants");
    const selectAllBtn = wrapper.querySelector("#select-all-participants");
    const deselectAllBtn = wrapper.querySelector("#deselect-all-participants");
    const selectByTeamDropdown = wrapper.querySelector("#select-by-team");
    const recurringCheckbox = wrapper.querySelector("#recurring");
    const recurringEndInput = wrapper.querySelector("#recurring-end-date");
    const recurringSummaryEl = wrapper.querySelector("#recurring-summary");
    let selectedCalendarDate = "";
    let userRole = null;
    let canCreateStaffMeetings = false;
    let allUsers = []; // Store all users loaded from backend
    let allTeams = []; // Store all teams loaded from backend

    /**
     * Get course UUID from current URL path
     * URL pattern: /courses/:courseId/attendance
     * @returns {string|null} courseId or null if not in course context
     */
    function getCourseIdFromUrl() {
      const match = window.location.pathname.match(/^\/courses\/([^/]+)/);
      return match ? match[1] : null;
    }

    /**
     * Setup meeting type options based on user role
     * Professors/TAs can create: Lecture, OH, TA Check-In, Team Meeting
     * Students/Team Leads can only create: Team Meeting
     */
    function setupMeetingTypeOptions() {
      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) return;

      canCreateStaffMeetings = isProfessorOrTA(courseUUID);
      userRole = getUserRoleInCourse(courseUUID);

      // Clear existing options
      meetingTypeSelect.innerHTML = "";

      if (canCreateStaffMeetings) {
        // Professors and TAs can create all meeting types
        const options = [
          { value: "Lecture", text: "Lecture" },
          { value: "OH", text: "OH" },
          { value: "TA Check-In", text: "TA Check-In" },
          { value: "Team Meeting", text: "Team Meeting" }
        ];
        options.forEach(opt => {
          const option = document.createElement("option");
          option.value = opt.value;
          option.textContent = opt.text;
          meetingTypeSelect.appendChild(option);
        });
        meetingTypeSelect.value = "Lecture"; // Default for staff
      } else {
        // Students and Team Leads can only create Team Meetings
        const option = document.createElement("option");
        option.value = "Team Meeting";
        option.textContent = "Team Meeting";
        meetingTypeSelect.appendChild(option);
        meetingTypeSelect.value = "Team Meeting";
      }
    }

    /**
     * Load all users and teams for the course
     * @returns {Promise<void>}
     */
    async function loadAllUsersAndTeams() {
      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) {
        return;
      }

      try {
        try {
          const users = await getAllCourseUsers(courseUUID);
          allUsers = users || [];
        } catch (error) {
          allUsers = [];
          participantsContainer.innerHTML = `<p style="color: #666; padding: 10px;">Unable to load participants. Error: ${error.message}</p>`;
          return;
        }

        try {
          const teams = await getCourseTeams(courseUUID);
          allTeams = teams || [];
        } catch (error) {
          allTeams = [];
        }

        populateParticipantsContainer();
        populateTeamSelector();
      } catch (error) {
        allUsers = [];
        allTeams = [];
        participantsContainer.innerHTML = "<p style=\"color: #666; padding: 10px;\">Unable to load participants due to an unexpected error.</p>";
      }
    }

    /**
     * Populate the team selector dropdown
     */
    function populateTeamSelector() {
      if (!selectByTeamDropdown) return;

      // Clear existing options except the first one
      selectByTeamDropdown.innerHTML = "<option value=\"\">Add by Team...</option>";

      if (!allTeams || allTeams.length === 0) {
        return;
      }

      allTeams.forEach(team => {
        const option = document.createElement("option");
        option.value = team.teamUuid;
        option.textContent = team.teamName || `Team ${team.teamUuid.substring(0, 8)}`;
        selectByTeamDropdown.appendChild(option);
      });
    }

    /**
     * Populate the participants container with user data, organized by team
     */
    function populateParticipantsContainer() {
      participantsContainer.innerHTML = "";

      if (!allUsers || allUsers.length === 0) {
        participantsContainer.innerHTML = "<p style='padding: 10px; color: #666;'>No users found for this course.</p>";
        return;
      }

      // Group users by team
      const usersByTeam = {};
      const usersWithoutTeam = [];

      allUsers.forEach(user => {
        if (user.teamUuid && user.teamUuid.trim() !== "") {
          if (!usersByTeam[user.teamUuid]) {
            usersByTeam[user.teamUuid] = [];
          }
          usersByTeam[user.teamUuid].push(user);
        } else {
          usersWithoutTeam.push(user);
        }
      });

      // Create team sections
      allTeams.forEach(team => {
        if (usersByTeam[team.teamUuid] && usersByTeam[team.teamUuid].length > 0) {
          const teamSection = document.createElement("div");
          teamSection.classList.add("team-section");

          const teamHeader = document.createElement("div");
          teamHeader.classList.add("team-header");
          teamHeader.textContent = team.teamName || `Team ${team.teamUuid.substring(0, 8)}`;
          teamSection.appendChild(teamHeader);

          usersByTeam[team.teamUuid].forEach(user => {
            const label = createParticipantCheckbox(user);
            teamSection.appendChild(label);
          });

          participantsContainer.appendChild(teamSection);
        }
      });

      // Add users without teams
      if (usersWithoutTeam.length > 0) {
        const noTeamSection = document.createElement("div");
        noTeamSection.classList.add("team-section");

        const noTeamHeader = document.createElement("div");
        noTeamHeader.classList.add("team-header");
        noTeamHeader.textContent = "No Team";
        noTeamSection.appendChild(noTeamHeader);

        usersWithoutTeam.forEach(user => {
          const label = createParticipantCheckbox(user);
          noTeamSection.appendChild(label);
        });

        participantsContainer.appendChild(noTeamSection);
      }
    }

    /**
     * Create a participant checkbox element
     * @param {Object} user - User object with userUuid, firstName, lastName, email
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
     * Select all participants
     */
    function selectAllParticipants() {
      const checkboxes = participantsContainer.querySelectorAll("input[type=\"checkbox\"]");
      checkboxes.forEach(cb => {
        cb.checked = true;
      });
    }

    /**
     * Deselect all participants
     */
    function deselectAllParticipants() {
      const checkboxes = participantsContainer.querySelectorAll("input[type=\"checkbox\"]");
      checkboxes.forEach(cb => {
        cb.checked = false;
      });
    }

    /**
     * Select participants by team
     * @param {string} teamUuid - Team UUID to select
     */
    function selectParticipantsByTeam(teamUuid) {
      if (!teamUuid) return;

      // Find the team
      const team = allTeams.find(t => t.teamUuid === teamUuid);
      if (!team) return;

      // Get all user UUIDs in this team
      const teamUserUuids = new Set();
      if (team.members && team.members.length > 0) {
        team.members.forEach(member => {
          teamUserUuids.add(member.userUuid);
        });
      } else {
        // Fallback: use users from allUsers that have this teamUuid
        allUsers.forEach(user => {
          if (user.teamUuid === teamUuid) {
            teamUserUuids.add(user.userUuid);
          }
        });
      }

      // Check all checkboxes for users in this team
      const checkboxes = participantsContainer.querySelectorAll("input[type=\"checkbox\"]");
      checkboxes.forEach(cb => {
        if (teamUserUuids.has(cb.value)) {
          cb.checked = true;
        }
      });

      // Reset dropdown
      selectByTeamDropdown.value = "";
    }

    /**
     * Load meetings from the backend and populate the calendar
     * This loads all meetings where the current user is either:
     * - The creator of the meeting, OR
     * - A participant in the meeting
     * This ensures all invited participants see meetings on their calendars.
     * @returns {Promise<void>}
     */
    async function loadMeetingsFromBackend() {
      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) {
        return;
      }

      try {
        const meetingList = await getMeetingList(courseUUID);

        // Clear existing meetings
        Object.keys(meetings).forEach(key => delete meetings[key]);

        // Group meetings by date
        meetingList.forEach(meeting => {
          // Handle meetingDate - could be a Date object, ISO string, or date string
          let meetingDateObj;
          const originalDate = meeting.meetingDate;

          if (meeting.meetingDate instanceof Date) {
            meetingDateObj = meeting.meetingDate;
          } else if (typeof meeting.meetingDate === "string") {
            // Check if it's a date-only string (YYYY-MM-DD) or ISO string with time
            if (meeting.meetingDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              meetingDateObj = parseLocalDate(meeting.meetingDate);
            } else {
              const isoMatch = meeting.meetingDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
              if (isoMatch) {
                const [, year, month, day] = isoMatch;
                meetingDateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
              } else {
                const tempDate = new Date(meeting.meetingDate);
                if (!isNaN(tempDate.getTime())) {
                  const year = tempDate.getUTCFullYear();
                  const month = tempDate.getUTCMonth();
                  const day = tempDate.getUTCDate();
                  meetingDateObj = new Date(year, month, day);
                } else {
                  meetingDateObj = parseLocalDate(meeting.meetingDate);
                }
              }
            }
          } else {
            return;
          }

          if (!meetingDateObj || isNaN(meetingDateObj.getTime())) {
            return;
          }

          const dateStr = `${meetingDateObj.getFullYear()}-${String(meetingDateObj.getMonth() + 1).padStart(2, "0")}-${String(meetingDateObj.getDate()).padStart(2, "0")}`;

          if (!meetings[dateStr]) {
            meetings[dateStr] = [];
          }

          // Handle meetingStartTime - could be a Date object or ISO string
          let startTime;
          if (meeting.meetingStartTime instanceof Date) {
            startTime = meeting.meetingStartTime;
          } else {
            startTime = new Date(meeting.meetingStartTime);
          }

          if (isNaN(startTime.getTime())) {
            return;
          }

          const timeStr = `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`;

          meetings[dateStr].push({
            title: meeting.meetingTitle,
            time: timeStr,
            type: mapMeetingTypeToString(meeting.meetingType),
            desc: meeting.meetingDescription || "",
            participants: [], // Will be loaded separately if needed
            chainId: meeting.parentMeetingUUID || meeting.parentMeetingUuid || null,
            meetingUUID: meeting.meetingUUID || meeting.meetingUuid,
            isRecurring: meeting.isRecurring,
            creatorUUID: meeting.creatorUUID || meeting.creatorUuid || null, // Handle both camelCase and PascalCase
            meetingStartTime: meeting.meetingStartTime, // Store for time validation
            meetingEndTime: meeting.meetingEndTime // Store for time validation
          });
        });

        renderCalendar();
      } catch (error) {
        // Continue with empty meetings if load fails
      }
    }

    /**
     * Load course dates to restrict calendar navigation
     */
    async function loadCourseDates() {
      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) {
        return;
      }

      try {
        const course = await getCourseDetails(courseUUID);

        if (course && course.term) {
          const term = course.term;
          courseStartDate = term.startDate ? new Date(term.startDate) : null;
          courseEndDate = term.endDate ? new Date(term.endDate) : null;

          // Set to start of day for accurate comparison
          if (courseStartDate) {
            courseStartDate.setHours(0, 0, 0, 0);
          }
          if (courseEndDate) {
            courseEndDate.setHours(23, 59, 59, 999); // End of day
          }

          // Ensure currentDate is within bounds
          if (courseStartDate && currentDate < courseStartDate) {
            currentDate = new Date(courseStartDate);
          }
          if (courseEndDate && currentDate > courseEndDate) {
            currentDate = new Date(courseEndDate);
          }

          // Update button states
          updateNavigationButtons();
        }
      } catch (error) {
        // Continue without date restrictions if API call fails
      }
    }

    /**
     * Check if a date is within the course date range
     * @param {Date} date - Date to check
     * @returns {boolean} True if date is within course dates
     */
    function isDateWithinCourseRange(date) {
      if (!courseStartDate || !courseEndDate) {
        return false; // If dates not loaded, be conservative and disallow
      }

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
      if (!courseStartDate || !courseEndDate) {
        return false; // If dates not loaded, be conservative and disallow navigation
      }

      const year = date.getFullYear();
      const month = date.getMonth();

      // Check if the first day of the month is before end date
      // and the last day of the month is after start date
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      return firstDayOfMonth <= courseEndDate && lastDayOfMonth >= courseStartDate;
    }

    /**
     * Update navigation button states based on course dates
     */
    function updateNavigationButtons() {
      if (!prevBtn || !nextBtn || !todayBtn) {
        return;
      }

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Check if previous month would be out of bounds
      const prevMonth = new Date(year, month - 1, 1);
      const canGoPrev = isMonthWithinCourseRange(prevMonth);

      // Check if next month would be out of bounds
      const nextMonth = new Date(year, month + 1, 1);
      const canGoNext = isMonthWithinCourseRange(nextMonth);

      // Check if today is within course dates
      const today = new Date();
      const canGoToToday = isDateWithinCourseRange(today);

      if (prevBtn) {
        prevBtn.disabled = !canGoPrev;
        if (!canGoPrev) {
          prevBtn.title = "Cannot navigate before course start date";
        } else {
          prevBtn.title = "Previous month";
        }
      }

      if (nextBtn) {
        nextBtn.disabled = !canGoNext;
        if (!canGoNext) {
          nextBtn.title = "Cannot navigate after course end date";
        } else {
          nextBtn.title = "Next month";
        }
      }

      if (todayBtn) {
        todayBtn.disabled = !canGoToToday;
        if (!canGoToToday) {
          todayBtn.title = "Today is outside the course date range";
        } else {
          todayBtn.title = "Go to today";
        }
      }
    }

    function parseLocalDate(dateStr) {
      if (!dateStr) return null;
      const parts = dateStr.split("-").map(Number);
      if (parts.length !== 3) return null;
      const [year, month, day] = parts;
      if ([year, month, day].some(num => Number.isNaN(num))) return null;
      const date = new Date(year, month - 1, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    function updateRecurringSummary() {
      if (!recurringSummaryEl) return;

      const anchorValue = selectedCalendarDate || (meetingDateInput ? meetingDateInput.value : "");
      const startValue = (meetingDateInput && meetingDateInput.value) ? meetingDateInput.value : anchorValue;
      const endValue = recurringEndInput ? recurringEndInput.value : "";

      if (!anchorValue) {
        recurringSummaryEl.textContent = "Select a date to preview the repeating schedule.";
        return;
      }

      const anchorDate = parseLocalDate(anchorValue);
      if (!anchorDate) {
        recurringSummaryEl.textContent = "Choose a valid start date to see the repeat range.";
        return;
      }

      const baseDate = parseLocalDate(startValue || anchorValue);
      if (!baseDate) {
        recurringSummaryEl.textContent = "Choose a valid start date to see the repeat range.";
        return;
      }

      const startLabel = anchorDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      if (!recurringCheckbox || !recurringCheckbox.checked) {
        recurringSummaryEl.textContent = "Recurring is off.";
        return;
      }

      if (!endValue) {
        recurringSummaryEl.textContent = `Repeats weekly beginning on the selected date, ${startLabel}. Pick an end date to finish the series.`;
        return;
      }

      const endDate = parseLocalDate(endValue);
      if (!endDate) {
        recurringSummaryEl.textContent = "Choose a valid end date to finish the series.";
        return;
      }

      if (endDate < baseDate) {
        recurringSummaryEl.textContent = "End date must be on or after the first meeting.";
        return;
      }

      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const totalMeetings = Math.floor((endDate - baseDate) / weekMs) + 1;
      const safeTotal = Math.max(1, totalMeetings);
      const endLabel = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      recurringSummaryEl.textContent = `Creates ${safeTotal} weekly meetings through ${endLabel}.`;
    }

    function syncRecurringControlState() {
      if (recurringEndInput) {
        const disabled = !recurringCheckbox || !recurringCheckbox.checked;
        recurringEndInput.disabled = disabled;
      }
      updateRecurringSummary();
    }

    meetingDateInput?.addEventListener("change", e => {
      selectedCalendarDate = e.target.value || selectedCalendarDate;
      updateRecurringSummary();
    });
    recurringEndInput?.addEventListener("change", updateRecurringSummary);
    recurringCheckbox?.addEventListener("change", syncRecurringControlState);

    function renderCalendar() {
      calendarGrid.innerHTML = "";

      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const headersDiv = document.createElement("div");
      headersDiv.classList.add("calendar-days");
      daysOfWeek.forEach(day => {
        const dayDiv = document.createElement("div");
        dayDiv.textContent = day;
        headersDiv.appendChild(dayDiv);
      });
      calendarGrid.appendChild(headersDiv);

      const datesContainer = document.createElement("div");
      datesContainer.classList.add("calendar-dates");

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      currentMonthEl.textContent = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.classList.add("calendar-day");
        datesContainer.appendChild(empty);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

      for (let day = 1; day <= daysInMonth; day++) {
        const dateDiv = document.createElement("div");
        dateDiv.classList.add("calendar-day");

        const fullDate = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        const currentDateObj = new Date(year, month, day);

        // Check if this date is in the past
        const isPastDate = currentDateObj < today;

        if (isPastDate) {
          dateDiv.classList.add("past-date");
        }

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
            meetDiv.classList.add("meeting-tag", `type-${m.type.toLowerCase().replace(/\s+/g,"")}`);
            meetDiv.textContent = m.title;
            meetDiv.addEventListener("click", async (e) => {
              e.stopPropagation();
              await openMeetingAttendance(fullDate, idx);
            });
            dateDiv.appendChild(meetDiv);
          });
        }

        // Only allow clicking on future dates or today
        if (!isPastDate) {
          dateDiv.addEventListener("click", async () => {
            // Reset all fields
            meetingTitleInput.value = "";
            meetingDateInput.value = fullDate;
            selectedCalendarDate = fullDate;
            meetingTimeInput.value = "";

            // Set default meeting type based on role
            if (canCreateStaffMeetings) {
              meetingTypeSelect.value = "Lecture";
            } else {
              meetingTypeSelect.value = "Team Meeting";
            }

            meetingDescTextarea.value = "";
            recurringCheckbox.checked = false;
            if (recurringEndInput) recurringEndInput.value = "";
            syncRecurringControlState();
            participantsContainer.querySelectorAll("input[type=\"checkbox\"]").forEach(cb => cb.checked = false);

            // Reload users/teams when opening modal
            await loadAllUsersAndTeams();

            meetingModal.classList.remove("hidden");
          });
        }

        datesContainer.appendChild(dateDiv);
      }

      calendarGrid.appendChild(datesContainer);

      // Update navigation buttons after rendering
      updateNavigationButtons();
    }

    const deleteMeetingBtn = wrapper.querySelector("#delete-meeting");
    const deleteAllFutureBtn = wrapper.querySelector("#delete-future-meetings");
    const creatorView = wrapper.querySelector("#creator-attendance-view");
    const participantView = wrapper.querySelector("#participant-attendance-view");
    const qrCodeImage = wrapper.querySelector("#meeting-qr-code");
    const meetingCodeDisplay = wrapper.querySelector("#meeting-code-display");
    const copyCodeBtn = wrapper.querySelector("#copy-code-btn");
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener("click", copyMeetingCode);
    }
    const qrScannerVideo = wrapper.querySelector("#qr-scanner-video");
    const qrScannerCanvas = wrapper.querySelector("#qr-scanner-canvas");
    const startCameraBtn = wrapper.querySelector("#start-camera-btn");
    const stopCameraBtn = wrapper.querySelector("#stop-camera-btn");
    const submitAttendanceBtn = wrapper.querySelector("#submit-attendance");
    const attendancePasscodeInput = wrapper.querySelector("#attendance-passcode");
    let activeMeetingContext = { date: null, index: null, chainId: null };
    let cameraStream = null;
    let qrScanningInterval = null;

    async function openMeetingAttendance(date, index) {
      const meeting = meetings[date][index];
      const currentUser = getCurrentUser();

      const creatorUUID = meeting.creatorUUID || meeting.creatorUuid;
      const isCreator = currentUser && creatorUUID && creatorUUID === currentUser.userUuid;

      wrapper.querySelector("#attendance-meeting-title").textContent = meeting.title;
      wrapper.querySelector("#attendance-meeting-date").textContent = date;
      wrapper.querySelector("#attendance-meeting-time").textContent = meeting.time;
      wrapper.querySelector("#attendance-meeting-type").textContent = meeting.type;
      wrapper.querySelector("#attendance-meeting-desc").textContent = meeting.desc || "";

      // Load participants for this meeting
      let participantNames = [];
      if (meeting.meetingUUID) {
        try {
          const courseUUID = getCourseIdFromUrl();
          const participants = await getMeetingParticipants(meeting.meetingUUID, courseUUID);

          // Get user info for each participant - backend now includes user info
          participantNames = participants
            .map(p => {
              if (p.user) {
                return `${p.user.firstName} ${p.user.lastName}`;
              }
              // Fallback: try to find in allUsers
              const participantUuid = p.participantUuid || p.participantUUID;
              const user = allUsers.find(u => u.userUuid === participantUuid);
              if (user) {
                return `${user.firstName} ${user.lastName}`;
              }
              // Last resort: show partial UUID
              return participantUuid ? `User ${participantUuid.substring(0, 8)}...` : "Unknown";
            })
            .filter(name => name); // Remove any null/undefined

          if (participantNames.length === 0) {
            participantNames = ["No participants"];
          }
        } catch (error) {
          participantNames = ["Unable to load participants"];
        }
      }

      wrapper.querySelector("#attendance-meeting-participants").textContent = participantNames.length > 0
        ? participantNames.join(", ")
        : "No participants";

      activeMeetingContext = {
        date,
        index,
        chainId: meeting.chainId || null,
        meetingUUID: meeting.meetingUUID || null,
        creatorUUID: meeting.creatorUUID || null,
        isRecurring: meeting.isRecurring || false,
        parentMeetingUUID: meeting.chainId || null, // chainId is the parentMeetingUUID
        meetingStartTime: meeting.meetingStartTime || null, // For time window validation
        meetingEndTime: meeting.meetingEndTime || null // For time window validation
      };

      // Enable "Delete All Future" button only if this is part of a recurring series
      if (deleteAllFutureBtn) {
        const isPartOfRecurringSeries = meeting.isRecurring || meeting.chainId;
        deleteAllFutureBtn.disabled = !isPartOfRecurringSeries;
      }

      // Show/hide delete buttons based on creator status
      if (deleteMeetingBtn) {
        deleteMeetingBtn.style.display = isCreator ? "block" : "none";
      }
      if (deleteAllFutureBtn) {
        deleteAllFutureBtn.style.display = isCreator ? "block" : "none";
      }

      // Show appropriate view based on creator status
      if (isCreator) {
        // Show creator view with QR code and alphanumeric code
        if (creatorView) creatorView.classList.remove("hidden");
        if (participantView) participantView.classList.add("hidden");
        await loadMeetingCode(meeting.meetingUUID);
      } else {
        // Show participant view with camera scanner and code input
        if (creatorView) creatorView.classList.add("hidden");
        if (participantView) participantView.classList.remove("hidden");
        if (attendancePasscodeInput) attendancePasscodeInput.value = "";
      }

      meetingContentModalWrapper.classList.remove("hidden");
    }

    /**
     * Load meeting code and QR code for creator view
     * @param {string} meetingUUID - Meeting UUID
     */
    async function loadMeetingCode(meetingUUID) {
      if (!meetingUUID) {
        return;
      }

      try {
        const codeData = await getMeetingCode(meetingUUID);

        const qrUrl = codeData.qrUrl || codeData.qr_code_url || codeData.qrCodeUrl;
        const meetingCode = codeData.meetingCode || codeData.meeting_code || codeData.code;

        if (qrCodeImage) {
          if (qrUrl) {
            qrCodeImage.src = qrUrl;
            qrCodeImage.alt = "Meeting QR Code";
            qrCodeImage.style.display = "block";
          } else {
            qrCodeImage.src = "";
            qrCodeImage.alt = "QR code not available";
            qrCodeImage.style.display = "none";
          }
        }

        if (meetingCodeDisplay) {
          if (meetingCode) {
            meetingCodeDisplay.textContent = meetingCode;
          } else {
            meetingCodeDisplay.textContent = "No code generated yet";
          }
        }
      } catch (error) {
        if (error.message && (error.message.includes("404") || error.message.includes("not found"))) {
          try {
            const createCodeUrl = `/v1/api/attendance/meeting_code/${meetingUUID}`;
            const createResponse = await fetch(createCodeUrl, {
              method: "POST",
              credentials: "include"
            });

            if (createResponse.ok) {
              const newCodeData = await createResponse.json();
              const createdCode = newCodeData.data || newCodeData;

              if (qrCodeImage && createdCode.qrUrl) {
                qrCodeImage.src = createdCode.qrUrl;
                qrCodeImage.alt = "Meeting QR Code";
                qrCodeImage.style.display = "block";
              }
              if (meetingCodeDisplay && createdCode.meetingCode) {
                meetingCodeDisplay.textContent = createdCode.meetingCode;
              }
              return;
            }
          } catch (createError) {
            // Failed to create code
          }
        }

        // If code doesn't exist and couldn't create, show message
        if (meetingCodeDisplay) {
          meetingCodeDisplay.textContent = "No code generated yet";
        }
        if (qrCodeImage) {
          qrCodeImage.src = "";
          qrCodeImage.alt = "QR code not available";
          qrCodeImage.style.display = "none";
        }
      }
    }

    /**
     * Copy meeting code to clipboard
     */
    function copyMeetingCode() {
      if (!meetingCodeDisplay) return;

      const code = (meetingCodeDisplay.textContent || "").trim();
      if (!code || code === "No code generated yet") {
        alert("No meeting code available to copy yet.");
        return;
      }

      const showCopiedState = () => {
        if (!copyCodeBtn) return;
        const originalText = copyCodeBtn.textContent;
        copyCodeBtn.textContent = "Copied!";
        copyCodeBtn.disabled = true;
        setTimeout(() => {
          copyCodeBtn.textContent = originalText;
          copyCodeBtn.disabled = false;
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

      const clipboardPromise = navigator.clipboard && navigator.clipboard.writeText
        ? navigator.clipboard.writeText(code)
        : Promise.reject(new Error("Clipboard API unavailable"));

      clipboardPromise
        .then(() => {
          showCopiedState();
        })
        .catch(() => {
          const success = fallbackCopy(code);
          if (success) {
            showCopiedState();
          } else {
            alert("Failed to copy code. Please copy manually: " + code);
          }
        });
    }

    /**
     * Start camera for QR code scanning
     */
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Use back camera on mobile
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        cameraStream = stream;
        if (qrScannerVideo) {
          qrScannerVideo.srcObject = stream;
        }

        if (startCameraBtn) startCameraBtn.classList.add("hidden");
        if (stopCameraBtn) stopCameraBtn.classList.remove("hidden");

        // Start QR code scanning
        startQRScanning();
      } catch (error) {
        alert("Failed to access camera. Please check permissions and try again.");
      }
    }

    /**
     * Stop camera
     */
    function stopCamera() {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }

      if (qrScannerVideo) {
        qrScannerVideo.srcObject = null;
      }

      if (qrScanningInterval) {
        clearInterval(qrScanningInterval);
        qrScanningInterval = null;
      }

      if (startCameraBtn) startCameraBtn.classList.remove("hidden");
      if (stopCameraBtn) stopCameraBtn.classList.add("hidden");
    }

    /**
     * Start QR code scanning using camera
     * Uses jsQR library if available, otherwise shows camera feed
     */
    function startQRScanning() {
      if (!qrScannerVideo || !qrScannerCanvas) return;

      if (typeof jsQR === "undefined") {
        loadQRCodeLibrary().then(() => {
          if (typeof jsQR !== "undefined") {
            startQRScanningWithLibrary();
          }
        }).catch(() => {
          alert("QR code scanning library could not be loaded. Please use manual code entry.");
        });
        return;
      }

      startQRScanningWithLibrary();
    }

    /**
     * Load jsQR library dynamically
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
     * Start QR code scanning with jsQR library
     */
    function startQRScanningWithLibrary() {
      if (!qrScannerVideo || !qrScannerCanvas || typeof jsQR === "undefined") return;

      qrScanningInterval = setInterval(() => {
        if (qrScannerVideo.readyState === qrScannerVideo.HAVE_ENOUGH_DATA) {
          const canvas = qrScannerCanvas;
          const video = qrScannerVideo;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Try to decode QR code from canvas
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            // QR code detected - extract meeting code from URL or use code directly

            // Stop scanning
            clearInterval(qrScanningInterval);
            qrScanningInterval = null;

            // Extract code from QR data (might be a URL like /attendance/record/?meeting=...&code=...)
            let extractedCode = code.data;
            const codeMatch = code.data.match(/[?&]code=([A-Z0-9]+)/i);
            if (codeMatch) {
              extractedCode = codeMatch[1].toUpperCase();
            }

            // Handle the scanned code
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
      let start, end;

      // Parse start and end times
      if (startTime instanceof Date) {
        start = startTime;
      } else {
        start = new Date(startTime);
      }

      if (endTime instanceof Date) {
        end = endTime;
      } else {
        end = new Date(endTime);
      }

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { isValid: false, message: "Invalid meeting time format" };
      }

      if (now < start) {
        const startStr = start.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit"
        });
        return {
          isValid: false,
          message: `Attendance can only be submitted during the meeting time.\n\nMeeting starts at: ${startStr}`
        };
      }

      if (now > end) {
        const endStr = end.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit"
        });
        return {
          isValid: false,
          message: `Attendance submission window has closed.\n\nMeeting ended at: ${endStr}`
        };
      }

      return { isValid: true, message: "" };
    }

    /**
     * Submit attendance using code (QR scan or manual entry)
     */
    async function submitAttendance() {
      const code = attendancePasscodeInput ? attendancePasscodeInput.value.trim().toUpperCase() : "";
      const { meetingUUID, meetingStartTime, meetingEndTime } = activeMeetingContext;

      if (!code) {
        alert("Please enter a code");
        return;
      }

      if (!meetingUUID) {
        alert("Meeting information not available");
        return;
      }

      // Validate time window before submitting
      const timeValidation = validateMeetingTimeWindow(meetingStartTime, meetingEndTime);
      if (!timeValidation.isValid) {
        alert(timeValidation.message);
        return;
      }

      try {
        await recordAttendanceByCode(meetingUUID, code);
        alert("Attendance recorded successfully!");
        meetingContentModalWrapper.classList.add("hidden");
        stopCamera();
        if (attendancePasscodeInput) attendancePasscodeInput.value = "";
      } catch (error) {
        // Check if error is due to time window (backend validation)
        if (error.message.includes("not valid at this time") || error.message.includes("time")) {
          alert(`Cannot submit attendance: ${error.message}\n\nPlease ensure you are submitting during the meeting's scheduled time.`);
        } else {
          alert(`Failed to submit attendance: ${error.message}`);
        }
      }
    }

    /**
     * Handle QR code scan result
     * @param {string} code - Scanned QR code
     */
    async function handleQRCodeScan(code) {
      if (!code || !code.trim()) return;

      const { meetingUUID, meetingStartTime, meetingEndTime } = activeMeetingContext;

      if (!meetingUUID) {
        return;
      }

      // Validate time window before submitting
      const timeValidation = validateMeetingTimeWindow(meetingStartTime, meetingEndTime);
      if (!timeValidation.isValid) {
        alert(timeValidation.message);
        return;
      }

      try {
        await recordAttendanceByCode(meetingUUID, code.trim().toUpperCase());
        alert("Attendance recorded successfully from QR code!");
        meetingContentModalWrapper.classList.add("hidden");
        stopCamera();
      } catch (error) {
        // Check if error is due to time window (backend validation)
        if (error.message.includes("not valid at this time") || error.message.includes("time")) {
          alert(`Cannot submit attendance: ${error.message}\n\nPlease ensure you are submitting during the meeting's scheduled time.`);
        } else {
          alert(`Failed to submit attendance: ${error.message}`);
        }
      }
    }

    deleteMeetingBtn?.addEventListener("click", async () => {
      const { date, index, meetingUUID, chainId } = activeMeetingContext;

      if (!date || typeof index !== "number") {
        alert("Meeting information not available.");
        return;
      }

      if (!meetingUUID) {
        alert("Cannot delete meeting: Meeting ID not found.");
        return;
      }

      const meeting = meetings[date] && meetings[date][index];
      const isRecurring = meeting && (meeting.isRecurring || meeting.chainId);

      let confirmMessage = "Delete this meeting from the calendar?";
      if (isRecurring) {
        confirmMessage = "Delete this meeting? (This will only delete this occurrence, not future recurring meetings.)";
      }

      const confirmDelete = confirm(confirmMessage);
      if (!confirmDelete) return;

      // Delete from backend (deleteFuture = false to only delete this meeting)
      try {
        await deleteMeeting(meetingUUID, false);
      } catch (error) {
        alert(`Failed to delete meeting: ${error.message}\n\nThe meeting may have already been deleted or you may not have permission.`);
        return;
      }

      // Reload meetings from backend to reflect deletion for all users
      await loadMeetingsFromBackend();

      // Reset context and close modal
      activeMeetingContext = { date: null, index: null, chainId: null, meetingUUID: null, creatorUUID: null };
      if (deleteAllFutureBtn) deleteAllFutureBtn.disabled = true;
      meetingContentModalWrapper.classList.add("hidden");
    });

    deleteAllFutureBtn?.addEventListener("click", async () => {
      const { chainId, date, meetingUUID } = activeMeetingContext;

      if (!chainId || !date || !meetingUUID) {
        alert("Cannot delete future meetings: Meeting information not available.");
        return;
      }

      const meeting = meetings[date] && meetings[date][activeMeetingContext.index];
      if (!meeting || !meeting.isRecurring) {
        alert("This meeting is not part of a recurring series.");
        return;
      }

      const confirmDelete = confirm(
        "Delete this meeting and ALL future recurring meetings in this series?\n\n" +
        "This action cannot be undone. All future occurrences will be removed from the calendar."
      );

      if (!confirmDelete) return;

      // Delete from backend (deleteFuture = true to delete all future recurring meetings)
      try {
        await deleteMeeting(meetingUUID, true);
      } catch (error) {
        alert(`Failed to delete future meetings: ${error.message}\n\nThe meetings may have already been deleted or you may not have permission.`);
        return;
      }

      // Reload meetings from backend to reflect deletion for all users
      await loadMeetingsFromBackend();

      // Reset context and close modal
      activeMeetingContext = { date: null, index: null, chainId: null, meetingUUID: null, creatorUUID: null };
      if (deleteAllFutureBtn) deleteAllFutureBtn.disabled = true;
      meetingContentModalWrapper.classList.add("hidden");
    });

    // Wire up camera buttons
    if (startCameraBtn) {
      startCameraBtn.onclick = () => {
        startCamera();
      };
    }
    if (stopCameraBtn) {
      stopCameraBtn.onclick = () => {
        stopCamera();
      };
    }

    // Wire up submit attendance button
    if (submitAttendanceBtn) {
      submitAttendanceBtn.onclick = () => {
        submitAttendance();
      };
    }

    meetingForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) {
        alert("Course ID not found. Please navigate to a course page.");
        return;
      }

      const title = meetingTitleInput.value.trim();
      const date = meetingDateInput.value;
      const time = meetingTimeInput.value;
      const type = meetingTypeSelect.value;
      const desc = meetingDescTextarea.value.trim();
      const recurring = recurringCheckbox.checked;

      // Get participants and filter out placeholder names (only keep valid UUIDs)
      const allParticipants = Array.from(participantsContainer.querySelectorAll("input[type=\"checkbox\"]:checked"))
        .map(cb => cb.value);

      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12 hex characters)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let participants = allParticipants.filter(p => uuidRegex.test(p));

      // Remove duplicates
      participants = [...new Set(participants)];


      // Warn if placeholder participants were selected
      const placeholderParticipants = allParticipants.filter(p => !uuidRegex.test(p));

      const meetingDateTime = new Date(`${date}T${time}`);
      const now = new Date();

      if (meetingDateTime < now) {
        alert("You cannot create a meeting in the past.");
        return;
      }

      if (recurring) {
        if (!recurringEndInput || !recurringEndInput.value) {
          alert("Please select an end date for recurring meetings.");
          return;
        }

        const [year, month, day] = date.split("-").map(Number);
        const startDate = new Date(year, month - 1, day);

        const [endYear, endMonth, endDay] = recurringEndInput.value.split("-").map(Number);
        const endDate = new Date(endYear, (endMonth || 1) - 1, endDay || 1);

        if (Number.isNaN(endDate.getTime())) {
          alert("Please select a valid end date for recurring meetings.");
          return;
        }

        if (endDate < startDate) {
          alert("Recurring end date must be on or after the first meeting.");
          return;
        }

        // Create recurring meetings
        const nextDate = new Date(startDate);
        let parentMeetingUUID = null;

        while (nextDate <= endDate) {
          const nextYear = nextDate.getFullYear();
          const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
          const nextDay = String(nextDate.getDate()).padStart(2, "0");
          const nextDateStr = `${nextYear}-${nextMonth}-${nextDay}`;

          // Calculate meeting start and end times
          const [hours, minutes] = time.split(":").map(Number);
          const meetingStart = new Date(nextDate);
          meetingStart.setHours(hours, minutes, 0, 0);
          const meetingEnd = new Date(meetingStart);
          meetingEnd.setHours(meetingStart.getHours() + 1); // Default 1 hour duration

          const currentUser = getCurrentUser();
          if (!currentUser || !currentUser.userUuid) {
            alert("User information not available. Please refresh the page.");
            return;
          }

          const meetingTypeInt = parseInt(mapMeetingTypeToInt(type), 10);

          // Validate meetingType is an integer in [0, 3]
          if (!Number.isInteger(meetingTypeInt) || meetingTypeInt < 0 || meetingTypeInt > 3) {
            alert(`Invalid meeting type: ${type}. Please select a valid meeting type.`);
            return;
          }

          // Create a date string with noon local time to avoid timezone shifts
          // This ensures "2025-12-06" stays as Dec 6 regardless of timezone
          const [dateYear, dateMonth, dateDay] = nextDateStr.split("-").map(Number);
          const dateWithNoon = new Date(dateYear, dateMonth - 1, dateDay, 12, 0, 0);
          const meetingDateISO = dateWithNoon.toISOString();

          const meetingData = {
            creatorUUID: currentUser.userUuid,
            courseUUID: courseUUID,
            meetingStartTime: meetingStart.toISOString(),
            meetingEndTime: meetingEnd.toISOString(),
            meetingDate: meetingDateISO, // Send as ISO string with noon local time
            meetingTitle: title,
            meetingDescription: desc || null,
            meetingLocation: null,
            meetingType: meetingTypeInt,
            isRecurring: true,
            participants: participants // Array of participant UUIDs - these users will see the meeting on their calendars
          };

          // Set parentMeetingUUID for recurring meetings (first one is parent, rest are children)
          if (parentMeetingUUID) {
            meetingData.parentMeetingUUID = parentMeetingUUID;
          }

          try {
            const response = await createMeeting(meetingData);

            // Store parent UUID for next iterations
            if (response && response.meeting && !parentMeetingUUID) {
              parentMeetingUUID = response.meeting.meetingUUID;
            }
          } catch (error) {
            if (error.message.includes("201") || error.message.includes("Created") || error.message.includes("Failed to fetch")) {
              // Continue with next meeting
            } else {
              alert(`Failed to create meeting on ${nextDateStr}: ${error.message}`);
              return;
            }
          }

          nextDate.setDate(nextDate.getDate() + 7);
        }
      } else {
        // Create single meeting
        const [hours, minutes] = time.split(":").map(Number);
        const meetingStart = new Date(meetingDateTime);
        const meetingEnd = new Date(meetingStart);
        meetingEnd.setHours(meetingStart.getHours() + 1); // Default 1 hour duration

        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.userUuid) {
          alert("User information not available. Please refresh the page.");
          return;
        }

        const meetingTypeInt = parseInt(mapMeetingTypeToInt(type), 10);

        // Validate meetingType is an integer in [0, 3]
        if (!Number.isInteger(meetingTypeInt) || meetingTypeInt < 0 || meetingTypeInt > 3) {
          alert(`Invalid meeting type: ${type}. Please select a valid meeting type.`);
          return;
        }

        // Create a date string with noon local time to avoid timezone shifts
        // This ensures "2025-12-06" stays as Dec 6 regardless of timezone
        const [dateYear, dateMonth, dateDay] = date.split("-").map(Number);
        const dateWithNoon = new Date(dateYear, dateMonth - 1, dateDay, 12, 0, 0);
        const meetingDateISO = dateWithNoon.toISOString();

        const meetingData = {
          creatorUUID: currentUser.userUuid,
          courseUUID: courseUUID,
          meetingStartTime: meetingStart.toISOString(),
          meetingEndTime: meetingEnd.toISOString(),
          meetingDate: meetingDateISO, // Send as ISO string with noon local time
          meetingTitle: title,
          meetingDescription: desc || null,
          meetingLocation: null,
          meetingType: meetingTypeInt,
          isRecurring: false,
          participants: participants // Array of participant UUIDs - these users will see the meeting on their calendars
        };

        try {
          await createMeeting(meetingData);
        } catch (error) {
          if (error.message.includes("201") || error.message.includes("Created") || error.message.includes("Failed to fetch")) {
            // Continue - we'll reload meetings to check
          } else {
            alert(`Failed to create meeting: ${error.message}`);
            return;
          }
        }
      }

      // Reload meetings from backend to get the new ones
      await loadMeetingsFromBackend();

      meetingModal.classList.add("hidden");
      meetingForm.reset();
      if (recurringEndInput) recurringEndInput.value = "";
      syncRecurringControlState();
    });

    closeModalBtn.onclick = () => meetingModal.classList.add("hidden");
    closeMeetingContentBtn.onclick = () => {
      stopCamera(); // Stop camera if running
      activeMeetingContext = { date: null, index: null, chainId: null, meetingUUID: null, creatorUUID: null };
      if (deleteAllFutureBtn) deleteAllFutureBtn.disabled = true;
      meetingContentModalWrapper.classList.add("hidden");
    };

    prevBtn.onclick = () => {
      // Don't navigate if button is disabled
      if (prevBtn.disabled) {
        return;
      }

      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);

      // Check if navigation is allowed
      if (isMonthWithinCourseRange(newDate)) {
        currentDate = newDate;
        renderCalendar();
        updateNavigationButtons();
      } else {
        alert("Cannot navigate before the course start date.");
        updateNavigationButtons(); // Update buttons in case state changed
      }
    };

    nextBtn.onclick = () => {
      // Don't navigate if button is disabled
      if (nextBtn.disabled) {
        return;
      }

      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);

      // Check if navigation is allowed
      if (isMonthWithinCourseRange(newDate)) {
        currentDate = newDate;
        renderCalendar();
        updateNavigationButtons();
      } else {
        alert("Cannot navigate after the course end date.");
        updateNavigationButtons(); // Update buttons in case state changed
      }
    };

    todayBtn.onclick = () => {
      // Don't navigate if button is disabled
      if (todayBtn.disabled) {
        return;
      }

      const today = new Date();

      // Check if today is within course dates
      if (isDateWithinCourseRange(today)) {
        currentDate = today;
        renderCalendar();
        updateNavigationButtons();
      } else {
        alert("Today is outside the course date range. Please select a date within the course period.");
        updateNavigationButtons(); // Update buttons in case state changed
      }
    };

    syncRecurringControlState();

    // Render calendar initially (even if empty) so it's visible immediately
    renderCalendar();

    // Initially disable navigation buttons until course dates are loaded
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (todayBtn) todayBtn.disabled = true;

    // Load user context to determine role
    const courseUUID = getCourseIdFromUrl();
    if (courseUUID) {
      await loadUserContext(courseUUID);
      setupMeetingTypeOptions();
    }

    // Set up participant selection controls
    if (selectAllBtn) {
      selectAllBtn.addEventListener("click", selectAllParticipants);
    }
    if (deselectAllBtn) {
      deselectAllBtn.addEventListener("click", deselectAllParticipants);
    }
    if (selectByTeamDropdown) {
      selectByTeamDropdown.addEventListener("change", (e) => {
        selectParticipantsByTeam(e.target.value);
      });
    }

    // Load course dates first to restrict calendar navigation
    await loadCourseDates();

    // Load meetings and users/teams from backend on initial render
    await loadMeetingsFromBackend();
    await loadAllUsersAndTeams();

  } catch (error) {
    container.innerHTML = `<div class='error'>Failed to load calendar: ${error.message}</div>`;
  }
}

/** Extract course ID from URL path
 * Assumes URL structure: /courses/{courseId}/...
 * @returns {string|null} Course ID or null if not found
 */
function getCourseId() {
      const match = window.location.pathname.match(/^\/courses\/([^/]+)/);
      return match ? match[1] : null;
}

/** Render class analytics (Professor/TA only)
 * @param {HTMLElement} container - Container to render into
 */
export async function renderClassAnalytics(container) {
  const html = await loadTemplate("attendance", "analysisclass");

  // Append instead of overwrite
  container.insertAdjacentHTML("beforeend", html);

  // Find the inserted template
  const template = container.querySelector('template:last-of-type');
  if (template) {
    const content = template.content.cloneNode(true);
    template.replaceWith(content);
  }

  const courseUUID = getCourseId();
  showClassAnalytics(courseUUID);
}

/** Render class analytics (Professor/TA only)
 * @param {HTMLElement} container - Container to render into
 */
export async function renderIndividualAnalytics(container) {
  const html = await loadTemplate("attendance", "analysisuser");

  // Append instead of overwrite
  container.insertAdjacentHTML("beforeend", html);

  // Find the inserted template
  const template = container.querySelector('template:last-of-type');
  if (template) {
    const content = template.content.cloneNode(true);
    template.replaceWith(content);
  }

  const courseUUID = getCourseId();
  const userUuid = getCurrentUser().userUuid;
  showIndividualAnalytics(courseUUID, userUuid);
}


/** Render group analytics (Team Leader and above)
 * @param {HTMLElement} container - Container to render into
 */
export async function renderGroupanalysis(container) {
  const html = await loadTemplate("attendance", "analysisgroup");

  // Append instead of overwrite
  container.insertAdjacentHTML("beforeend", html);

  // Find the inserted template
  const template = container.querySelector('template:last-of-type');
  if (template) {
    const content = template.content.cloneNode(true);
    template.replaceWith(content);
  }

  const courseUUID = getCourseId();
  // console.log("Course UUID for group analytics:", courseUUID);
  const userUuid = getCurrentUser().userUuid;
  const usercontext = await loadUserContext(courseUUID);
  const teamUuid = usercontext.teams[0]?.teamUuid || null;
  // console.log("User's team UUIDs for group analytics:", teamUuid);
  // console.log("User context for group analytics:", usercontext);
  showGroupAnalytics(courseUUID, userUuid, teamUuid);
}




/**
 * Render the Attendance Analytics view.
 *
 * Loads Chart.js, analytics-related scripts, user context,
 * and the corresponding HTML template before initializing
 * the analytics dashboard.
 *
 * @async
 * @param {HTMLElement} container - container where the analytics UI will be rendered.
 * @returns {Promise<void>} Resolves when the analytics view is fully loaded.
 */
export async function renderAnalysisView(container) {
  try {
    await loadChartJs();
    const courseUUID = getCourseId();
    const role = getUserRoleInCourse(courseUUID); 
    console.log("User role:", role);

    const baseHTML = await loadTemplate("attendance", "analysis"); 
    container.innerHTML = baseHTML;

    const template = container.querySelector("template");
    if (template) {
      const content = template.content.cloneNode(true);
      container.innerHTML = "";
      container.appendChild(content);
    }

    await new Promise(r => setTimeout(r, 50));

    if (role === "Student") {
      await renderIndividualAnalytics(container);
    }
    else if (role === "Team Leader") {
      await renderIndividualAnalytics(container);
      await renderGroupanalysis(container);
    }
    else {
      await renderClassAnalytics(container);
      await renderGroupanalysis(container);
    }

  } catch (err) {
    console.error("Error rendering analysis view:", err);
  }
}

/**
 * Load Chart.js before rendering any analytics charts.
 * @async
 * @returns {Promise<void>} 
 * Resolves when Chart.js is successfully loaded and available globally.
 * Rejects if the CDN script fails to load or if Chart.js does not initialize.
 */
function loadChartJs() {
  return new Promise((resolve, reject) => {
    if (typeof Chart !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
    script.onload = () => {
      if (typeof Chart === 'undefined') {
        reject(new Error('Chart.js failed to load'));
      } else {
        resolve();
      }
    };
    script.onerror = () => reject(new Error('Failed to load Chart.js CDN'));
    document.head.appendChild(script);
  });
}
