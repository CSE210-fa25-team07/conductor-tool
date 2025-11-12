// meeting.js — handles meeting creation/editing, invitees, and attendance QR/code
const STUDENTS = [
  { id: 's1', name: 'Alice Johnson', team: 'Team A' },
  { id: 's2', name: 'Bob Smith', team: 'Team A' },
  { id: 's3', name: 'Carlos Gomez', team: 'Team B' },
  { id: 's4', name: 'Dana Lee', team: 'Team B' },
  { id: 's5', name: 'Evan Patel', team: 'Team C' },
  { id: 's6', name: 'Fiona Chen', team: 'Team C' },
  { id: 's7', name: 'George King', team: 'Team A' },
  { id: 's8', name: 'Hannah Park', team: 'Team B' }
];

const LS_KEY = 'ct_meetings_v1';
let meetings = [];
let selectedInvitees = new Set();
let scanner = null;

function uid() { return 'm_' + Math.random().toString(36).slice(2,9); }

function load() {
  const raw = localStorage.getItem(LS_KEY);
  meetings = raw ? JSON.parse(raw) : [];
}

function saveAll() {
  localStorage.setItem(LS_KEY, JSON.stringify(meetings));
}

function $(id){return document.getElementById(id)}

function populateTeams() {
  const teams = Array.from(new Set(STUDENTS.map(s=>s.team)));
  const sel = $('teamSelect');
  sel.innerHTML = '<option value="">--Pick team--</option>' + teams.map(t => `<option value="${t}">${t}</option>`).join('');
}

function renderStudentResults(filter=''){
  const ul = $('studentResults');
  const f = filter.trim().toLowerCase();
  const res = STUDENTS.filter(s => !selectedInvitees.has(s.id) && (f === '' || s.name.toLowerCase().includes(f)));
  ul.innerHTML = res.map(s => `<li data-id="${s.id}">${s.name} <button data-id="${s.id}" class="add-student">Add</button></li>`).join('') || '<li class="muted">No matches</li>';
}

function renderSelectedInvitees(){
  const ul = $('selectedInvitees');
  const items = Array.from(selectedInvitees).map(id => STUDENTS.find(s=>s.id===id)).filter(Boolean);
  ul.innerHTML = items.map(s => `<li data-id="${s.id}">${s.name} <button data-id="${s.id}" class="remove-invitee">Remove</button></li>`).join('') || '<li class="muted">No invitees selected</li>';
}

function renderMeetings(){
  const ul = $('meetings');
  if(meetings.length===0){ ul.innerHTML = '<li class="muted">No meetings yet</li>'; } else {
    ul.innerHTML = meetings.map(m => {
      const dt = m.date + ' ' + m.time;
      return `<li data-id="${m.id}"><strong>${m.title}</strong> <span class="muted">(${m.type})</span><div class="meta">${dt}</div>
        <div class="m-actions">
          <button data-id="${m.id}" class="edit">Edit</button>
          <button data-id="${m.id}" class="delete">Delete</button>
          <button data-id="${m.id}" class="view-att">View Attendance</button>
        </div>
      </li>`;
    }).join('');
  }
  populateMeetingPicker();
}

function populateMeetingPicker(){
  const sel = $('meetingPicker');
  sel.innerHTML = meetings.map(m => `<option value="${m.id}">${m.title} — ${m.date} ${m.time}</option>`).join('') || '<option value="">(no meetings)</option>';
}

function initForm(){
  populateTeams();
  renderStudentResults();
  renderSelectedInvitees();
  renderMeetings();

  // events
  $('studentSearch').addEventListener('input', e => renderStudentResults(e.target.value));
  document.addEventListener('click', e => {
    if(e.target.matches('.add-student')){
      const id = e.target.dataset.id; selectedInvitees.add(id); renderStudentResults($('studentSearch').value); renderSelectedInvitees();
    }
    if(e.target.matches('.remove-invitee')){
      const id = e.target.dataset.id; selectedInvitees.delete(id); renderStudentResults($('studentSearch').value); renderSelectedInvitees();
    }
    if(e.target.matches('.edit')){ startEdit(e.target.dataset.id); }
    if(e.target.matches('.delete')){ deleteMeeting(e.target.dataset.id); }
    if(e.target.matches('.view-att')){ viewAttendance(e.target.dataset.id); }
  });

  $('addBySearch').addEventListener('click', ()=>{
    const text = $('studentSearch').value.trim().toLowerCase();
    const found = STUDENTS.find(s=>s.name.toLowerCase().includes(text));
    if(found){ selectedInvitees.add(found.id); renderStudentResults($('studentSearch').value); renderSelectedInvitees(); }
  });

  $('addTeam').addEventListener('click', ()=>{
    const team = $('teamSelect').value; if(!team) return;
    STUDENTS.filter(s=>s.team===team).forEach(s=>selectedInvitees.add(s.id));
    renderStudentResults($('studentSearch').value); renderSelectedInvitees();
  });

  $('addAll').addEventListener('click', ()=>{
    STUDENTS.forEach(s=>selectedInvitees.add(s.id)); renderStudentResults($('studentSearch').value); renderSelectedInvitees();
  });

  $('meetingForm').addEventListener('submit', e => { e.preventDefault(); saveMeeting(); });
  $('cancelEdit').addEventListener('click', resetForm);

  $('generateCodes').addEventListener('click', ()=>{
    const mid = $('meetingPicker').value; if(!mid) return alert('Pick a meeting first');
    generateCodesForMeeting(mid);
  });

  $('startCamera').addEventListener('click', startScanner);
  $('stopCamera').addEventListener('click', stopScanner);
  $('submitCode').addEventListener('click', ()=>{
    const code = $('attendanceCode').value.trim(); if(!code) return; submitAttendanceCode(code);
  });
}

function saveMeeting(){
  const id = $('meetingId').value || uid();
  const meeting = {
    id,
    title: $('title').value,
    type: $('type').value,
    date: $('date').value,
    time: $('time').value,
    description: $('description').value,
    invitees: Array.from(selectedInvitees),
    attendance: {},
    currentCode: null,
    codeGeneratedAt: null
  };
  const i = meetings.findIndex(m=>m.id===id);
  if(i>=0) meetings[i] = meeting; else meetings.push(meeting);
  saveAll(); renderMeetings(); resetForm();
}

function resetForm(){
  $('meetingId').value=''; $('title').value=''; $('date').value=''; $('time').value=''; $('description').value=''; selectedInvitees.clear(); renderStudentResults(); renderSelectedInvitees();
}

function startEdit(id){
  const m = meetings.find(x=>x.id===id); if(!m) return;
  $('meetingId').value = m.id;
  $('title').value = m.title;
  $('type').value = m.type;
  $('date').value = m.date;
  $('time').value = m.time;
  $('description').value = m.description;
  selectedInvitees = new Set(m.invitees || []);
  renderStudentResults(); renderSelectedInvitees();
  window.scrollTo({top:0,behavior:'smooth'});
}

function deleteMeeting(id){
  if(!confirm('Delete meeting?')) return; meetings = meetings.filter(m=>m.id!==id); saveAll(); renderMeetings();
}

function viewAttendance(id){
  const m = meetings.find(x=>x.id===id); if(!m) return;
  const lines = Object.entries(m.attendance||{}).map(([sid,present]) => {
    const s = STUDENTS.find(st=>st.id===sid); return `<li>${s? s.name : sid} — ${present? 'Present' : 'Absent'}</li>`;
  }).join('') || '<li class="muted">No attendance recorded</li>';
  alert(`Attendance for ${m.title}:\n` + (lines.replace(/<[^>]+>/g,' ')));
}

function generateRandomCode(len=5){
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out=''; for(let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)]; return out;
}

async function generateCodesForMeeting(id){
  const m = meetings.find(x=>x.id===id); if(!m) return;
  const code = generateRandomCode(5);
  m.currentCode = code;
  m.codeGeneratedAt = Date.now();
  saveAll();
  $('codeDisplay').textContent = `Code: ${code}`;
  // generate QR
  const qroot = $('qrcode'); qroot.innerHTML = '';
  const payload = JSON.stringify({meetingId: m.id, code});
  try{
    const canvas = document.createElement('canvas');
    qroot.appendChild(canvas);
    await QRCode.toCanvas(canvas, payload, { width: 200 });
  } catch(err){ console.error('QR gen err', err); qroot.textContent = payload; }
}

function startScanner(){
  const video = $('video');
  if(scanner){ scanner.start(); return; }
  // QrScanner from library
  scanner = new QrScanner(video, result => {
    // result contains the payload we encoded
    try{
      const data = JSON.parse(result);
      if(data && data.code){
        stopScanner();
        // ask student identity
        const name = prompt('Enter your full name to check in (must match class roster):');
        if(!name) return alert('Name required');
        const student = STUDENTS.find(s=>s.name.toLowerCase()===name.toLowerCase());
        if(!student) return alert('Name not found in class roster');
        const meeting = meetings.find(m=>m.id===data.meetingId);
        if(!meeting) return alert('Meeting not found');
        if(meeting.currentCode !== data.code) return alert('Code mismatch or expired');
        meeting.attendance = meeting.attendance || {};
        meeting.attendance[student.id] = true;
        saveAll();
        $('attendanceResult').textContent = `${student.name} recorded as present for ${meeting.title}`;
      }
    }catch(e){ console.warn('scan result', result); }
  });
  scanner.start();
}

function stopScanner(){ if(scanner) scanner.stop(); }

function submitAttendanceCode(code){
  const meetingId = $('meetingPicker').value; if(!meetingId) return alert('Pick meeting');
  const meeting = meetings.find(m=>m.id===meetingId); if(!meeting) return;
  if(meeting.currentCode !== code) return alert('Incorrect code');
  const name = prompt('Enter your full name to check in (must match roster):');
  if(!name) return alert('Name required');
  const student = STUDENTS.find(s=>s.name.toLowerCase()===name.toLowerCase());
  if(!student) return alert('Name not found in roster');
  meeting.attendance = meeting.attendance || {};
  meeting.attendance[student.id] = true;
  saveAll();
  $('attendanceResult').textContent = `${student.name} recorded as present for ${meeting.title}`;
}

// init
load(); document.addEventListener('DOMContentLoaded', ()=>{ initForm();
  // If a query param ?edit=<meetingId> is present, auto-open that meeting for edit.
  try{
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if(editId){ startEdit(editId); }
  }catch(e){ /* ignore */ }
});
