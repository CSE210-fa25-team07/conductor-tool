/**
 * @fileoverview Attendance Analytics Page Logic
 * @module attendance/analyticsindex
 */

import { ChartHelper } from "../../components/chartHelper.js";
import {
  getInstructorAnalytics,
  getUserAnalytics,
  getCourseTeams
} from "../../api/analyticsApi.js";

import { getCourseDetails } from "../../api/attendanceApi.js";

let overallChart = null;
let teamChart = null;
let individualChart = null;

const TYPE_LABEL = {
  "lecture": "Lecture",
  "office-hours": "Office Hours",
  "ta-checkin": "TA Check-in",
  "team-meeting": "Team Meeting"
};

const INT_TO_KEY = {
  0: "lecture",
  1: "office-hours",
  2: "ta-checkin",
  3: "team-meeting"
};

const KEY_TO_INT = {
  "lecture": 0,
  "office-hours": 1,
  "ta-checkin": 2,
  "team-meeting": 3
};

/**
 * 
 * @param {string} courseUuid 
 * @returns {{startDate: Date, endDate: Date}}
 */
async function setDate(courseUuid) {
  const res = await getCourseDetails(courseUuid);
  const startDate = res.term.startDate ? new Date(res.term.startDate) : null;
  const termEnd = res.term.endDate ? new Date(res.term.endDate) : null;
  if (startDate) startDate.setHours(0, 0, 0, 0);
  if (termEnd) termEnd.setHours(23, 59, 59, 999);
  const currentDate = new Date();
  let endDate;
  if (termEnd && termEnd < currentDate) {
    endDate = termEnd;
  } else {
    endDate = currentDate;
  }
  return { startDate, endDate };
}

/**
 * Initialize analytics event listeners
 * @param {string} courseUuid - Course UUID
 * @param {string} [userUuid=null] - User UUID (optional)
 */

export function initAnalyticsEventListeners(courseUuid, userUuid = null) {
  Array.from(document.querySelectorAll(".overall-type")).forEach(box => {
    box.addEventListener("change", () => {
      showClassAnalytics(courseUuid);
    });
  });

  Array.from(document.querySelectorAll(".group-type")).forEach(box => {
    box.addEventListener("change", () => {
      renderTeamChart(courseUuid);
    });
  });

  Array.from(document.querySelectorAll(".individual-type")).forEach(box => {
    box.addEventListener("change", () => {
      showIndividualAnalytics(courseUuid, userUuid);
    });
  });
}


/**
 * Show class-wide attendance analytics
 * @param {string} courseUuid - Course UUID
 */
export async function showClassAnalytics(courseUuid) {
  const filters = getOverallFilters();
  const timeline = await loadAnalytics(courseUuid, null);
  if (!timeline) return;

  const { labels, datasetMap } = buildTimelineDatasets(timeline, filters);

  if (overallChart)
    overallChart.destroy();

  overallChart = ChartHelper.createMultiLineChart(
    "overallAttendanceChart",
    labels,
    datasetMap
  );
}

/**
 * Show group attendance analytics
 * @param {string} courseUuid - Course UUID
 * @param {string} [userUuid=null] - User UUID (optional)
 * @param {string} [teamUuid=null] - Team UUID (optional)
 */
export async function showGroupAnalytics(courseUuid, userUuid, teamUuid = null) {
  await loadTeamDropdown(courseUuid, userUuid, teamUuid);
  await renderTeamChart(courseUuid);
}


/**
 * show individual attendance analytics
 * @param {string} courseUuid 
 * @param {string} [userUuid=null] - User UUID (optional)
 */
export async function showIndividualAnalytics(courseUuid, userUuid) {
  const { startDate, endDate } = await setDate(courseUuid);
  const res = await getUserAnalytics({ courseUuid, userUuid, startDate, endDate });
  const filters = getIndividualFilters();
  const { labels, datasetMap } = buildIndividualDataset(res.attendanceByType, filters);

  if (individualChart)
    individualChart.destroy();
  individualChart = ChartHelper.createBarChart(
    "individualAttendanceChart",
    labels,
    datasetMap
  );
}

/**
 * create individual attendance dataset
 * @param {Array} attendanceByType 
 * @param {Object} filters 
 * @returns {{labels: Array, datasetMap: Object}}
 */
function buildIndividualDataset(attendanceByType, filters) {
  const labels = Object.values(TYPE_LABEL);

  const datasetMap = {
    "lecture":       { label: "Lecture",       data: [NaN, NaN, NaN, NaN], enabled: filters["lecture"] },
    "office-hours":  { label: "Office Hours",  data: [NaN, NaN, NaN, NaN], enabled: filters["office-hours"] },
    "ta-checkin":    { label: "TA Check-in",   data: [NaN, NaN, NaN, NaN], enabled: filters["ta-checkin"] },
    "team-meeting":  { label: "Team Meeting",  data: [NaN, NaN, NaN, NaN], enabled: filters["team-meeting"] }
  };

  attendanceByType.forEach(item => {
    const key = INT_TO_KEY[item.meetingType];
    const idx = Object.keys(TYPE_LABEL).indexOf(key);
    datasetMap[key].data[idx] = item.percentage;
  });

  return { labels, datasetMap };
}

/**
 * Load team dropdown options
 * @param {string} courseUuid 
 * @param {string} userUuid 
 * @param {string} [teamUuid=null] 
 */
async function loadTeamDropdown(courseUuid, userUuid, teamUuid = null) {
  const select = document.getElementById("groupTeamSelect");
  let teams = [];
  try {
    teams = await getCourseTeams(courseUuid);
  } catch (err) {}

  if (teamUuid) {
    teams = teams.filter(t => t.teamUuid === teamUuid);
  }

  select.innerHTML =
    "<option value=\"\">Select Team…</option>" +
    teams.map(t => `<option value="${t.teamUuid}">${t.teamName}</option>`).join("");

  select.addEventListener("change", () => renderTeamChart(courseUuid));
}

/**
 * Load analytics data
 * @param {string} courseUuid 
 * @param {string} [teamUuid=null] 
 * @returns {Array} timeline data
 */
async function loadAnalytics(courseUuid, teamUuid = null) {
  try {
    const { startDate, endDate } = await setDate(courseUuid);
    const res = await getInstructorAnalytics({
      courseUuid,
      teamUuid: teamUuid || undefined,
      startDate: startDate,
      endDate: endDate
    });
    return res.timeline.map(i => ({
      date: i.date.split("T")[0],
      type: INT_TO_KEY[i.meetingType],
      value: i.attendancePercentage
    }));
  } catch (e) {}
}

/** Render team attendance chart
 * @param {string} courseUuid 
 */
async function renderTeamChart(courseUuid) {
  const teamUuid = document.getElementById("groupTeamSelect")?.value;
  const filters = getTeamFilters();
  const timeline = await loadAnalytics(courseUuid, teamUuid);
  const { labels, datasetMap } = buildTimelineDatasets(timeline, filters);

  if (teamChart)
    teamChart.destroy();

  teamChart = ChartHelper.createMultiLineChart(
    "groupAttendanceChart",
    labels,
    datasetMap
  );
}

/** Build timeline datasets
 * @param {Array} timeline 
 * @param {Object} filters 
 * @returns {{labels: Array, datasetMap: Object}}
 */
function buildTimelineDatasets(timeline, filters) {
  const labels = [...new Set(timeline.map(i => i.date))].sort();
  const map = {
    "lecture":       { label: "Lecture", data: [], enabled: filters["lecture"] },
    "office-hours":  { label: "Office Hours", data: [], enabled: filters["office-hours"] },
    "ta-checkin":    { label: "TA Check-in", data: [], enabled: filters["ta-checkin"] },
    "team-meeting":  { label: "Team Meeting", data: [], enabled: filters["team-meeting"] }
  };

  labels.forEach(date => {
    const day = timeline.filter(i => i.date === date);
    for (const key of Object.keys(map)) {
      const match = day.find(i => i.type === key);
      const val = match ? Number(match.value) : Number.NaN;
      map[key].data.push(val);
    }
  });

  return { labels, datasetMap: map };
}

/** Get overall attendance filters
 * @returns {Object} filters
 */
function getOverallFilters() {
  const filters = {};
  Array.from(document.querySelectorAll(".overall-type")).forEach(b => filters[b.value] = b.checked);
  return filters;
}

/** Get team attendance filters
 * @returns {Object} filters
 */
function getTeamFilters() {
  const filters = {};
  Array.from(document.querySelectorAll(".group-type")).forEach(b => filters[b.value] = b.checked);
  return filters;
}

/** Get individual attendance filters
 * @returns {Object} filters
 */
function getIndividualFilters() {
  const filters = {};
  Array.from(document.querySelectorAll(".individual-type")).forEach(b => filters[b.value] = b.checked);
  return filters;
}
