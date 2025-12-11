/**
 * @fileoverview Dashboard state and DOM helpers for attendance dashboard.
 * @module attendance/dashboardState
 */

export function createState() {
  return {
    currentDate: new Date(),
    courseStartDate: null,
    courseEndDate: null,
    selectedCalendarDate: "",
    allUsers: [],
    allTeams: [],
    allMeetings: {},
    meetings: {},
    showAllMeetings: true,
    activeMeetingContext: {
      date: null,
      index: null,
      chainId: null,
      meetingUUID: null,
      creatorUUID: null,
      isRecurring: false,
      parentMeetingUUID: null,
      meetingStartTime: null,
      meetingEndTime: null
    },
    cameraStream: null,
    qrScanningInterval: null,
    currentMeetingCode: null
  };
}

export function getDomRefs(container) {
  return {
    calendarGrid: container.querySelector("#calendar-grid"),
    currentMonthEl: container.querySelector("#current-month"),
    prevBtn: container.querySelector("#prev-month"),
    nextBtn: container.querySelector("#next-month"),
    todayBtn: container.querySelector("#today-btn"),
    meetingModal: container.querySelector("#meeting-modal"),
    closeModalBtn: container.querySelector("#close-modal"),
    meetingForm: container.querySelector("#meeting-form"),
    meetingContentModalWrapper: container.querySelector("#meeting-content-modal-wrapper"),
    closeMeetingContentBtn: container.querySelector("#close-meeting-content"),
    meetingTitleInput: container.querySelector("#meeting-title"),
    meetingDateInput: container.querySelector("#meeting-date"),
    meetingTimeInput: container.querySelector("#meeting-time"),
    meetingEndTimeInput: container.querySelector("#meeting-end-time"),
    meetingTypeSelect: container.querySelector("#meeting-type"),
    meetingDescTextarea: container.querySelector("#meeting-description"),
    meetingLocationInput: container.querySelector("#meeting-location"),
    participantsContainer: container.querySelector("#meeting-participants"),
    selectAllBtn: container.querySelector("#select-all-participants"),
    deselectAllBtn: container.querySelector("#deselect-all-participants"),
    selectByTeamDropdown: container.querySelector("#select-by-team"),
    recurringCheckbox: container.querySelector("#recurring"),
    recurringEndInput: container.querySelector("#recurring-end-date"),
    recurringSummaryEl: container.querySelector("#recurring-summary"),
    deleteMeetingBtn: container.querySelector("#delete-meeting"),
    deleteAllFutureBtn: container.querySelector("#delete-future-meetings"),
    creatorView: container.querySelector("#creator-attendance-view"),
    participantView: container.querySelector("#participant-attendance-view"),
    qrCodeImage: container.querySelector("#meeting-qr-code"),
    meetingCodeDisplay: container.querySelector("#meeting-code-display"),
    copyCodeBtn: container.querySelector("#copy-code-btn"),
    qrScannerVideo: container.querySelector("#qr-scanner-video"),
    qrScannerCanvas: container.querySelector("#qr-scanner-canvas"),
    startCameraBtn: container.querySelector("#start-camera-btn"),
    stopCameraBtn: container.querySelector("#stop-camera-btn"),
    submitAttendanceBtn: container.querySelector("#submit-attendance"),
    attendancePasscodeInput: container.querySelector("#attendance-passcode"),
    professorToggleContainer: container.querySelector("#professor-meetings-toggle-container"),
    showAllMeetingsToggle: container.querySelector("#show-all-meetings-toggle"),
    creatorMarkAttendanceBtn: container.querySelector("#creator-mark-attendance-btn")
  };
}

