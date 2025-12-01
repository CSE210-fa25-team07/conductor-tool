/**
 * @fileoverview Attendace Feature Main Entry Point
 * Handles calendar and meeting creation on Attendance tab
 */

import { loadTemplate } from "../../utils/templateLoader.js";
import { getCourseParticipants, createMeeting, deleteMeeting, getMeetingList } from "../../api/attendanceApi.js";
import { loadUserContext, isProfessorOrTA, getUserRoleInCourse } from "../../utils/userContext.js";

const meetings = {};
let currentDate = new Date();

/**
 * Map meeting type string to integer
 * @param {string} typeString - Meeting type as string
 * @returns {number} Meeting type as integer
 */
function mapMeetingTypeToInt(typeString) {
  const typeMap = {
    "Lecture": 1,
    "OH": 2,
    "TA Check-In": 3,
    "Team Meeting": 4
  };
  return typeMap[typeString] || 1;
}

/**
 * Map meeting type integer to string
 * @param {number} typeInt - Meeting type as integer
 * @returns {string} Meeting type as string
 */
function mapMeetingTypeToString(typeInt) {
  const typeMap = {
    1: "Lecture",
    2: "OH",
    3: "TA Check-In",
    4: "Team Meeting"
  };
  return typeMap[typeInt] || "Lecture";
}

export async function render(container, view = "dashboard") {
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
    const recurringCheckbox = wrapper.querySelector("#recurring");
    const recurringEndInput = wrapper.querySelector("#recurring-end-date");
    const recurringSummaryEl = wrapper.querySelector("#recurring-summary");
    let selectedCalendarDate = "";
    let chainCounter = 0;
    let userRole = null;
    let canCreateStaffMeetings = false;

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
     * Load and populate participants from the backend
     * @returns {Promise<void>}
     */
    async function loadParticipants() {
      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) {
        console.error("No course UUID found in URL");
        return;
      }

      try {
        const participants = await getCourseParticipants(courseUUID);
        populateParticipantsContainer(participants);
      } catch (error) {
        console.error("Failed to load participants:", error);
        // Show error message to user
        participantsContainer.innerHTML = `<p style="color: red; padding: 10px;">Failed to load participants: ${error.message}</p>`;
      }
    }

    /**
     * Populate the participants container with user data
     * @param {Array} participants - Array of participant objects with userUuid, firstName, lastName, email
     */
    function populateParticipantsContainer(participants) {
      participantsContainer.innerHTML = "";
      
      if (!participants || participants.length === 0) {
        participantsContainer.innerHTML = "<p style='padding: 10px; color: #666;'>No participants found for this course.</p>";
        return;
      }

      participants.forEach(participant => {
        const label = document.createElement("label");
        label.classList.add("participant");
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = participant.userUuid;
        
        const nameSpan = document.createElement("span");
        nameSpan.classList.add("participant-name");
        nameSpan.textContent = `${participant.firstName} ${participant.lastName}`;
        
        label.appendChild(checkbox);
        label.appendChild(nameSpan);
        participantsContainer.appendChild(label);
      });
    }

    /**
     * Load meetings from the backend and populate the calendar
     * @returns {Promise<void>}
     */
    async function loadMeetingsFromBackend() {
      const courseUUID = getCourseIdFromUrl();
      if (!courseUUID) {
        console.error("No course UUID found in URL");
        return;
      }

      try {
        const meetingList = await getMeetingList(courseUUID);
        
        // Clear existing meetings
        Object.keys(meetings).forEach(key => delete meetings[key]);
        
        // Group meetings by date
        meetingList.forEach(meeting => {
          const meetingDate = new Date(meeting.meetingDate);
          const dateStr = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, "0")}-${String(meetingDate.getDate()).padStart(2, "0")}`;
          
          if (!meetings[dateStr]) {
            meetings[dateStr] = [];
          }
          
          const startTime = new Date(meeting.meetingStartTime);
          const timeStr = `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`;
          
          meetings[dateStr].push({
            title: meeting.meetingTitle,
            time: timeStr,
            type: mapMeetingTypeToString(meeting.meetingType),
            desc: meeting.meetingDescription || "",
            participants: [], // Will be loaded separately if needed
            chainId: meeting.parentMeetingUUID || null,
            meetingUUID: meeting.meetingUUID,
            isRecurring: meeting.isRecurring
          });
        });
        
        renderCalendar();
      } catch (error) {
        console.error("Failed to load meetings:", error);
        // Continue with empty meetings if load fails
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
        recurringSummaryEl.textContent = `Recurring is off.`;
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
            meetDiv.addEventListener("click", e => {
              e.stopPropagation();
              openMeetingAttendance(fullDate, idx);
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

            // Load participants when opening modal
            await loadParticipants();

            meetingModal.classList.remove("hidden");
          });
        }

        datesContainer.appendChild(dateDiv);
      }

      calendarGrid.appendChild(datesContainer);
    }

    const deleteMeetingBtn = wrapper.querySelector("#delete-meeting");
    const deleteAllFutureBtn = wrapper.querySelector("#delete-future-meetings");
    let activeMeetingContext = { date: null, index: null, chainId: null };

    function openMeetingAttendance(date, index) {
      const meeting = meetings[date][index];

      wrapper.querySelector("#attendance-meeting-title").textContent = meeting.title;
      wrapper.querySelector("#attendance-meeting-date").textContent = date;
      wrapper.querySelector("#attendance-meeting-time").textContent = meeting.time;
      wrapper.querySelector("#attendance-meeting-type").textContent = meeting.type;
      wrapper.querySelector("#attendance-meeting-desc").textContent = meeting.desc || "";
      wrapper.querySelector("#attendance-meeting-participants").textContent = meeting.participants && meeting.participants.length > 0 
        ? meeting.participants.join(", ") 
        : "No participants";

      wrapper.querySelector("#attendance-passcode").value = "";
      activeMeetingContext = { 
        date, 
        index, 
        chainId: meeting.chainId || null,
        meetingUUID: meeting.meetingUUID || null
      };
      if (deleteAllFutureBtn) {
        deleteAllFutureBtn.disabled = !meeting.chainId;
      }
      meetingContentModalWrapper.classList.remove("hidden");
    }

    deleteMeetingBtn?.addEventListener("click", async () => {
      const { date, index, meetingUUID } = activeMeetingContext;
      if (!date || typeof index !== "number") return;

      const confirmDelete = confirm("Delete this meeting from the calendar?");
      if (!confirmDelete) return;

      // Delete from backend if meetingUUID exists
      if (meetingUUID) {
        try {
          await deleteMeeting(meetingUUID, false);
        } catch (error) {
          console.error("Failed to delete meeting:", error);
          alert(`Failed to delete meeting: ${error.message}`);
          return;
        }
      }

      // Remove from local state
      meetings[date].splice(index, 1);
      if (meetings[date].length === 0) {
        delete meetings[date];
      }

      activeMeetingContext = { date: null, index: null, chainId: null, meetingUUID: null };
      if (deleteAllFutureBtn) deleteAllFutureBtn.disabled = true;
      meetingContentModalWrapper.classList.add("hidden");
      renderCalendar();
    });

    deleteAllFutureBtn?.addEventListener("click", async () => {
      const { chainId, date, meetingUUID } = activeMeetingContext;
      if (!chainId || !date || !meetingUUID) return;

      const confirmDelete = confirm("Delete this and all future recurring meetings?");
      if (!confirmDelete) return;

      // Delete from backend (deleteFuture = true)
      try {
        await deleteMeeting(meetingUUID, true);
      } catch (error) {
        console.error("Failed to delete future meetings:", error);
        alert(`Failed to delete future meetings: ${error.message}`);
        return;
      }

      // Remove from local state
      const cutoff = parseLocalDate(date);
      if (!cutoff) return;

      Object.keys(meetings).forEach(meetingDate => {
        const parsed = parseLocalDate(meetingDate);
        if (!parsed || parsed < cutoff) return;

        meetings[meetingDate] = meetings[meetingDate].filter(entry => entry.chainId !== chainId);
        if (meetings[meetingDate].length === 0) delete meetings[meetingDate];
      });

      activeMeetingContext = { date: null, index: null, chainId: null, meetingUUID: null };
      if (deleteAllFutureBtn) deleteAllFutureBtn.disabled = true;
      meetingContentModalWrapper.classList.add("hidden");
      renderCalendar();
    });

    wrapper.querySelector("#submit-attendance").onclick = () => {
      const code = wrapper.querySelector("#attendance-passcode").value;
      alert(`Attendance submitted with passcode: ${code}\n(Backend integration needed)`);
      meetingContentModalWrapper.classList.add("hidden");
    };

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

      const participants = Array.from(participantsContainer.querySelectorAll("input[type=\"checkbox\"]:checked"))
        .map(cb => cb.value);

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

          try {
            const meetingData = {
              courseUUID: courseUUID,
              meetingStartTime: meetingStart.toISOString(),
              meetingEndTime: meetingEnd.toISOString(),
              meetingDate: nextDateStr,
              meetingTitle: title,
              meetingDescription: desc || null,
              meetingLocation: null,
              meetingType: mapMeetingTypeToInt(type),
              isRecurring: true,
              participants: participants
            };

            // Set parentMeetingUUID for recurring meetings (first one is parent, rest are children)
            if (parentMeetingUUID) {
              meetingData.parentMeetingUUID = parentMeetingUUID;
            }

            const response = await createMeeting(meetingData);
            
            // Store parent UUID for next iterations
            if (!parentMeetingUUID && response.meeting) {
              parentMeetingUUID = response.meeting.meetingUUID;
            }
          } catch (error) {
            console.error("Failed to create recurring meeting:", error);
            alert(`Failed to create meeting on ${nextDateStr}: ${error.message}`);
            return;
          }

          nextDate.setDate(nextDate.getDate() + 7);
        }
      } else {
        // Create single meeting
        const [hours, minutes] = time.split(":").map(Number);
        const meetingStart = new Date(meetingDateTime);
        const meetingEnd = new Date(meetingStart);
        meetingEnd.setHours(meetingStart.getHours() + 1); // Default 1 hour duration

        try {
          const meetingData = {
            courseUUID: courseUUID,
            meetingStartTime: meetingStart.toISOString(),
            meetingEndTime: meetingEnd.toISOString(),
            meetingDate: date,
            meetingTitle: title,
            meetingDescription: desc || null,
            meetingLocation: null,
            meetingType: mapMeetingTypeToInt(type),
            isRecurring: false,
            participants: participants
          };

          await createMeeting(meetingData);
        } catch (error) {
          console.error("Failed to create meeting:", error);
          alert(`Failed to create meeting: ${error.message}`);
          return;
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
      activeMeetingContext = { date: null, index: null, chainId: null };
      if (deleteAllFutureBtn) deleteAllFutureBtn.disabled = true;
      meetingContentModalWrapper.classList.add("hidden");
    };

    prevBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); };
    nextBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); };
    todayBtn.onclick = () => { currentDate = new Date(); renderCalendar(); };

    syncRecurringControlState();
    
    // Load user context to determine role
    const courseUUID = getCourseIdFromUrl();
    if (courseUUID) {
      await loadUserContext(courseUUID);
      setupMeetingTypeOptions();
    }
    
    // Load meetings and participants from backend on initial render
    await loadMeetingsFromBackend();
    await loadParticipants();

  } catch (error) {
    container.innerHTML = `<div class='error'>Failed to load calendar: ${error.message}</div>`;
  }
}
