/**
 * Attendance entrypoint.
 * - Dashboard (calendar/meetings) delegated to dashboard.js.
 * - Analytics logic in analyticsindex.js.
 * @module attendance/main
 */

import { loadTemplate } from "../../utils/templateLoader.js";
import { getCurrentUser, getUserRoleInCourse, loadUserContext } from "../../utils/userContext.js";
import { showClassAnalytics, showIndividualAnalytics, showGroupAnalytics, initAnalyticsEventListeners } from "./analyticsindex.js";
import { getCourseIdFromUrl } from "./utils.js";
import { renderDashboard } from "./dashboard.js";

export async function render(container, view = "dashboard") {
  if (view === "analysis") {
    await renderAnalysisView(container);
    return;
  }
  await renderDashboard(container, view);
}

/**
 * Render class analytics
 * @param {HTMLElement} container
 */
export async function renderClassAnalytics(container) {
  const html = await loadTemplate("attendance", "analysisclass");
  container.insertAdjacentHTML("beforeend", html);
  const template = container.querySelector("template:last-of-type");
  if (template) {
    const content = template.content.cloneNode(true);
    template.replaceWith(content);
  }
  const courseUUID = getCourseIdFromUrl();
  showClassAnalytics(courseUUID);
}

/** Render individual analytics
 * @param {HTMLElement} container
 */
export async function renderIndividualAnalytics(container) {
  const html = await loadTemplate("attendance", "analysisuser");
  container.insertAdjacentHTML("beforeend", html);
  const template = container.querySelector("template:last-of-type");
  if (template) {
    const content = template.content.cloneNode(true);
    template.replaceWith(content);
  }
  const courseUUID = getCourseIdFromUrl();
  const userUuid = getCurrentUser().userUuid;
  showIndividualAnalytics(courseUUID, userUuid);
}


/** Render group analytics
 * @param {HTMLElement} container
 */
export async function renderGroupanalytics(container) {
  const html = await loadTemplate("attendance", "analysisgroup");
  container.insertAdjacentHTML("beforeend", html);
  const template = container.querySelector("template:last-of-type");
  if (template) {
    const content = template.content.cloneNode(true);
    template.replaceWith(content);
  }

  const courseUUID = getCourseIdFromUrl();
  const userUuid = getCurrentUser().userUuid;
  const usercontext = await loadUserContext(courseUUID);
  const teamUuid = usercontext.teams[0]?.teamUuid || null;
  showGroupAnalytics(courseUUID, userUuid, teamUuid);
}

/**
 * Render the analysis view
 * @param {HTMLElement} container
 */
export async function renderAnalysisView(container) {
  try {
    await loadChartJs();
    const courseUUID = getCourseIdFromUrl();
    const role = getUserRoleInCourse(courseUUID);
    const useruuid = getCurrentUser().userUuid;
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
      await initAnalyticsEventListeners(courseUUID, useruuid);
    } else if (role === "Team Leader") {
      await renderIndividualAnalytics(container);
      await initAnalyticsEventListeners(courseUUID, useruuid);
      await renderGroupanalytics(container);
      await initAnalyticsEventListeners(courseUUID, useruuid);
    } else {
      await renderClassAnalytics(container);
      await initAnalyticsEventListeners(courseUUID);
      await renderGroupanalytics(container);
      await initAnalyticsEventListeners(courseUUID, useruuid);
    }
  } catch (err) {
    container.innerHTML = "<div class=\"error\">Unable to load analytics.</div>";
  }
}

/**
 * Load Chart.js before rendering any analytics charts.
 */
function loadChartJs() {
  return new Promise((resolve, reject) => {
    if (typeof Chart !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js";
    script.onload = () => {
      if (typeof Chart === "undefined") {
        reject(new Error("Chart.js failed to load"));
      } else {
        resolve();
      }
    };
    script.onerror = () => reject(new Error("Failed to load Chart.js CDN"));
    document.head.appendChild(script);
  });
}
