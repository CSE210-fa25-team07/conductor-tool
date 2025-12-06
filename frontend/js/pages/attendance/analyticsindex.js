/**
 * @fileoverview Attendance Analytics Page Logic
 * @module pages/attendance/analyticsindex
 */

import { ChartHelper } from "../../components/chartHelper.js";
import {
  getInstructorAnalytics,
  getUserAnalytics,
  getCourseTeams
} from "../../api/analyticsApi.js";

// Active charts
let overallChart = null;
let teamChart = null;
let individualChart = null;

// Meeting type → label
const TYPE_LABEL = {
  "lecture": "Lecture",
  "office-hours": "Office Hours",
  "ta-checkin": "TA Check-in",
  "team-meeting": "Team Meeting"
};

// backend int → frontend key
const INT_TO_KEY = {
  0: "lecture",
  1: "office-hours",
  2: "ta-checkin",
  3: "team-meeting"
};

// frontend key → backend int
const KEY_TO_INT = {
  "lecture": 0,
  "office-hours": 1,
  "ta-checkin": 2,
  "team-meeting": 3
};

const $$ = sel => Array.from(document.querySelectorAll(sel));



/**
 * showClassAnalytics
 * @param {*} courseUuid
 *
 */
export async function showClassAnalytics(courseUuid) {
  await renderOverallChart(courseUuid);
}

/**
 * showGroupAnalytics
 * @param {*} courseUuid
 * @param {*} userUuid
 * @param {*} teamUuid
 */
export async function showGroupAnalytics(courseUuid, userUuid, teamUuid = null) {
  await loadTeamDropdown(courseUuid, userUuid, teamUuid);
  await renderTeamChart(courseUuid);
}


/** * showIndividualAnalytics
 * @param {*} courseUuid
 * @param {*} userUuid
 */
export async function showIndividualAnalytics(courseUuid, userUuid) {
  const res = await getUserAnalytics({ courseUuid, userUuid });

  if (!res || !res.attendanceByType) {
    return;
  }

  const filters = getIndividualFilters();
  const { labels, datasetMap } = buildIndividualDataset(res.attendanceByType, filters);

  if (individualChart)
    individualChart.destroy();

  // Use Bar Chart instead of Line Chart
  individualChart = ChartHelper.createBarChart(
    "individualAttendanceChart",
    labels,
    datasetMap
  );

  // attach checkbox listeners
  $$(".individual-type").forEach(b => {
    b.addEventListener("change", () =>
      showIndividualAnalytics(courseUuid, userUuid)
    );
  });
}

/**
 * buildIndividualDataset
 * @param {*} attendanceByType
 * @param {*} filters
 * @returns
 */
function buildIndividualDataset(attendanceByType, filters) {
  const labels = Object.values(TYPE_LABEL); // ["Lecture", "Office Hours", ...]

  // Initialize datasetMap
  const datasetMap = {
    "lecture":       { label: "Lecture",       data: [0], enabled: filters["lecture"] },
    "office-hours":  { label: "Office Hours",  data: [0], enabled: filters["office-hours"] },
    "ta-checkin":    { label: "TA Check-in",   data: [0], enabled: filters["ta-checkin"] },
    "team-meeting":  { label: "Team Meeting",  data: [0], enabled: filters["team-meeting"] }
  };

  // Fill data (one bar per meetingType)
  attendanceByType.forEach(item => {
    const key = INT_TO_KEY[item.meetingType];
    datasetMap[key].data = [item.percentage];
  });

  return { labels, datasetMap };
}


/** * loadTeamDropdown
 * @param {*} courseUuid
 * @param {*} userUuid
 * @param {*} teamUuid
 */
async function loadTeamDropdown(courseUuid, userUuid, teamUuid = null) {
  const select = document.getElementById("groupTeamSelect");
  if (!select) return;

  let teams = [];
  try {
    teams = await getCourseTeams(courseUuid);
  } catch (err) {
  }
  if (teamUuid) {
    teams = teams.filter(t => t.teamUuid === teamUuid);
  }
  select.innerHTML =
    "<option value=\"\">Select Team…</option>" +
    teams.map(t => `<option value="${t.teamUuid}">${t.teamName}</option>`).join("");

  select.addEventListener("change", () => renderTeamChart(courseUuid));
}



/**
 * loadAnalytics
 * @param {*} courseUuid
 * @param {*} teamUuid
 * @returns
 */
async function loadAnalytics(courseUuid, teamUuid = null) {
  try {
    const res = await getInstructorAnalytics({
      courseUuid,
      teamUuid: teamUuid || undefined
    });

    return res.timeline.map(i => ({
      date: i.date.split("T")[0],
      type: INT_TO_KEY[i.meetingType],
      value: i.attendancePercentage
    }));
  } catch (e) {
    return null;
  }
}



/**
 * loadOverallChart
 * @param {*} courseUuid
 * @returns
 */
async function renderOverallChart(courseUuid) {
  const filters = getOverallFilters();
  const timeline = await loadAnalytics(courseUuid);
  if (!timeline) return;

  const { labels, datasetMap } = buildTimelineDatasets(timeline, filters);

  if (overallChart)
    overallChart.destroy();

  overallChart = ChartHelper.createMultiLineChart(
    "overallAttendanceChart",
    labels,
    datasetMap
  );

  // attach checkbox listeners
  $$(".overall-type").forEach(b => {
    b.addEventListener("change", () => renderOverallChart(courseUuid));
  });
}



/** * renderTeamChart
 * @param {*} courseUuid
 */
async function renderTeamChart(courseUuid) {
  const teamUuid = document.getElementById("groupTeamSelect")?.value;
  if (!teamUuid) return;

  const filters = getTeamFilters();
  const timeline = await loadAnalytics(courseUuid, teamUuid);
  if (!timeline) return;

  const { labels, datasetMap } = buildTimelineDatasets(timeline, filters);

  if (teamChart)
    teamChart.destroy();

  teamChart = ChartHelper.createMultiLineChart(
    "groupAttendanceChart",
    labels,
    datasetMap
  );

  // checkbox listeners
  $$(".group-type").forEach(b => {
    b.addEventListener("change", () => renderTeamChart(courseUuid));
  });
}



/** * buildTimelineDatasets
 * @param {*} timeline
 * @param {*} filters
 * @returns
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




/** * getOverallFilters
 * @returns
 */
function getOverallFilters() {
  const filters = {};
  $$(".overall-type").forEach(b => filters[b.value] = b.checked);
  return filters;
}


/** * getTeamFilters
 * @returns
 */
function getTeamFilters() {
  const filters = {};
  $$(".group-type").forEach(b => filters[b.value] = b.checked);
  return filters;
}

/** * getIndividualFilters
 * @returns
 */
function getIndividualFilters() {
  const filters = {};
  $$(".individual-type").forEach(b => filters[b.value] = b.checked);
  return filters;
}

