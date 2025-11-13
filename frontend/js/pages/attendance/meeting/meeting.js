// meeting.js — handles meeting creation/editing, invitees, and attendance QR/code
const STUDENTS = [
  { id: "s1", name: "Alice Johnson", team: "Team A" },
  { id: "s2", name: "Bob Smith", team: "Team A" },
  { id: "s3", name: "Carlos Gomez", team: "Team B" },
  { id: "s4", name: "Dana Lee", team: "Team B" },
  { id: "s5", name: "Evan Patel", team: "Team C" },
  { id: "s6", name: "Fiona Chen", team: "Team C" },
  { id: "s7", name: "George King", team: "Team A" },
  { id: "s8", name: "Hannah Park", team: "Team B" }
];

const LS_KEY = "ct_meetings_v1";
const TYPE_LABELS = { lecture: "Lecture", office: "Office Hours", ta: "TA Check-In", group: "Discussion/Team Meeting" };
let meetings = [];
let selectedInvitees = new Set();
let scanner = null;
let isViewing = false;
let isEditing = false;
let currentLoadedMeetingId = null;

function uid() { return "m_" + Math.random().toString(36).slice(2,9); }

function load() {
  const raw = localStorage.getItem(LS_KEY);
  meetings = raw ? JSON.parse(raw) : [];
}

function saveAll() {
  localStorage.setItem(LS_KEY, JSON.stringify(meetings));
}

function $(id) {return document.getElementById(id);}

function populateTeams() {
  const teams = Array.from(new Set(STUDENTS.map(s=>s.team)));
  const sel = $("teamSelect");
  if(!sel) return;
  sel.innerHTML = "<option value=\"\">--Pick team--</option>" + teams.map(t => `<option value="${t}">${t}</option>`).join("");
}

function renderStudentResults(filter="") {
  const ul = $("studentResults");
  if(!ul) return; // page may omit the search UI when used as a lightweight viewer
  const f = filter.trim().toLowerCase();
  const res = STUDENTS.filter(s => !selectedInvitees.has(s.id) && (f === "" || s.name.toLowerCase().includes(f)));
  ul.innerHTML = res.map(s => `<li data-id="${s.id}">${s.name} <button data-id="${s.id}" class="add-student">Add</button></li>`).join("") || "<li class=\"muted\">No matches</li>";
}

function renderSelectedInvitees() {
  const ul = $("selectedInvitees");
  if(!ul) return;
  const items = Array.from(selectedInvitees).map(id => STUDENTS.find(s=>s.id===id)).filter(Boolean);
  ul.innerHTML = items.map(s => `<li data-id="${s.id}">${s.name} <button data-id="${s.id}" class="remove-invitee">Remove</button></li>`).join("") || "<li class=\"muted\">No invitees selected</li>";
}

function renderMeetings() {
  const ul = $("meetings");
  if(!ul) return;
  if(meetings.length===0) { ul.innerHTML = "<li class=\"muted\">No meetings yet</li>"; } else {
    ul.innerHTML = meetings.map(m => {
      const dt = m.date + " " + m.time;
      const label = TYPE_LABELS[m.type] || m.type;
      return `<li data-id="${m.id}"><strong>${m.title}</strong> <span class="muted">(${label})</span><div class="meta">${dt}</div>
        <div class="m-actions">
          <button data-id="${m.id}" class="edit">Edit</button>
          <button data-id="${m.id}" class="delete">Delete</button>
          <button data-id="${m.id}" class="view-att">View Attendance</button>
        </div>
      </li>`;
    }).join("");
  }
  populateMeetingPicker();
}

function populateMeetingPicker() {
  const sel = $("meetingPicker");
  if(!sel) return;
  sel.innerHTML = meetings.map(m => `<option value="${m.id}">${m.title} — ${m.date} ${m.time}</option>`).join("") || "<option value=\"\">(no meetings)</option>";
}

function initForm() {
  populateTeams();
  renderStudentResults();
  renderSelectedInvitees();
  renderMeetings();

  // If loaded in iframe with ?date= we prefill date and scroll to form
  try{
    const params = new URLSearchParams(window.location.search);
    const preset = params.get("date");
    const viewId = params.get("view");
    const editId = params.get("edit");
    if(preset) { $("date").value = preset; window.parent && window.parent.postMessage({ type: "meeting-prefill-ready" }, "*"); }
    // Priority: explicit view param opens read-only "About the meeting".
    if(viewId) {
      loadMeetingForView(viewId);
    } else if(editId) {
      // open and immediately enable editing when ?edit is provided
      loadMeetingForView(editId);
      // if the meeting was loaded successfully, switch to editing
      if(document.getElementById("meetingId") && document.getElementById("meetingId").value === editId) { enableEditing(); }
    } else {
      enterCreateMode();
    }
  }catch(e) { }

  // If embedded inside the calendar iframe, adopt calendar styling to match the host and inject calendar.css
  try{
    if(window.parent && window.parent !== window) {
      document.body.classList.add("calendar-view");
      // inject calendar.css from the repo path if not already present
      const cssHref = window.location.origin + "/frontend/css/components/calendar.css";
      if(!document.querySelector(`link[href="${cssHref}"]`)) {
        const l = document.createElement("link"); l.rel = "stylesheet"; l.href = cssHref; document.head.appendChild(l);
      }
      // when embedded in a modal, keep the editor focused (meeting list is no longer present on this page)
    }
  }catch(e) { }

  // events
  if($("studentSearch")) $("studentSearch").addEventListener("input", e => renderStudentResults(e.target.value));
  document.addEventListener("click", e => {
    if(e.target.matches(".add-student")) {
      const id = e.target.dataset.id; selectedInvitees.add(id); renderStudentResults($("studentSearch").value); renderSelectedInvitees();
    }
    if(e.target.matches(".remove-invitee")) {
      const id = e.target.dataset.id; selectedInvitees.delete(id); renderStudentResults($("studentSearch").value); renderSelectedInvitees();
    }
    if(e.target.matches(".delete")) { deleteMeeting(e.target.dataset.id); }
    if(e.target.matches(".view-att")) { viewAttendance(e.target.dataset.id); }
  });

  if($("addBySearch")) {
    $("addBySearch").addEventListener("click", ()=>{
      const text = ($("studentSearch") && $("studentSearch").value) ? $("studentSearch").value.trim().toLowerCase() : "";
      const found = STUDENTS.find(s=>s.name.toLowerCase().includes(text));
      if(found) { selectedInvitees.add(found.id); renderStudentResults($("studentSearch") ? $("studentSearch").value : ""); renderSelectedInvitees(); }
    });
  }

  if($("addTeam")) {
    $("addTeam").addEventListener("click", ()=>{
      const team = $("teamSelect") ? $("teamSelect").value : ""; if(!team) return;
      STUDENTS.filter(s=>s.team===team).forEach(s=>selectedInvitees.add(s.id));
      renderStudentResults($("studentSearch") ? $("studentSearch").value : ""); renderSelectedInvitees();
    });
  }

  if($("addAll")) {
    $("addAll").addEventListener("click", ()=>{
      STUDENTS.forEach(s=>selectedInvitees.add(s.id)); renderStudentResults($("studentSearch") ? $("studentSearch").value : ""); renderSelectedInvitees();
    });
  }

  $("meetingForm").addEventListener("submit", e => { e.preventDefault(); saveMeeting(); });
  const cancelBtn = $("cancelEdit");
  if(cancelBtn) { cancelBtn.addEventListener("click", ()=>{
    if(isViewing && !isEditing && currentLoadedMeetingId) {
      // if we're viewing (not editing) cancel does nothing
      return;
    }
    if(isViewing && isEditing && currentLoadedMeetingId) {
      // cancel edits -> reload original meeting view
      loadMeetingForView(currentLoadedMeetingId);
      return;
    }
    // creating mode: reset form
    resetForm();
  }); }
  // view-controls (shown when viewing an existing meeting)
  const vc = document.querySelector(".view-controls");
  if(vc) {
    const editBtn = document.getElementById("editMeeting");
    const recordBtn = document.getElementById("recordAttendance");
    if(editBtn) { editBtn.addEventListener("click", ()=>{ enableEditing(); }); }
    if(recordBtn) { recordBtn.addEventListener("click", ()=>{ revealAttendanceForCurrent(); }); }
  }

  if($("generateCodes")) {
    $("generateCodes").addEventListener("click", ()=>{
      const mid = ($("meetingPicker") && $("meetingPicker").value) ? $("meetingPicker").value : currentLoadedMeetingId;
      if(!mid) return alert("Pick a meeting first");
      generateCodesForMeeting(mid);
    });
  }

  $("startCamera").addEventListener("click", startScanner);
  $("stopCamera").addEventListener("click", stopScanner);
  $("submitCode").addEventListener("click", ()=>{
    const code = $("attendanceCode").value.trim(); if(!code) return; submitAttendanceCode(code);
  });
}

function enterCreateMode() {
  // Creating a new meeting: form editable, no view-controls, attendance hidden
  isViewing = false; isEditing = true; currentLoadedMeetingId = null;
  const vc = document.querySelector(".view-controls"); if(vc) vc.style.display = "none";
  // show form, hide about section
  const about = document.querySelector(".meeting-about"); if(about) about.style.display = "none";
  const formSec = document.querySelector(".meeting-form"); if(formSec) formSec.style.display = "block";
  if($("attendanceSection")) $("attendanceSection").style.display = "none";
  // ensure form inputs are enabled and save button visible
  setFormEditable(true);
}

function loadMeetingForView(id) {
  const m = meetings.find(x=>x.id===id);
  if(!m) return;
  currentLoadedMeetingId = id;
  isViewing = true; isEditing = false;
  // populate fields (keep form inputs in sync so enabling edit is immediate)
  $("meetingId").value = m.id;
  $("title").value = m.title;
  $("type").value = m.type;
  $("date").value = m.date;
  $("time").value = m.time;
  $("description").value = m.description;
  selectedInvitees = new Set(m.invitees || []);
  renderStudentResults(); renderSelectedInvitees();
  // Populate the 'About' section for read-only display
  const about = document.querySelector(".meeting-about");
  if(about) {
    about.style.display = "block";
    const at = document.getElementById("aboutTitle"); if(at) at.textContent = m.title || "About the meeting";
    const am = document.getElementById("aboutMeta"); if(am) am.textContent = `${m.date || ""} ${m.time || ""} — ${TYPE_LABELS[m.type] || m.type}`;
    const ad = document.getElementById("aboutDescription"); if(ad) ad.textContent = m.description || "";
    const ai = document.getElementById("aboutInvitees"); if(ai) {
      const items = Array.from(new Set(m.invitees || [])).map(id => {
        const s = STUDENTS.find(ss => ss.id === id);
        return `<li>${s ? s.name : id}</li>`;
      }).join("") || "<li class=\"muted\">No invitees</li>";
      ai.innerHTML = items;
    }
  }
  // hide the editable form while viewing
  const formSec = document.querySelector(".meeting-form"); if(formSec) formSec.style.display = "none";
  // Show view controls (they are inside the about section)
  const vc = document.querySelector(".view-controls"); if(vc) vc.style.display = "block";
  // Hide attendance until explicitly requested
  if($("attendanceSection")) $("attendanceSection").style.display = "none";
  // Make form read-only (in case it's shown later)
  setFormEditable(false);
}

function enableEditing() {
  if(!isViewing) return; // only allow when viewing an existing meeting
  isEditing = true; // editing mode
  // show the form and hide the about view
  const about = document.querySelector(".meeting-about"); if(about) about.style.display = "none";
  const formSec = document.querySelector(".meeting-form"); if(formSec) formSec.style.display = "block";
  setFormEditable(true);
}

function setFormEditable(val) {
  // enable/disable inputs and show/hide save button
  const inputs = ["title","type","date","time","description","studentSearch","teamSelect"];
  inputs.forEach(id=>{ const el = $(id); if(el) el.disabled = !val; });
  // enable invitees controls
  const addBtns = document.querySelectorAll(".add-student, .remove-invitee, #addBySearch, #addTeam, #addAll");
  addBtns.forEach(b=>{ if(b) b.disabled = !val; });
  const saveBtn = $("saveMeeting"); if(saveBtn) saveBtn.style.display = val ? "inline-block" : "none";
  const cancelBtn = $("cancelEdit"); if(cancelBtn) cancelBtn.style.display = val ? "inline-block" : "none";
}

function revealAttendanceForCurrent() {
  if(!currentLoadedMeetingId) return alert("No meeting loaded");
  if($("attendanceSection")) $("attendanceSection").style.display = "block";
  if($("attendanceNotice")) $("attendanceNotice").style.display = "none";
  // pre-select the current meeting in meetingPicker
  const sel = $("meetingPicker"); if(sel) sel.value = currentLoadedMeetingId;
  // hide the meeting picker when we're recording attendance for the meeting we're viewing
  try{ if(sel && sel.parentElement) sel.parentElement.style.display = "none"; }catch(e) {}
  // automatically generate codes for the currently viewed meeting
  try{ generateCodesForMeeting(currentLoadedMeetingId).catch(()=>{}); }catch(e) {}
}

function saveMeeting() {
  const id = $("meetingId").value || uid();
  const meeting = {
    id,
    title: $("title").value,
    type: $("type").value,
    date: $("date").value,
    time: $("time").value,
    description: $("description").value,
    invitees: Array.from(selectedInvitees),
    attendance: {},
    currentCode: null,
    codeGeneratedAt: null
  };
  const i = meetings.findIndex(m=>m.id===id);
  if(i>=0) meetings[i] = meeting; else meetings.push(meeting);
  saveAll(); renderMeetings(); resetForm();
  // After saving, if we were editing or viewing an existing meeting, return to view mode of that meeting
  const wasLoadedId = currentLoadedMeetingId;
  if(wasLoadedId && wasLoadedId === id) {
    // reload saved meeting into view mode
    loadMeetingForView(id);
  } else {
    // if it was a create, clear the form
    resetForm();
  }
  // if embedded in parent page, notify parent so it can close the modal and refresh
  try{ if(window.parent && window.parent !== window) { window.parent.postMessage({ type: "meetingSaved", meeting }, "*"); } }catch(e) {}
  // show a short confirmation toast
  try{ showToast("Meeting saved"); }catch(e) {}
}

function showToast(msg, ms=1800) {
  const t = $("toast"); if(!t) return; t.textContent = msg; t.classList.remove("hidden");
  setTimeout(()=>{ t.classList.add("hidden"); }, ms);
}

function resetForm() {
  $("meetingId").value=""; $("title").value=""; $("date").value=""; $("time").value=""; $("description").value=""; selectedInvitees.clear(); renderStudentResults(); renderSelectedInvitees();
  isViewing = false; isEditing = false; currentLoadedMeetingId = null;
  const vc = document.querySelector(".view-controls"); if(vc) vc.style.display = "none";
  // ensure about section hidden and form visible for creating
  const about = document.querySelector(".meeting-about"); if(about) about.style.display = "none";
  const formSec = document.querySelector(".meeting-form"); if(formSec) formSec.style.display = "block";
  setFormEditable(true);
}

// startEdit handled by meeting_list / calendar pages which open the editor in a modal.
// This function removed to avoid legacy navigation.

function deleteMeeting(id) {
  if(!confirm("Delete meeting?")) return; meetings = meetings.filter(m=>m.id!==id); saveAll(); renderMeetings();
}

function viewAttendance(id) {
  const m = meetings.find(x=>x.id===id); if(!m) return;
  const lines = Object.entries(m.attendance||{}).map(([sid,present]) => {
    const s = STUDENTS.find(st=>st.id===sid); return `<li>${s? s.name : sid} — ${present? "Present" : "Absent"}</li>`;
  }).join("") || "<li class=\"muted\">No attendance recorded</li>";
  alert(`Attendance for ${m.title}:\n` + (lines.replace(/<[^>]+>/g," ")));
}

function generateRandomCode(len=5) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out=""; for(let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)]; return out;
}

async function generateCodesForMeeting(id) {
  const m = meetings.find(x=>x.id===id); if(!m) return;
  const code = generateRandomCode(5);
  m.currentCode = code;
  m.codeGeneratedAt = Date.now();
  saveAll();
  const codeDisp = $("codeDisplay"); if(codeDisp) codeDisp.textContent = `Code: ${code}`;
  // generate QR
  const qroot = $("qrcode");
  const payload = JSON.stringify({meetingId: m.id, code});
  if(qroot) qroot.innerHTML = "";
  try{
    const canvas = document.createElement("canvas");
    if(qroot) qroot.appendChild(canvas);
    await QRCode.toCanvas(canvas, payload, { width: 200 });
  } catch(err) { try{ showToast("QR generation failed"); }catch(e) {} if(qroot) qroot.textContent = payload; }
}

function startScanner() {
  const video = $("video");
  if(scanner) { scanner.start(); return; }
  // QrScanner from library
  scanner = new QrScanner(video, result => {
    // result contains the payload we encoded
    try{
      const data = JSON.parse(result);
      if(data && data.code) {
        stopScanner();
        // ask student identity
        const name = prompt("Enter your full name to check in (must match class roster):");
        if(!name) return alert("Name required");
        const student = STUDENTS.find(s=>s.name.toLowerCase()===name.toLowerCase());
        if(!student) return alert("Name not found in class roster");
        const meeting = meetings.find(m=>m.id===data.meetingId);
        if(!meeting) return alert("Meeting not found");
        if(meeting.currentCode !== data.code) return alert("Code mismatch or expired");
        meeting.attendance = meeting.attendance || {};
        meeting.attendance[student.id] = true;
        saveAll();
        $("attendanceResult").textContent = `${student.name} recorded as present for ${meeting.title}`;
      }
    }catch(e) { try{ showToast("Scan processing failed"); }catch(ex) {} }
  });
  scanner.start();
}

function stopScanner() { if(scanner) scanner.stop(); }

function submitAttendanceCode(code) {
  const meetingId = ($("meetingPicker") && $("meetingPicker").value) ? $("meetingPicker").value : currentLoadedMeetingId;
  if(!meetingId) return alert("Pick meeting");
  const meeting = meetings.find(m=>m.id===meetingId); if(!meeting) return;
  if(meeting.currentCode !== code) return alert("Incorrect code");
  const name = prompt("Enter your full name to check in (must match roster):");
  if(!name) return alert("Name required");
  const student = STUDENTS.find(s=>s.name.toLowerCase()===name.toLowerCase());
  if(!student) return alert("Name not found in roster");
  meeting.attendance = meeting.attendance || {};
  meeting.attendance[student.id] = true;
  saveAll();
  $("attendanceResult").textContent = `${student.name} recorded as present for ${meeting.title}`;
}

// init
load();
document.addEventListener("DOMContentLoaded", ()=>{ initForm(); });
