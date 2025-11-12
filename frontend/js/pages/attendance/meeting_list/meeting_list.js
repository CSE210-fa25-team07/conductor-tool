// meeting_list.js — renders upcoming meetings and links to the existing meeting editor
import { createEmbedModal } from '../embedModal/embedModal.js';
const LS_KEY = 'ct_meetings_v1';

function $(id){return document.getElementById(id)}

function loadMeetings(){
  const raw = localStorage.getItem(LS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function formatDate(m){ return m.date + ' ' + m.time; }

function todayISO(){ return new Date().toISOString().slice(0,10); }

function render(){
  const meetings = loadMeetings();
  const upEl = $('upcomingMeetings');
  const allEl = $('allMeetings');
  const today = todayISO();

  const upcoming = meetings.filter(m => m.date >= today).sort((a,b)=> a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const past = meetings.filter(m => m.date < today).sort((a,b)=> b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  const TYPE_LABELS = { lecture: 'Lecture', office: 'Office Hours', ta: 'TA Check-In', group: 'Discussion/Team Meeting' };
  upEl.innerHTML = upcoming.map(m => `
    <li data-id="${m.id}">
      <strong>${m.title}</strong>
      <div class="meta">${formatDate(m)} — ${TYPE_LABELS[m.type] || m.type}</div>
      <div class="desc">${(m.description || '').slice(0,80)}</div>
      <div class="m-actions">
        <button data-id="${m.id}" class="open">Open</button>
        <button data-id="${m.id}" class="edit">Edit</button>
        <button data-id="${m.id}" class="delete">Delete</button>
      </div>
    </li>`).join('') || '<li class="muted">No upcoming meetings</li>';

  allEl.innerHTML = [...upcoming, ...past].map(m => `
    <li data-id="${m.id}">
      <strong>${m.title}</strong>
      <div class="meta">${formatDate(m)} — ${TYPE_LABELS[m.type] || m.type}</div>
      <div class="desc">${(m.description || '').slice(0,80)}</div>
      <div class="m-actions">
        <button data-id="${m.id}" class="open">Open</button>
        <button data-id="${m.id}" class="edit">Edit</button>
        <button data-id="${m.id}" class="delete">Delete</button>
      </div>
    </li>`).join('') || '<li class="muted">No meetings</li>';
}

function deleteMeeting(id){
  if(!confirm('Delete meeting?')) return;
  let meetings = loadMeetings();
  meetings = meetings.filter(m=>m.id!==id);
  localStorage.setItem(LS_KEY, JSON.stringify(meetings));
  render();
}


document.addEventListener('DOMContentLoaded', ()=>{
  render();
  document.addEventListener('click', e=>{
    if(e.target.matches('.open')){
      const id = e.target.dataset.id;
      openEmbedEditorView(id);
    }
    if(e.target.matches('.edit')){
      const id = e.target.dataset.id;
      openEmbedEditorEdit(id);
    }
    if(e.target.matches('.delete')){
      deleteMeeting(e.target.dataset.id);
    }
  });
});

function openEmbedEditorView(meetingId){
  const url = new URL(window.location.origin + '/frontend/html/pages/attendance/meeting/meeting.html');
  url.searchParams.set('view', meetingId);
  if(!window._ct_embed_modal) window._ct_embed_modal = createEmbedModal({ id: 'embed-modal' });
  window._ct_embed_modal.titleEl.textContent = `About the meeting`;
  window._ct_embed_modal.show(url.toString());
}

function openEmbedEditorEdit(meetingId){
  const url = new URL(window.location.origin + '/frontend/html/pages/attendance/meeting/meeting.html');
  url.searchParams.set('edit', meetingId);
  if(!window._ct_embed_modal) window._ct_embed_modal = createEmbedModal({ id: 'embed-modal' });
  window._ct_embed_modal.titleEl.textContent = `Edit meeting`;
  window._ct_embed_modal.show(url.toString());
}

// listen for embedded save message to refresh list and close modal
window.addEventListener('message', (ev)=>{
  if(!ev.data) return;
  if(ev.data.type === 'meetingSaved'){
    if(window._ct_embed_modal) window._ct_embed_modal.hide();
    render();
  }
});

// close-embed handler is attached on DOMContentLoaded above
