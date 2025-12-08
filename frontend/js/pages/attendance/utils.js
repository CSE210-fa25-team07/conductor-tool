/**
 * Shared attendance utilities: date helpers, role checks, and type mappings.
 * @module attendance/utils
 */

const MEETING_TYPES = {
  "Lecture": 0,
  "OH": 1,
  "TA Check-In": 2,
  "Team Meeting": 3
};

const MEETING_TYPE_NAMES = { 0: "Lecture", 1: "OH", 2: "TA Check-In", 3: "Team Meeting" };

export function mapMeetingTypeToInt(typeString) {
  return MEETING_TYPES[typeString] ?? 0;
}

export function mapMeetingTypeToString(typeInt) {
  return MEETING_TYPE_NAMES[typeInt] || "Lecture";
}

export function isStaffRole(role) {
  return role === "Professor" || role === "TA";
}

export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatTimeForDisplay(timeStr) {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  const hour12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";
  return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

export function parseMeetingDate(date) {
  if (date instanceof Date) return date;
  if (typeof date !== "string") return null;

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  return parseLocalDate(date);
}

export function isValidMeetingLocation(location) {
  if (!location || location.trim() === "") return true;
  const trimmed = location.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return true;
  const zoomPattern = /^https?:\/\/([a-z0-9-]+\.)?zoom\.us\/(j|s)\/[0-9]+(\?.*)?$/i;
  const meetPattern = /^https?:\/\/(meet\.)?google\.(com|co\.[a-z]{2})\/[a-z]+(-[a-z]+)+(\?.*)?$/i;
  return zoomPattern.test(trimmed) || meetPattern.test(trimmed);
}

export function getCourseIdFromUrl() {
  const match = window.location.pathname.match(/^\/courses\/([^/]+)/);
  return match ? match[1] : null;
}

