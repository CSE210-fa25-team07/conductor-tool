/** @module attendance/calendar */

// Calendar functionality for processing the stored data and
// displaying it on the page.

// TODO(bukhradze) This is designed for the mock data, will have to be rewritten for
// future integration with the proper backend and databases
import { createEmbedModal } from "../embedModal/embedModal.js";
const calendarEl = document.getElementById("calendar");
const monthYear = document.getElementById("month-year");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const addModal = document.getElementById("add-modal");
const deleteModal = document.getElementById("delete-modal");
const selectedDateDisplay = document.getElementById("selected-date");
const eventTitleInput = document.getElementById("event-title");
const eventTypeSelect = document.getElementById("event-type");
const saveEventBtn = document.getElementById("save-event");
const closeModalBtn = document.getElementById("close-modal");
const confirmDeleteBtn = document.getElementById("confirm-delete");
const cancelDeleteBtn = document.getElementById("cancel-delete");

const currentDate = new Date();
// Use same storage as meetings — stored under 'ct_meetings_v1'
const LS_KEY = "ct_meetings_v1";
let meetings = JSON.parse(localStorage.getItem(LS_KEY)) || [];
let selectedDate = null;
let eventToDelete = null;
const visibleTypes = { lecture: true, office: true, ta: true, group: true };

function saveMeetings() { localStorage.setItem(LS_KEY, JSON.stringify(meetings)); }

function normalizeType(t) {
  if(!t) return t;
  const low = String(t).toLowerCase();
  if(low.includes("lect")) return "lecture";
  if(low.includes("office")) return "office";
  if(low.includes("ta")) return "ta";
  if(low.includes("team") || low.includes("group") || low.includes("discuss")) return "group";
  return low;
}

function renderCalendar() {
  meetings = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  // normalize meeting types for compatibility between views
  let changed = false;
  meetings = meetings.map(m => {
    const nt = normalizeType(m.type);
    if(nt !== m.type) { changed = true; return Object.assign({}, m, { type: nt }); }
    return m;
  });
  if(changed) saveMeetings();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  monthYear.textContent = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  calendarEl.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  for (let i = 0; i < startDay; i++) {
    const emptyDiv = document.createElement("div");
    emptyDiv.classList.add("day","empty");
    calendarEl.appendChild(emptyDiv);
  }

  for (let day=1; day<=totalDays; day++) {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split("T")[0];
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    if(date.getDate()===new Date().getDate() && date.getMonth()===new Date().getMonth() && date.getFullYear()===new Date().getFullYear()) {
      dayDiv.classList.add("today");
    }
    const dayNumber = document.createElement("div"); dayNumber.classList.add("day-number"); dayNumber.textContent = day;
    const eventContainer = document.createElement("div"); eventContainer.classList.add("day-events");

    const dayMeetings = meetings.filter(m => m.date === dateString && visibleTypes[m.type]);
    dayMeetings.forEach(m => {
      const ev = document.createElement("div");
      ev.classList.add("event", m.type);
      // show time + title on the event tile
      const timeText = m.time ? `${m.time} ` : "";
      ev.textContent = `${timeText}${m.title}`;
      // tooltip with description and invitee count
      const inviteCount = (m.invitees && Array.isArray(m.invitees)) ? m.invitees.length : 0;
      ev.title = `${m.title}\n${m.time || ""}\n${m.description || ""}\nInvitees: ${inviteCount}`;
      // clicking an event opens the embedded meeting viewer (read-only "About the meeting")
      ev.onclick = (e)=>{ e.stopPropagation(); openEditModal(m.id); };
      eventContainer.appendChild(ev);
    });

    dayDiv.appendChild(dayNumber); dayDiv.appendChild(eventContainer);
    dayDiv.onclick = (e)=>{ if(e.target.classList.contains("event")) return; openAddModal(dateString); };
    calendarEl.appendChild(dayDiv);
  }
}

function openAddModal(dateString) {
  // Open embedded meeting editor as a subpage, passing ?date=<date> so it pre-fills the form
  selectedDate = dateString;
  const url = new URL(window.location.origin + "/frontend/html/pages/attendance/meeting/meeting.html");
  url.searchParams.set("date", dateString);
  if(!window.ctEmbedModal) window.ctEmbedModal = createEmbedModal({ id: "embed-modal", title: `Create meeting on ${dateString}` });
  window.ctEmbedModal.titleEl.textContent = `Create meeting on ${dateString}`;
  window.ctEmbedModal.show(url.toString());
}
function openEditModal(meetingId) {
  const url = new URL(window.location.origin + "/frontend/html/pages/attendance/meeting/meeting.html");
  // use ?view=<id> to open the meeting in read-only "About the meeting" mode
  url.searchParams.set("view", meetingId);
  if(!window.ctEmbedModal) window.ctEmbedModal = createEmbedModal({ id: "embed-modal" });
  window.ctEmbedModal.titleEl.textContent = "About the meeting";
  window.ctEmbedModal.show(url.toString());
}
function openDeleteModal(m) { eventToDelete = m; document.getElementById("delete-event-title").textContent = m.title; deleteModal.classList.remove("hidden"); }
function closeModals() {
  if(addModal && addModal.classList) addModal.classList.add("hidden");
  if(deleteModal && deleteModal.classList) deleteModal.classList.add("hidden");
}

if(saveEventBtn) {
  saveEventBtn.onclick = ()=>{
    // guard required inputs (these elements are optional in the simplified calendar HTML)
    if(!eventTitleInput || !eventTitleInput.value || eventTitleInput.value.trim()==="") return;
    const etype = (eventTypeSelect && eventTypeSelect.value) ? eventTypeSelect.value : "group";
    meetings.push({ id: "m_"+Math.random().toString(36).slice(2,9), title: eventTitleInput.value.trim(), date: selectedDate, type: etype, description: "" });
    saveMeetings(); closeModals(); renderCalendar();
  };
}
if(confirmDeleteBtn) {
  confirmDeleteBtn.onclick = ()=>{
    meetings = meetings.filter(e=>e!==eventToDelete); saveMeetings(); closeModals(); renderCalendar();
  };
}
if(closeModalBtn) closeModalBtn.onclick = ()=> closeModals();
if(cancelDeleteBtn) cancelDeleteBtn.onclick = ()=> closeModals();
prevMonthBtn.onclick = ()=>{ currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); };
nextMonthBtn.onclick = ()=>{ currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); };
document.querySelectorAll(".filter-checkbox").forEach(cb => cb.addEventListener("change", ()=>{ visibleTypes[cb.dataset.type]=cb.checked; renderCalendar(); }));

document.addEventListener("DOMContentLoaded", ()=>{ renderCalendar(); });

// handle messages from embedded meeting editor iframe
window.addEventListener("message", (ev)=>{
  if(!ev.data) return;
  if(ev.data.type === "meetingSaved") {
    // close modal and refresh calendar
    if(window.ctEmbedModal) window.ctEmbedModal.hide();
    renderCalendar();
  }
});

// no static close-embed handler needed; modal has its own button handler created by the component
