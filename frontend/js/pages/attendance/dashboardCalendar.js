/**
 * @fileoverview Calendar rendering and navigation helpers for attendance dashboard.
 * @module attendance/dashboardCalendar
 */

import { formatDate, formatTimeForDisplay, getCourseIdFromUrl } from "./utils.js";
import { getUserRoleInCourse } from "../../utils/userContext.js";

export function isDateWithinCourseRange(ctx, date) {
  if (!ctx.state.courseStartDate || !ctx.state.courseEndDate) return false;
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate >= ctx.state.courseStartDate && checkDate <= ctx.state.courseEndDate;
}

export function isMonthWithinCourseRange(ctx, date) {
  if (!ctx.state.courseStartDate || !ctx.state.courseEndDate) return false;
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  return firstDayOfMonth <= ctx.state.courseEndDate && lastDayOfMonth >= ctx.state.courseStartDate;
}

export function updateNavigationButtons(ctx) {
  if (!ctx.els.prevBtn || !ctx.els.nextBtn || !ctx.els.todayBtn) return;

  const year = ctx.state.currentDate.getFullYear();
  const month = ctx.state.currentDate.getMonth();
  const canGoPrev = isMonthWithinCourseRange(ctx, new Date(year, month - 1, 1));
  const canGoNext = isMonthWithinCourseRange(ctx, new Date(year, month + 1, 1));
  const canGoToToday = isDateWithinCourseRange(ctx, new Date());

  ctx.els.prevBtn.disabled = !canGoPrev;
  ctx.els.prevBtn.title = canGoPrev ? "Previous month" : "Cannot navigate before course start date";
  ctx.els.nextBtn.disabled = !canGoNext;
  ctx.els.nextBtn.title = canGoNext ? "Next month" : "Cannot navigate after course end date";
  ctx.els.todayBtn.disabled = !canGoToToday;
  ctx.els.todayBtn.title = canGoToToday ? "Go to today" : "Today is outside the course date range";
}

export function bindNavigation(ctx, renderCalendarFn) {
  ctx.els.prevBtn.onclick = () => {
    if (ctx.els.prevBtn.disabled) return;
    const newDate = new Date(ctx.state.currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    if (isMonthWithinCourseRange(ctx, newDate)) {
      ctx.state.currentDate = newDate;
      renderCalendarFn();
      updateNavigationButtons(ctx);
    } else {
      alert("Cannot navigate before the course start date.");
      updateNavigationButtons(ctx);
    }
  };

  ctx.els.nextBtn.onclick = () => {
    if (ctx.els.nextBtn.disabled) return;
    const newDate = new Date(ctx.state.currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    if (isMonthWithinCourseRange(ctx, newDate)) {
      ctx.state.currentDate = newDate;
      renderCalendarFn();
      updateNavigationButtons(ctx);
    } else {
      alert("Cannot navigate after the course end date.");
      updateNavigationButtons(ctx);
    }
  };

  ctx.els.todayBtn.onclick = () => {
    if (ctx.els.todayBtn.disabled) return;
    const today = new Date();
    if (isDateWithinCourseRange(ctx, today)) {
      ctx.state.currentDate = today;
      renderCalendarFn();
      updateNavigationButtons(ctx);
    } else {
      alert("Today is outside the course date range. Please select a date within the course period.");
      updateNavigationButtons(ctx);
    }
  };
}

export function disableNavigationWhileLoading(ctx) {
  if (ctx.els.prevBtn) ctx.els.prevBtn.disabled = true;
  if (ctx.els.nextBtn) ctx.els.nextBtn.disabled = true;
  if (ctx.els.todayBtn) ctx.els.todayBtn.disabled = true;
}

export function renderCalendar(ctx, { openMeetingAttendance, loadAllUsersAndTeams, syncRecurringControlState }) {
  ctx.els.calendarGrid.innerHTML = "";

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const headersDiv = document.createElement("div");
  headersDiv.classList.add("calendar-days");
  daysOfWeek.forEach(day => {
    const dayDiv = document.createElement("div");
    dayDiv.textContent = day;
    headersDiv.appendChild(dayDiv);
  });
  ctx.els.calendarGrid.appendChild(headersDiv);

  const datesContainer = document.createElement("div");
  datesContainer.classList.add("calendar-dates");

  const year = ctx.state.currentDate.getFullYear();
  const month = ctx.state.currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  ctx.els.currentMonthEl.textContent = ctx.state.currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

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

    const listContainer = document.createElement("div");
    listContainer.classList.add("calendar-day-content");

    if (ctx.state.meetings[fullDate]) {
      ctx.state.meetings[fullDate].forEach((m, idx) => {
        const meetDiv = document.createElement("div");
        meetDiv.classList.add("meeting-tag", `type-${m.type.toLowerCase().replace(/\s+/g, "")}`);
        const timeDisplay = m.time ? formatTimeForDisplay(m.time) : "";
        meetDiv.textContent = timeDisplay ? `${timeDisplay} - ${m.title}` : m.title;
        meetDiv.addEventListener("click", async (e) => {
          e.stopPropagation();
          await openMeetingAttendance(fullDate, idx);
        });
        listContainer.appendChild(meetDiv);
      });
    }

    if (!isPastDate) {
      dateDiv.addEventListener("click", async () => {
        ctx.els.meetingTitleInput.value = "";
        ctx.els.meetingDateInput.value = fullDate;
        ctx.state.selectedCalendarDate = fullDate;
        ctx.els.meetingTimeInput.value = "";
        if (ctx.els.meetingEndTimeInput) ctx.els.meetingEndTimeInput.value = "";
        const courseUUID = getCourseIdFromUrl();
        const role = getUserRoleInCourse(courseUUID);
        if (role === "Professor") {
          ctx.els.meetingTypeSelect.value = "Lecture";
        } else if (role === "TA") {
          ctx.els.meetingTypeSelect.value = "OH";
        } else {
          ctx.els.meetingTypeSelect.value = "Team Meeting";
        }
        ctx.els.meetingDescTextarea.value = "";
        if (ctx.els.meetingLocationInput) ctx.els.meetingLocationInput.value = "";
        ctx.els.recurringCheckbox.checked = false;
        if (ctx.els.recurringEndInput) ctx.els.recurringEndInput.value = "";
        syncRecurringControlState(ctx);
        ctx.els.participantsContainer.querySelectorAll("input[type=\"checkbox\"]").forEach(cb => cb.checked = false);
        await loadAllUsersAndTeams(ctx);
        ctx.els.meetingModal.classList.remove("hidden");
      });
    }

    dateDiv.appendChild(listContainer);
    datesContainer.appendChild(dateDiv);
  }

  ctx.els.calendarGrid.appendChild(datesContainer);
  updateNavigationButtons(ctx);
}

