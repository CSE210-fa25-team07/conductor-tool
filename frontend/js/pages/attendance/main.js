import { loadTemplate } from "../../utils/templateLoader.js";

const meetings = {};
let currentDate = new Date();

export async function render(container, view = 'dashboard') {
    try {
        const templateHTML = await loadTemplate('attendance', view);
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

        const participantsContainer = wrapper.querySelector('#meeting-participants');

        function renderCalendar() {
            calendarGrid.innerHTML = '';

            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const headersDiv = document.createElement('div');
            headersDiv.classList.add('calendar-days');
            daysOfWeek.forEach(day => {
                const dayDiv = document.createElement('div');
                dayDiv.textContent = day;
                headersDiv.appendChild(dayDiv);
            });
            calendarGrid.appendChild(headersDiv);

            const datesContainer = document.createElement('div');
            datesContainer.classList.add('calendar-dates');

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            currentMonthEl.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            for (let i = 0; i < firstDay; i++) {
                const empty = document.createElement('div');
                empty.classList.add('calendar-day');
                datesContainer.appendChild(empty);
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

            for (let day = 1; day <= daysInMonth; day++) {
                const dateDiv = document.createElement('div');
                dateDiv.classList.add('calendar-day');

                const fullDate = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const currentDateObj = new Date(year, month, day);

                // Check if this date is in the past
                const isPastDate = currentDateObj < today;

                if (isPastDate) {
                    dateDiv.classList.add('past-date');
                }

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
                            openMeetingAttendance(fullDate, idx);
                        });
                        dateDiv.appendChild(meetDiv);
                    });
                }

                // Only allow clicking on future dates or today
                if (!isPastDate) {
                    dateDiv.addEventListener('click', () => {
                        const meetingDateInput = wrapper.querySelector('#meeting-date');
                        const meetingTitleInput = wrapper.querySelector('#meeting-title');
                        const meetingTimeInput = wrapper.querySelector('#meeting-time');
                        const meetingTypeSelect = wrapper.querySelector('#meeting-type');
                        const meetingDescTextarea = wrapper.querySelector('#meeting-description');
                        const recurringCheckbox = wrapper.querySelector('#recurring');

                        // Reset all fields
                        meetingTitleInput.value = '';
                        meetingDateInput.value = fullDate;
                        meetingTimeInput.value = '';
                        meetingTypeSelect.value = 'Lecture';
                        meetingDescTextarea.value = '';
                        recurringCheckbox.checked = false;
                        participantsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

                        meetingModal.classList.remove('hidden');
                    });
                }

                datesContainer.appendChild(dateDiv);
            }

            calendarGrid.appendChild(datesContainer);
        }

        function openMeetingAttendance(date, index) {
            const meeting = meetings[date][index];

            wrapper.querySelector('#attendance-meeting-title').textContent = meeting.title;
            wrapper.querySelector('#attendance-meeting-date').textContent = date;
            wrapper.querySelector('#attendance-meeting-time').textContent = meeting.time;
            wrapper.querySelector('#attendance-meeting-type').textContent = meeting.type;
            wrapper.querySelector('#attendance-meeting-desc').textContent = meeting.desc;
            wrapper.querySelector('#attendance-meeting-participants').textContent = meeting.participants.join(', ');

            wrapper.querySelector('#attendance-passcode').value = '';
            meetingContentModalWrapper.classList.remove('hidden');
        }

        wrapper.querySelector('#submit-attendance').onclick = () => {
            const code = wrapper.querySelector('#attendance-passcode').value;
            alert(`Attendance submitted with passcode: ${code}\n(Backend integration needed)`);
            meetingContentModalWrapper.classList.add('hidden');
        };

        meetingForm.addEventListener('submit', e => {
            e.preventDefault();

            const title = wrapper.querySelector('#meeting-title').value;
            const date = wrapper.querySelector('#meeting-date').value;
            const time = wrapper.querySelector('#meeting-time').value;
            const type = wrapper.querySelector('#meeting-type').value;
            const desc = wrapper.querySelector('#meeting-description').value;
            const recurring = wrapper.querySelector('#recurring').checked;

            const participants = Array.from(participantsContainer.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);

            const meetingDateTime = new Date(`${date}T${time}`);
            const now = new Date();

            if (meetingDateTime < now) {
                alert("You cannot create a meeting in the past.");
                return;
            }

            if (!meetings[date]) meetings[date] = [];
            meetings[date].push({title, time, type, desc, participants});

            if (recurring) {
                let start = new Date(date);
                for (let i = 1; i <= 8; i++) {
                    let next = new Date(start);
                    next.setDate(start.getDate() + 7 * i);
                    const nextDateStr = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
                    if (!meetings[nextDateStr]) meetings[nextDateStr] = [];
                    meetings[nextDateStr].push({title, time, type, desc, participants});
                }
            }

            meetingModal.classList.add('hidden');
            meetingForm.reset();
            renderCalendar();
        });

        closeModalBtn.onclick = () => meetingModal.classList.add('hidden');
        closeMeetingContentBtn.onclick = () => meetingContentModalWrapper.classList.add('hidden');

        prevBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); };
        nextBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); };
        todayBtn.onclick = () => { currentDate = new Date(); renderCalendar(); };

        renderCalendar();

    } catch (error) {
        container.innerHTML = `<div class='error'>Failed to load calendar: ${error.message}</div>`;
    }
}