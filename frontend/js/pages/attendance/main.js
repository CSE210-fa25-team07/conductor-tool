import { loadTemplate } from "../../utils/templateLoader.js";

const meetings = {};
let currentDate = new Date();

export async function render(container, view = 'calendar') {
    try {
        const templateHTML = await loadTemplate('attendance', 'dashboard');
        container.innerHTML = templateHTML;

        const wrapper = container;
        const calendarGrid = wrapper.querySelector('#calendar-grid');
        const currentMonthEl = wrapper.querySelector('#current-month');
        const prevBtn = wrapper.querySelector('#prev-month');
        const nextBtn = wrapper.querySelector('#next-month');
        const todayBtn = wrapper.querySelector('#today-btn');

        const meetingModal = wrapper.querySelector('#meeting-modal');
        const closeModalBtn = wrapper.querySelector('#close-modal');
        const meetingForm = wrapper.querySelector('#meeting-form');

        const meetingContentModalWrapper = wrapper.querySelector('#meeting-content-modal-wrapper');
        const meetingContentModal = wrapper.querySelector('#meeting-content-modal');
        const closeMeetingContentBtn = wrapper.querySelector('#close-meeting-content');

        function renderCalendar() {
            calendarGrid.innerHTML = '';
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            currentMonthEl.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            for (let i = 0; i < firstDay; i++) {
                const empty = document.createElement('div');
                empty.classList.add('calendar-day');
                calendarGrid.appendChild(empty);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const dateDiv = document.createElement('div');
                dateDiv.classList.add('calendar-day');
                const fullDate = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

                const today = new Date();
                if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    dateDiv.classList.add('today');
                }

                const num = document.createElement('div');
                num.classList.add('date-number');
                num.textContent = day;
                dateDiv.appendChild(num);

                if (meetings[fullDate]) {
                    meetings[fullDate].forEach((m, idx) => {
                        const meetDiv = document.createElement('div');
                        meetDiv.classList.add('meeting-tag', `type-${m.type.toLowerCase().replace(/\s+/g,'')}`);
                        meetDiv.textContent = m.title;
                        meetDiv.addEventListener('click', e => {
                            e.stopPropagation();
                            openMeetingContent(fullDate, idx);
                        });
                        dateDiv.appendChild(meetDiv);
                    });
                }

                dateDiv.addEventListener('click', () => {
                    wrapper.querySelector('#meeting-date').value = fullDate;
                    meetingModal.classList.remove('hidden');
                });

                calendarGrid.appendChild(dateDiv);
            }
        }

        function openMeetingContent(date, index) {
            const meeting = meetings[date][index];
            meetingContentModal.innerHTML = `
                <h2>${meeting.title}</h2>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${meeting.time}</p>
                <p><strong>Type:</strong> ${meeting.type}</p>
                <p><strong>Description:</strong> ${meeting.desc}</p>
                <button id='delete-meeting'>Delete Meeting</button>
            `;
            meetingContentModalWrapper.classList.remove('hidden');

            meetingContentModal.querySelector('#delete-meeting').onclick = () => {
                meetings[date].splice(index,1);
                if (meetings[date].length===0) delete meetings[date];
                meetingContentModalWrapper.classList.add('hidden');
                renderCalendar();
            };
        }

        meetingForm.addEventListener('submit', e=>{
            e.preventDefault();
            const title = wrapper.querySelector('#meeting-title').value;
            const date = wrapper.querySelector('#meeting-date').value;
            const time = wrapper.querySelector('#meeting-time').value;
            const type = wrapper.querySelector('#meeting-type').value;
            const desc = wrapper.querySelector('#meeting-description').value;
            const recurring = wrapper.querySelector('#recurring').checked;

            if (!meetings[date]) meetings[date] = [];
            meetings[date].push({title,time,type,desc});

            if (recurring) {
                let start = new Date(date);
                for (let i=1;i<=8;i++){
                    let next = new Date(start);
                    next.setDate(start.getDate() + 7*i);
                    const nextDateStr = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
                    if (!meetings[nextDateStr]) meetings[nextDateStr] = [];
                    meetings[nextDateStr].push({title,time,type,desc});
                }
            }

            meetingModal.classList.add('hidden');
            meetingForm.reset();
            renderCalendar();
        });

        closeModalBtn.onclick = ()=>meetingModal.classList.add('hidden');
        closeMeetingContentBtn.onclick = ()=>meetingContentModalWrapper.classList.add('hidden');

        prevBtn.onclick = ()=>{ currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); };
        nextBtn.onclick = ()=>{ currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); };
        todayBtn.onclick = ()=>{ currentDate = new Date(); renderCalendar(); };

        renderCalendar();
    } catch (error) {
        container.innerHTML = `<div class='error'>Failed to load calendar: ${error.message}</div>`;
    }
}
