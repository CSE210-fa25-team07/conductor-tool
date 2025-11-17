// meeting_list.js — renders upcoming meetings and links to the existing meeting editor
/** @module attendance/meeting_list */

// Load embedModal module
import { createEmbedModal } from "../embedModal/embedModal.js";

// Quick DOM element getter
/**
 * Return a DOM element by id or null when not present.
 * @param {string} id - element id
 * @returns {HTMLElement|null}
 */
function $(id) {return document.getElementById(id);}

// Load meetings from the local storage (this is for mock data)
const LS_KEY = "ct_meetings_v1";
/**
 * Load meetings from localStorage for the mock/demo storage layer.
 * @returns {Array<Object>} array of meeting objects
 */
function loadMeetings() {
  const raw = localStorage.getItem(LS_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Date formatter
/**
 * Format a meeting date/time for display (simple concat of date and time).
 * @param {Object} m - meeting object with `date` and `time` properties
 * @returns {string}
 */
function formatDate(m) { return m.date + " " + m.time; }

// Today's date in ISO format (YYYY-MM-DD)
/**
 * Return today's date as an ISO date string (YYYY-MM-DD).
 * @returns {string}
 */
function todayISO() { return new Date().toISOString().slice(0,10); }

// ===== MEETING LIST RENDERER =====
// This is called every time a change to the meeting list is being made
/**
 * Render upcoming and all meetings into the meeting list page.
 * This function reads local storage each time to ensure the view is
 * consistent with persisted state.
 * @returns {void}
 */
function render() {
  const meetings = loadMeetings();
  const upEl = $("upcomingMeetings");
  const allEl = $("allMeetings");
  const today = todayISO();

  const upcoming = meetings.filter(m => m.date >= today).sort((a,b)=> a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const past = meetings.filter(m => m.date < today).sort((a,b)=> b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  // TODO(bukhradze): The labels will have to be dynamically loaded
  // since we plan to make a db table for custom meeting types
  const TYPE_LABELS = { lecture: "Lecture", office: "Office Hours", ta: "TA Check-In", group: "Discussion/Team Meeting" };
  upEl.innerHTML = upcoming.map(m => `
    <li data-id="${m.id}">
      <strong>${m.title}</strong>
      <div class="meta">${formatDate(m)} — ${TYPE_LABELS[m.type] || m.type}</div>
      <div class="desc">${(m.description || "").slice(0,80)}</div>
      <div class="m-actions">
        <button data-id="${m.id}" class="open">Open</button>
        <button data-id="${m.id}" class="edit">Edit</button>
        <button data-id="${m.id}" class="delete">Delete</button>
      </div>
    </li>`).join("") || "<li class=\"muted\">No upcoming meetings</li>";

  allEl.innerHTML = [...upcoming, ...past].map(m => `
    <li data-id="${m.id}">
      <strong>${m.title}</strong>
      <div class="meta">${formatDate(m)} — ${TYPE_LABELS[m.type] || m.type}</div>
      <div class="desc">${(m.description || "").slice(0,80)}</div>
      <div class="m-actions">
        <button data-id="${m.id}" class="open">Open</button>
        <button data-id="${m.id}" class="edit">Edit</button>
        <button data-id="${m.id}" class="delete">Delete</button>
      </div>
    </li>`).join("") || "<li class=\"muted\">No meetings</li>";
}

// Delete meeting. This has no backend logic, just frontend (for mock purposes)
// TODO(bukhradze) hook it up to out backend and be able to delete meetings
// in the database, provided permissions are valid
/**
 * Delete a meeting after user confirmation and refresh the list.
 * @param {string} id - meeting id to delete
 * @returns {void}
 */
function deleteMeeting(id) {
  if(!confirm("Delete meeting?")) return;
  let meetings = loadMeetings();
  meetings = meetings.filter(m=>m.id!==id);
  localStorage.setItem(LS_KEY, JSON.stringify(meetings));
  render();
}

// Close-embed handler (for functions below) -- these handle operations
// on viewing/editing/deleting meeting in the list
document.addEventListener("DOMContentLoaded", ()=>{
  render();
  document.addEventListener("click", e=>{
    if(e.target.matches(".open")) {
      const id = e.target.dataset.id;
      openEmbedEditorView(id);
    }
    if(e.target.matches(".edit")) {
      const id = e.target.dataset.id;
      openEmbedEditorEdit(id);
    }
    if(e.target.matches(".delete")) {
      deleteMeeting(e.target.dataset.id);
    }
  });
});

// View the meeting data
/**
 * Open the meeting editor in view-only mode for the provided meeting id.
 * Creates (or reuses) the global embed modal instance and instructs it to
 * show the editor page with ?view=<id> set.
 * @param {string} meetingId - meeting id to view
 * @returns {void}
 */
function openEmbedEditorView(meetingId) {
  const url = new URL(window.location.origin + "/frontend/html/pages/attendance/meeting/meeting.html");
  url.searchParams.set("view", meetingId);
  if(!window.ctEmbedModal) window.ctEmbedModal = createEmbedModal({ id: "embed-modal" });
  window.ctEmbedModal.titleEl.textContent = "About the meeting";
  window.ctEmbedModal.show(url.toString());
}

// Edit the meeting data
/**
 * Open the meeting editor in edit mode for the provided meeting id.
 * @param {string} meetingId - meeting id to edit
 * @returns {void}
 */
function openEmbedEditorEdit(meetingId) {
  const url = new URL(window.location.origin + "/frontend/html/pages/attendance/meeting/meeting.html");
  url.searchParams.set("edit", meetingId);
  if(!window.ctEmbedModal) window.ctEmbedModal = createEmbedModal({ id: "embed-modal" });
  window.ctEmbedModal.titleEl.textContent = "Edit meeting";
  window.ctEmbedModal.show(url.toString());
}

// Listen for embedded save message to refresh list and close modal
window.addEventListener("message", (ev)=>{
  if(!ev.data) return;
  if(ev.data.type === "meetingSaved") {
    if(window.ctEmbedModal) window.ctEmbedModal.hide();
    render();
  }
});


