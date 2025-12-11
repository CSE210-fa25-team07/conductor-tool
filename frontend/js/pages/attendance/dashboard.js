/**
 * @fileoverview Attendance dashboard entrypoint (calendar + meeting creation/attendance).
 * @module attendance/dashboard
 */

import { loadTemplate } from "../../utils/templateLoader.js";
import { getUserRoleInCourse, loadUserContext } from "../../utils/userContext.js";
import { createState, getDomRefs } from "./dashboardState.js";
import {
  loadAllUsersAndTeams,
  populateTeamSelector,
  populateParticipantsContainer,
  selectAllParticipants,
  deselectAllParticipants,
  selectParticipantsByTeam
} from "./dashboardParticipants.js";
import {
  bindRecurringControls,
  bindTimeDefaults,
  syncRecurringControlState
} from "./dashboardRecurrence.js";
import {
  renderCalendar,
  updateNavigationButtons,
  bindNavigation,
  disableNavigationWhileLoading
} from "./dashboardCalendar.js";
import {
  setupMeetingTypeOptions,
  loadMeetingsFromBackend,
  filterAndRenderMeetings,
  loadCourseDates,
  openMeetingAttendance,
  bindModalClose,
  bindCopyAndCamera,
  bindMeetingDeletion,
  bindFormSubmission
} from "./dashboardMeetings.js";
import { getCourseIdFromUrl, isStaffRole } from "./utils.js";

export async function renderDashboard(container, view = "dashboard") {
  container.innerHTML = await loadTemplate("attendance", view);
  const ctx = {
    container,
    state: createState(),
    els: getDomRefs(container)
  };
  await initializeDashboard(ctx);
}

async function initializeDashboard(ctx) {
  try {
    const renderCalendarFn = () =>
      renderCalendar(ctx, {
        openMeetingAttendance: (date, index) => openMeetingAttendance(ctx, date, index),
        loadAllUsersAndTeams,
        syncRecurringControlState
      });

    const refreshMeetings = async () => {
      await loadMeetingsFromBackend(ctx);
      filterAndRenderMeetings(ctx, renderCalendarFn);
    };

    bindRecurringControls(ctx);
    bindTimeDefaults(ctx);
    bindNavigation(ctx, renderCalendarFn);
    bindModalClose(ctx);
    bindCopyAndCamera(ctx);
    bindFormSubmission(ctx, { refreshMeetings, syncRecurringControlState });
    bindMeetingDeletion(ctx, refreshMeetings);

    if (ctx.els.selectAllBtn) ctx.els.selectAllBtn.addEventListener("click", () => selectAllParticipants(ctx));
    if (ctx.els.deselectAllBtn) ctx.els.deselectAllBtn.addEventListener("click", () => deselectAllParticipants(ctx));
    if (ctx.els.selectByTeamDropdown) {
      ctx.els.selectByTeamDropdown.addEventListener("change", (e) => selectParticipantsByTeam(ctx, e.target.value));
    }

    setupMeetingTypeOptions(ctx);

    // Show/hide staff-only toggle and set initial state
    const courseUUID = getCourseIdFromUrl();
    if (courseUUID) {
      await loadUserContext(courseUUID);
      const role = getUserRoleInCourse(courseUUID);
      const isStaff = isStaffRole(role);
      if (ctx.els.professorToggleContainer) {
        ctx.els.professorToggleContainer.classList.toggle("hidden", !isStaff);
      }
      if (!isStaff && ctx.els.showAllMeetingsToggle) {
        ctx.els.showAllMeetingsToggle.checked = false;
        ctx.state.showAllMeetings = false;
      }
    }

    if (ctx.els.showAllMeetingsToggle) {
      ctx.els.showAllMeetingsToggle.addEventListener("change", (e) => {
        ctx.state.showAllMeetings = e.target.checked;
        filterAndRenderMeetings(ctx, renderCalendarFn);
      });
    }

    renderCalendarFn();
    disableNavigationWhileLoading(ctx);

    await loadCourseDates(ctx, updateNavigationButtons);
    await refreshMeetings();
    await loadAllUsersAndTeams(ctx);
    populateTeamSelector(ctx);
    populateParticipantsContainer(ctx);
    updateNavigationButtons(ctx);
  } catch (error) {
    ctx.container.innerHTML = `<div class='error'>Failed to load calendar: ${error.message}</div>`;
  }
}

