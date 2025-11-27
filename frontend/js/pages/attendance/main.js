import { loadTemplate } from "../../utils/templateLoader.js";

const meetings = {};
let currentDate = new Date();

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
          dateDiv.addEventListener("click", () => {
            // Reset all fields
            meetingTitleInput.value = "";
            meetingDateInput.value = fullDate;
            selectedCalendarDate = fullDate;
            meetingTimeInput.value = "";
            meetingTypeSelect.value = "Lecture";
            meetingDescTextarea.value = "";
            recurringCheckbox.checked = false;
            if (recurringEndInput) recurringEndInput.value = "";
            syncRecurringControlState();
            participantsContainer.querySelectorAll("input[type=\"checkbox\"]").forEach(cb => cb.checked = false);

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
      wrapper.querySelector("#attendance-meeting-desc").textContent = meeting.desc;
      wrapper.querySelector("#attendance-meeting-participants").textContent = meeting.participants.join(", ");

      wrapper.querySelector("#attendance-passcode").value = "";
      activeMeetingContext = { date, index, chainId: meeting.chainId || null };
      if (deleteAllFutureBtn) {
        deleteAllFutureBtn.disabled = !meeting.chainId;
      }
      meetingContentModalWrapper.classList.remove("hidden");
    }

    deleteMeetingBtn?.addEventListener("click", () => {
      const { date, index } = activeMeetingContext;
      if (!date || typeof index !== "number") return;

      const confirmDelete = confirm("Delete this meeting from the calendar?");
      if (!confirmDelete) return;

      meetings[date].splice(index, 1);
      if (meetings[date].length === 0) {
        delete meetings[date];
      }

      activeMeetingContext = { date: null, index: null, chainId: null };
      if (deleteAllFutureBtn) deleteAllFutureBtn.disabled = true;
      meetingContentModalWrapper.classList.add("hidden");
      renderCalendar();
    });

    deleteAllFutureBtn?.addEventListener("click", () => {
      const { chainId, date } = activeMeetingContext;
      if (!chainId || !date) return;

      const confirmDelete = confirm("Delete this and all future recurring meetings?");
      if (!confirmDelete) return;

      const cutoff = parseLocalDate(date);
      if (!cutoff) return;

      Object.keys(meetings).forEach(meetingDate => {
        const parsed = parseLocalDate(meetingDate);
        if (!parsed || parsed < cutoff) return;

        meetings[meetingDate] = meetings[meetingDate].filter(entry => entry.chainId !== chainId);
        if (meetings[meetingDate].length === 0) delete meetings[meetingDate];
      });

      activeMeetingContext = { date: null, index: null, chainId: null };
      if (deleteAllFutureBtn) deleteAllFutureBtn.disabled = true;
      meetingContentModalWrapper.classList.add("hidden");
      renderCalendar();
    });

    wrapper.querySelector("#submit-attendance").onclick = () => {
      const code = wrapper.querySelector("#attendance-passcode").value;
      alert(`Attendance submitted with passcode: ${code}\n(Backend integration needed)`);
      meetingContentModalWrapper.classList.add("hidden");
    };

    meetingForm.addEventListener("submit", e => {
      e.preventDefault();

      const title = meetingTitleInput.value;
      const date = meetingDateInput.value;
      const time = meetingTimeInput.value;
      const type = meetingTypeSelect.value;
      const desc = meetingDescTextarea.value;
      const recurring = recurringCheckbox.checked;

      const participants = Array.from(participantsContainer.querySelectorAll("input[type=\"checkbox\"]:checked"))
        .map(cb => cb.value);

      const meetingDateTime = new Date(`${date}T${time}`);
      const now = new Date();

      if (meetingDateTime < now) {
        alert("You cannot create a meeting in the past.");
        return;
      }

      if (!meetings[date]) meetings[date] = [];
      const chainId = recurring ? `chain-${Date.now()}-${chainCounter++}` : null;

      meetings[date].push({title, time, type, desc, participants, chainId});

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

        const nextDate = new Date(startDate);
        nextDate.setDate(nextDate.getDate() + 7);

        while (nextDate <= endDate) {
          const nextYear = nextDate.getFullYear();
          const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
          const nextDay = String(nextDate.getDate()).padStart(2, "0");
          const nextDateStr = `${nextYear}-${nextMonth}-${nextDay}`;

          if (!meetings[nextDateStr]) meetings[nextDateStr] = [];
          meetings[nextDateStr].push({title, time, type, desc, participants, chainId});

          nextDate.setDate(nextDate.getDate() + 7);
        }
      }

      meetingModal.classList.add("hidden");
      meetingForm.reset();
      if (recurringEndInput) recurringEndInput.value = "";
      syncRecurringControlState();
      renderCalendar();
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
    renderCalendar();

  } catch (error) {
    container.innerHTML = `<div class='error'>Failed to load calendar: ${error.message}</div>`;
  }
}
