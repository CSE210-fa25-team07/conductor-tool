/**
 * @fileoverview Recurring meeting controls and summaries for attendance dashboard.
 */

import { parseLocalDate } from "./utils.js";

export function bindRecurringControls(ctx) {
  ctx.els.meetingDateInput?.addEventListener("change", e => {
    ctx.state.selectedCalendarDate = e.target.value || ctx.state.selectedCalendarDate;
    updateRecurringSummary(ctx);
  });
  ctx.els.recurringEndInput?.addEventListener("change", () => updateRecurringSummary(ctx));
  ctx.els.recurringCheckbox?.addEventListener("change", () => syncRecurringControlState(ctx));
}

export function bindTimeDefaults(ctx) {
  ctx.els.meetingTimeInput?.addEventListener("change", () => {
    if (!ctx.els.meetingEndTimeInput || ctx.els.meetingEndTimeInput.value) return;
    const startTime = ctx.els.meetingTimeInput.value;
    if (!startTime) return;
    const [hours, minutes] = startTime.split(":").map(Number);
    const endHours = (hours + 1) % 24;
    ctx.els.meetingEndTimeInput.value = `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  });
}

export function updateRecurringSummary(ctx) {
  if (!ctx.els.recurringSummaryEl) return;

  const anchorValue = ctx.state.selectedCalendarDate || ctx.els.meetingDateInput?.value || "";
  const startValue = ctx.els.meetingDateInput?.value || anchorValue;
  const endValue = ctx.els.recurringEndInput?.value || "";

  if (!anchorValue) {
    ctx.els.recurringSummaryEl.textContent = "Select a date to preview the repeating schedule.";
    return;
  }

  const anchorDate = parseLocalDate(anchorValue);
  if (!anchorDate) {
    ctx.els.recurringSummaryEl.textContent = "Choose a valid start date to see the repeat range.";
    return;
  }

  if (!ctx.els.recurringCheckbox?.checked) {
    ctx.els.recurringSummaryEl.textContent = "Recurring is off.";
    return;
  }

  if (!endValue) {
    const startLabel = anchorDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    ctx.els.recurringSummaryEl.textContent = `Repeats weekly beginning on the selected date, ${startLabel}. Pick an end date to finish the series.`;
    return;
  }

  const endDate = parseLocalDate(endValue);
  if (!endDate) {
    ctx.els.recurringSummaryEl.textContent = "Choose a valid end date to finish the series.";
    return;
  }

  const baseDate = parseLocalDate(startValue || anchorValue);
  if (endDate < baseDate) {
    ctx.els.recurringSummaryEl.textContent = "End date must be on or after the first meeting.";
    return;
  }

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const totalMeetings = Math.max(1, Math.floor((endDate - baseDate) / weekMs) + 1);
  const endLabel = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  ctx.els.recurringSummaryEl.textContent = `Creates ${totalMeetings} weekly meetings through ${endLabel}.`;
}

export function syncRecurringControlState(ctx) {
  if (ctx.els.recurringEndInput) {
    ctx.els.recurringEndInput.disabled = !ctx.els.recurringCheckbox?.checked;
  }
  updateRecurringSummary(ctx);
}

