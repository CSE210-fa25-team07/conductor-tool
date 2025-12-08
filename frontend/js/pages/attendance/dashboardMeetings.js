/**
 * @fileoverview Meeting loading, modals, QR, and form handling for the attendance dashboard.
 * @module attendance/dashboardMeetings
 */

import {
  createMeeting,
  deleteMeeting,
  getMeetingList,
  getMeetingCode,
  recordAttendanceByCode,
  getCourseDetails,
  getMeetingParticipants
} from "../../api/attendanceApi.js";
import { getCurrentUser, getUserRoleInCourse } from "../../utils/userContext.js";
import {
  formatDate,
  getCourseIdFromUrl,
  isStaffRole,
  isValidMeetingLocation,
  mapMeetingTypeToInt,
  mapMeetingTypeToString,
  parseMeetingDate
} from "./utils.js";
import {
  populateMeetingParticipantsDisplay,
  loadAllUsersAndTeams
} from "./dashboardParticipants.js";

// Helpers to avoid repetition
const getParticipantUuid = (p) =>
  p?.user?.userUuid
  || p?.participantUuid
  || p?.participantUUID
  || (p?.user ? p.user.id : null)
  || (typeof p === "string" ? p : null);

export function setupMeetingTypeOptions(ctx) {
  const courseUUID = getCourseIdFromUrl();
  if (!courseUUID || !ctx.els.meetingTypeSelect) return;

  const role = getUserRoleInCourse(courseUUID);
  ctx.els.meetingTypeSelect.innerHTML = "";

  let options;
  let defaultType;

  if (role === "Professor") {
    options = ["Lecture", "OH", "TA Check-In", "Team Meeting"];
    defaultType = "Lecture";
  } else if (role === "TA") {
    options = ["OH", "TA Check-In", "Team Meeting"];
    defaultType = "OH";
  } else {
    options = ["Team Meeting"];
    defaultType = "Team Meeting";
  }

  options.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    ctx.els.meetingTypeSelect.appendChild(option);
  });

  ctx.els.meetingTypeSelect.value = defaultType;
}

export async function loadMeetingsFromBackend(ctx) {
  const courseUUID = getCourseIdFromUrl();
  if (!courseUUID) return;

  try {
    const meetingList = await getMeetingList(courseUUID);
    Object.keys(ctx.state.allMeetings).forEach(key => delete ctx.state.allMeetings[key]);

    const currentUser = getCurrentUser();
    const userUuid = currentUser?.userUuid;

    meetingList.forEach(meeting => {
      const meetingDateObj = parseMeetingDate(meeting.meetingDate);
      if (!meetingDateObj || isNaN(meetingDateObj.getTime())) return;

      const dateStr = formatDate(meetingDateObj);
      if (!ctx.state.allMeetings[dateStr]) ctx.state.allMeetings[dateStr] = [];

      const startTime = meeting.meetingStartTime instanceof Date
        ? meeting.meetingStartTime
        : new Date(meeting.meetingStartTime);
      if (isNaN(startTime.getTime())) return;

      const timeStr = `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`;

      const creatorUUID = meeting.creatorUUID || meeting.creatorUuid || null;
      const isCreator = userUuid && creatorUUID === userUuid;
      const participantList = meeting.participants || [];
      const isParticipant = userUuid && participantList.some(p => getParticipantUuid(p) === userUuid);

      ctx.state.allMeetings[dateStr].push({
        title: meeting.meetingTitle,
        time: timeStr,
        type: mapMeetingTypeToString(meeting.meetingType),
        desc: meeting.meetingDescription || "",
        location: meeting.meetingLocation || meeting.meeting_location || meeting.location || "",
        participants: participantList,
        chainId: meeting.parentMeetingUUID || meeting.parentMeetingUuid || null,
        meetingUUID: meeting.meetingUUID || meeting.meetingUuid,
        isRecurring: meeting.isRecurring,
        creatorUUID: creatorUUID,
        meetingStartTime: meeting.meetingStartTime,
        meetingEndTime: meeting.meetingEndTime,
        isCreator: isCreator,
        isParticipant: isParticipant
      });
    });
  } catch {
    // swallow errors to allow UI to continue
  }
}

export function filterAndRenderMeetings(ctx, renderCalendarFn) {
  const courseUUID = getCourseIdFromUrl();
  const role = getUserRoleInCourse(courseUUID);
  const isStaff = isStaffRole(role);

  Object.keys(ctx.state.meetings).forEach(key => delete ctx.state.meetings[key]);

  if (isStaff && !ctx.state.showAllMeetings) {
    Object.keys(ctx.state.allMeetings).forEach(dateStr => {
      const filtered = ctx.state.allMeetings[dateStr].filter(m => m.isCreator);
      if (filtered.length > 0) ctx.state.meetings[dateStr] = filtered;
    });
  } else {
    Object.keys(ctx.state.allMeetings).forEach(dateStr => {
      ctx.state.meetings[dateStr] = [...ctx.state.allMeetings[dateStr]];
    });
  }

  Object.keys(ctx.state.meetings).forEach(dateKey => {
    ctx.state.meetings[dateKey].sort((a, b) => {
      const timeA = a.meetingStartTime instanceof Date ? a.meetingStartTime : new Date(a.meetingStartTime);
      const timeB = b.meetingStartTime instanceof Date ? b.meetingStartTime : new Date(b.meetingStartTime);
      return timeA - timeB;
    });
  });

  renderCalendarFn();
}

export async function loadCourseDates(ctx, updateNavigationButtons) {
  const courseUUID = getCourseIdFromUrl();
  if (!courseUUID) return;

  try {
    const course = await getCourseDetails(courseUUID);
    if (course?.term) {
      ctx.state.courseStartDate = course.term.startDate ? new Date(course.term.startDate) : null;
      ctx.state.courseEndDate = course.term.endDate ? new Date(course.term.endDate) : null;

      if (ctx.state.courseStartDate) ctx.state.courseStartDate.setHours(0, 0, 0, 0);
      if (ctx.state.courseEndDate) ctx.state.courseEndDate.setHours(23, 59, 59, 999);

      if (ctx.state.courseStartDate && ctx.state.currentDate < ctx.state.courseStartDate) ctx.state.currentDate = new Date(ctx.state.courseStartDate);
      if (ctx.state.courseEndDate && ctx.state.currentDate > ctx.state.courseEndDate) ctx.state.currentDate = new Date(ctx.state.courseEndDate);

      updateNavigationButtons(ctx);
    }
  } catch {
    // ignore
  }
}

export async function openMeetingAttendance(ctx, date, index) {
  const meeting = ctx.state.meetings[date][index];
  const currentUser = getCurrentUser();
  const creatorUUID = meeting.creatorUUID || meeting.creatorUuid;
  const isCreator = currentUser && creatorUUID && creatorUUID === currentUser.userUuid;
  const courseUUID = getCourseIdFromUrl();
  const role = getUserRoleInCourse(courseUUID);
  const isStaff = isStaffRole(role);

  ctx.container.querySelector("#attendance-meeting-title").textContent = meeting.title;
  ctx.container.querySelector("#attendance-meeting-date").textContent = date;
  ctx.container.querySelector("#attendance-meeting-time").textContent = meeting.time;
  ctx.container.querySelector("#attendance-meeting-type").textContent = meeting.type;

  const locationLabel = ctx.container.querySelector("#attendance-meeting-location-label");
  const locationValue = ctx.container.querySelector("#attendance-meeting-location");
  const locText = meeting.location?.trim() || "";
  if (locText) {
    if (locationValue) locationValue.textContent = locText;
    if (locationLabel) locationLabel.style.display = "block";
  } else {
    if (locationValue) locationValue.textContent = "";
    if (locationLabel) locationLabel.style.display = "none";
  }

  const descContainer = ctx.container.querySelector("#attendance-meeting-desc");
  const descLabel = ctx.container.querySelector("#attendance-meeting-desc-label");
  const descText = meeting.desc?.trim() || "";

  if (descText) {
    descContainer.textContent = descText;
    descContainer.style.display = "block";
    descLabel.style.display = "block";
  } else {
    descContainer.textContent = "";
    descContainer.style.display = "none";
    descLabel.style.display = "none";
  }

  const participantsContainer = ctx.container.querySelector("#attendance-meeting-participants");
  participantsContainer.innerHTML = "<p style='padding: 10px; color: #666; text-align: center;'>Loading participants...</p>";

  if (ctx.state.allUsers.length === 0 || ctx.state.allTeams.length === 0) {
    await loadAllUsersAndTeams(ctx);
  }

  if (meeting.meetingUUID) {
    try {
      const participants = await getMeetingParticipants(meeting.meetingUUID, courseUUID);

      const participantUsers = participants
        .map(p => {
          const userUuid = getParticipantUuid(p);
          if (!userUuid) return null;
          return ctx.state.allUsers.find(u => u.userUuid === userUuid) || null;
        })
        .filter(Boolean);

      if (participantUsers.length === 0) {
        participantsContainer.innerHTML = "<p style='padding: 10px; color: #666; text-align: center;'>No participants</p>";
      } else {
        populateMeetingParticipantsDisplay(ctx, participantsContainer, participantUsers);
      }
    } catch (error) {
      participantsContainer.innerHTML = `<p style='padding: 10px; color: #d32f2f; text-align: center;'>Unable to load participants: ${error.message}</p>`;
    }
  } else {
    participantsContainer.innerHTML = "<p style='padding: 10px; color: #666; text-align: center;'>No participants</p>";
  }

  ctx.state.activeMeetingContext = {
    date,
    index,
    chainId: meeting.chainId
      || meeting.parentMeetingUUID
      || meeting.parentMeetingUuid
      || (meeting.isRecurring ? meeting.meetingUUID : null),
    meetingUUID: meeting.meetingUUID || null,
    creatorUUID: meeting.creatorUUID || null,
    isRecurring: meeting.isRecurring || false,
    parentMeetingUUID: meeting.chainId || null,
    meetingStartTime: meeting.meetingStartTime || null,
    meetingEndTime: meeting.meetingEndTime || null
  };

  if (ctx.els.deleteAllFutureBtn) {
    const isPartOfRecurringChain = meeting.isRecurring
      || meeting.parentMeetingUUID
      || meeting.parentMeetingUuid
      || meeting.chainId;
    ctx.els.deleteAllFutureBtn.disabled = !isPartOfRecurringChain;
  }

  const showDelete = (isCreator || isStaff) ? "block" : "none";
  if (ctx.els.deleteMeetingBtn) ctx.els.deleteMeetingBtn.style.display = showDelete;
  if (ctx.els.deleteAllFutureBtn) ctx.els.deleteAllFutureBtn.style.display = showDelete;

  if (isCreator) {
    if (ctx.els.creatorView) ctx.els.creatorView.classList.remove("hidden");
    if (ctx.els.participantView) ctx.els.participantView.classList.add("hidden");
    ctx.state.currentMeetingCode = null;
    await loadMeetingCode(ctx, meeting.meetingUUID);
  } else {
    if (ctx.els.creatorView) ctx.els.creatorView.classList.add("hidden");
    if (ctx.els.participantView) ctx.els.participantView.classList.remove("hidden");
    if (ctx.els.attendancePasscodeInput) ctx.els.attendancePasscodeInput.value = "";
    ctx.state.currentMeetingCode = null;
  }

  ctx.els.meetingContentModalWrapper.classList.remove("hidden");
}

export async function loadMeetingCode(ctx, meetingUUID) {
  if (!meetingUUID) return;

  try {
    const codeData = await getMeetingCode(meetingUUID);
    const qrUrl = codeData.qrUrl || codeData.qr_code_url || codeData.qrCodeUrl;
    const meetingCode = codeData.meetingCode || codeData.meeting_code || codeData.code;

    if (ctx.els.qrCodeImage) {
      if (qrUrl) {
        ctx.els.qrCodeImage.src = qrUrl;
        ctx.els.qrCodeImage.alt = "Meeting QR Code";
        ctx.els.qrCodeImage.style.display = "block";
      } else {
        ctx.els.qrCodeImage.src = "";
        ctx.els.qrCodeImage.alt = "QR code not available";
        ctx.els.qrCodeImage.style.display = "none";
      }
    }

    if (ctx.els.meetingCodeDisplay) {
      ctx.els.meetingCodeDisplay.textContent = meetingCode || "No code generated yet";
    }
    ctx.state.currentMeetingCode = meetingCode || null;
  } catch (error) {
    if (error.message?.includes("404") || error.message?.includes("not found")) {
      try {
        const createResponse = await fetch(`/v1/api/attendance/meeting_code/${meetingUUID}`, {
          method: "POST",
          credentials: "include"
        });

        if (createResponse.ok) {
          const newCodeData = await createResponse.json();
          const createdCode = newCodeData.data || newCodeData;

          if (ctx.els.qrCodeImage && createdCode.qrUrl) {
            ctx.els.qrCodeImage.src = createdCode.qrUrl;
            ctx.els.qrCodeImage.alt = "Meeting QR Code";
            ctx.els.qrCodeImage.style.display = "block";
          }
          if (ctx.els.meetingCodeDisplay && createdCode.meetingCode) {
            ctx.els.meetingCodeDisplay.textContent = createdCode.meetingCode;
          }
          ctx.state.currentMeetingCode = createdCode.meetingCode || null;
          return;
        }
      } catch {
        // ignore
      }
    }

    if (ctx.els.meetingCodeDisplay) ctx.els.meetingCodeDisplay.textContent = "No code generated yet";
    if (ctx.els.qrCodeImage) {
      ctx.els.qrCodeImage.src = "";
      ctx.els.qrCodeImage.alt = "QR code not available";
      ctx.els.qrCodeImage.style.display = "none";
    }
    ctx.state.currentMeetingCode = null;
  }
}

export function copyMeetingCode(ctx) {
  if (!ctx.els.meetingCodeDisplay) return;

  const code = (ctx.els.meetingCodeDisplay.textContent || "").trim();
  if (!code || code === "No code generated yet") {
    alert("No meeting code available to copy yet.");
    return;
  }

  const showCopiedState = () => {
    if (!ctx.els.copyCodeBtn) return;
    const originalText = ctx.els.copyCodeBtn.textContent;
    ctx.els.copyCodeBtn.textContent = "Copied!";
    ctx.els.copyCodeBtn.disabled = true;
    setTimeout(() => {
      ctx.els.copyCodeBtn.textContent = originalText;
      ctx.els.copyCodeBtn.disabled = false;
    }, 2000);
  };

  const fallbackCopy = text => {
    const tempInput = document.createElement("textarea");
    tempInput.value = text;
    tempInput.setAttribute("readonly", "");
    tempInput.style.position = "absolute";
    tempInput.style.left = "-9999px";
    document.body.appendChild(tempInput);
    tempInput.select();
    tempInput.setSelectionRange(0, text.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    document.body.removeChild(tempInput);
    return copied;
  };

  (navigator.clipboard?.writeText(code) || Promise.reject(new Error("Clipboard API unavailable")))
    .then(showCopiedState)
    .catch(() => {
      if (fallbackCopy(code)) {
        showCopiedState();
      } else {
        alert("Failed to copy code. Please copy manually: " + code);
      }
    });
}

export async function startCamera(ctx) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
    });

    ctx.state.cameraStream = stream;
    if (ctx.els.qrScannerVideo) ctx.els.qrScannerVideo.srcObject = stream;
    if (ctx.els.startCameraBtn) ctx.els.startCameraBtn.classList.add("hidden");
    if (ctx.els.stopCameraBtn) ctx.els.stopCameraBtn.classList.remove("hidden");
    startQRScanning(ctx);
  } catch {
    alert("Failed to access camera. Please check permissions and try again.");
  }
}

export function stopCamera(ctx) {
  if (ctx.state.cameraStream) {
    ctx.state.cameraStream.getTracks().forEach(track => track.stop());
    ctx.state.cameraStream = null;
  }

  if (ctx.els.qrScannerVideo) ctx.els.qrScannerVideo.srcObject = null;
  if (ctx.state.qrScanningInterval) {
    clearInterval(ctx.state.qrScanningInterval);
    ctx.state.qrScanningInterval = null;
  }

  if (ctx.els.startCameraBtn) ctx.els.startCameraBtn.classList.remove("hidden");
  if (ctx.els.stopCameraBtn) ctx.els.stopCameraBtn.classList.add("hidden");
}

function loadQRCodeLibrary() {
  return new Promise((resolve, reject) => {
    if (typeof jsQR !== "undefined") {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function startQRScanning(ctx) {
  if (!ctx.els.qrScannerVideo || !ctx.els.qrScannerCanvas) return;

  if (typeof jsQR === "undefined") {
    loadQRCodeLibrary().then(() => {
      if (typeof jsQR !== "undefined") startQRScanningWithLibrary(ctx);
    }).catch(() => {
      alert("QR code scanning library could not be loaded. Please use manual code entry.");
    });
    return;
  }

  startQRScanningWithLibrary(ctx);
}

function startQRScanningWithLibrary(ctx) {
  if (!ctx.els.qrScannerVideo || !ctx.els.qrScannerCanvas || typeof jsQR === "undefined") return;

  ctx.state.qrScanningInterval = setInterval(() => {
    if (ctx.els.qrScannerVideo.readyState === ctx.els.qrScannerVideo.HAVE_ENOUGH_DATA) {
      const canvas = ctx.els.qrScannerCanvas;
      const video = ctx.els.qrScannerVideo;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        clearInterval(ctx.state.qrScanningInterval);
        ctx.state.qrScanningInterval = null;

        let extractedCode = code.data;
        const codeMatch = code.data.match(/[?&]code=([A-Z0-9]+)/i);
        if (codeMatch) extractedCode = codeMatch[1].toUpperCase();

        handleQRCodeScan(ctx, extractedCode);
      }
    }
  }, 100);
}

export function validateMeetingTimeWindow(startTime, endTime) {
  if (!startTime || !endTime) {
    return { isValid: false, message: "Meeting time information not available" };
  }

  const now = new Date();
  const start = startTime instanceof Date ? startTime : new Date(startTime);
  const end = endTime instanceof Date ? endTime : new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, message: "Invalid meeting time format" };
  }

  const formatTime = (date) => date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  });

  if (now < start) {
    return { isValid: false, message: `Attendance can only be submitted during the meeting time.\n\nMeeting starts at: ${formatTime(start)}` };
  }

  if (now > end) {
    return { isValid: false, message: `Attendance submission window has closed.\n\nMeeting ended at: ${formatTime(end)}` };
  }

  return { isValid: true, message: "" };
}

export async function submitAttendance(ctx) {
  const code = ctx.els.attendancePasscodeInput?.value.trim().toUpperCase() || "";
  const { meetingUUID, meetingStartTime, meetingEndTime } = ctx.state.activeMeetingContext;

  if (!code) {
    alert("Please enter a code");
    return;
  }

  if (!meetingUUID) {
    alert("Meeting information not available");
    return;
  }

  const timeValidation = validateMeetingTimeWindow(meetingStartTime, meetingEndTime);
  if (!timeValidation.isValid) {
    alert(timeValidation.message);
    return;
  }

  try {
    await recordAttendanceByCode(meetingUUID, code);
    alert("Attendance recorded successfully!");
    ctx.els.meetingContentModalWrapper.classList.add("hidden");
    stopCamera(ctx);
    if (ctx.els.attendancePasscodeInput) ctx.els.attendancePasscodeInput.value = "";
  } catch (error) {
    const isTimeError = error.message?.includes("not valid at this time") || error.message?.includes("time");
    alert(isTimeError
      ? `Cannot submit attendance: ${error.message}\n\nPlease ensure you are submitting during the meeting's scheduled time.`
      : `Failed to submit attendance: ${error.message}`);
  }
}

export async function handleQRCodeScan(ctx, code) {
  if (!code?.trim()) return;

  const { meetingUUID, meetingStartTime, meetingEndTime } = ctx.state.activeMeetingContext;
  if (!meetingUUID) return;

  const timeValidation = validateMeetingTimeWindow(meetingStartTime, meetingEndTime);
  if (!timeValidation.isValid) {
    alert(timeValidation.message);
    return;
  }

  try {
    await recordAttendanceByCode(meetingUUID, code.trim().toUpperCase());
    alert("Attendance recorded successfully from QR code!");
    ctx.els.meetingContentModalWrapper.classList.add("hidden");
    stopCamera(ctx);
  } catch (error) {
    const isTimeError = error.message?.includes("not valid at this time") || error.message?.includes("time");
    alert(isTimeError
      ? `Cannot submit attendance: ${error.message}\n\nPlease ensure you are submitting during the meeting's scheduled time.`
      : `Failed to submit attendance: ${error.message}`);
  }
}

export async function submitCreatorAttendance(ctx) {
  const { meetingUUID, meetingStartTime, meetingEndTime } = ctx.state.activeMeetingContext;

  if (!meetingUUID) {
    alert("Meeting information not available");
    return;
  }

  if (!ctx.state.currentMeetingCode) {
    alert("Meeting code not available. Please wait for the code to load.");
    return;
  }

  const timeValidation = validateMeetingTimeWindow(meetingStartTime, meetingEndTime);
  if (!timeValidation.isValid) {
    alert(timeValidation.message);
    return;
  }

  try {
    await recordAttendanceByCode(meetingUUID, ctx.state.currentMeetingCode);
    alert("Your attendance has been recorded successfully!");
  } catch (error) {
    const isTimeError = error.message?.includes("not valid at this time") || error.message?.includes("time");
    alert(isTimeError
      ? `Cannot submit attendance: ${error.message}\n\nPlease ensure you are submitting during the meeting's scheduled time.`
      : `Failed to submit attendance: ${error.message}`);
  }
}

export function bindModalClose(ctx) {
  ctx.els.closeModalBtn.onclick = () => ctx.els.meetingModal.classList.add("hidden");
  ctx.els.closeMeetingContentBtn.onclick = () => {
    stopCamera(ctx);
    ctx.state.activeMeetingContext = { date: null, index: null, chainId: null, meetingUUID: null, creatorUUID: null };
    if (ctx.els.deleteAllFutureBtn) ctx.els.deleteAllFutureBtn.disabled = true;
    ctx.els.meetingContentModalWrapper.classList.add("hidden");
  };
}

export function bindCopyAndCamera(ctx) {
  if (ctx.els.startCameraBtn) ctx.els.startCameraBtn.onclick = () => startCamera(ctx);
  if (ctx.els.stopCameraBtn) ctx.els.stopCameraBtn.onclick = () => stopCamera(ctx);
  if (ctx.els.submitAttendanceBtn) ctx.els.submitAttendanceBtn.onclick = () => submitAttendance(ctx);
  if (ctx.els.copyCodeBtn) ctx.els.copyCodeBtn.addEventListener("click", () => copyMeetingCode(ctx));
  if (ctx.els.creatorMarkAttendanceBtn) ctx.els.creatorMarkAttendanceBtn.addEventListener("click", () => submitCreatorAttendance(ctx));
}

export function bindMeetingDeletion(ctx, refreshMeetings) {
  ctx.els.deleteMeetingBtn?.addEventListener("click", async () => {
    const { date, index, meetingUUID } = ctx.state.activeMeetingContext;

    if (!date || typeof index !== "number" || !meetingUUID) {
      alert("Meeting information not available.");
      return;
    }

    const meeting = ctx.state.meetings[date]?.[index];
    const isRecurring = meeting?.isRecurring || meeting?.chainId;

    const confirmMessage = isRecurring
      ? "Delete this meeting? (This will only delete this occurrence, not future recurring meetings.)"
      : "Delete this meeting from the calendar?";

    if (!confirm(confirmMessage)) return;

    try {
      await deleteMeeting(meetingUUID, false);
    } catch (error) {
      alert(`Failed to delete meeting: ${error.message}\n\nThe meeting may have already been deleted or you may not have permission.`);
      return;
    }

    await refreshMeetings();
    ctx.state.activeMeetingContext = { date: null, index: null, chainId: null, meetingUUID: null, creatorUUID: null };
    if (ctx.els.deleteAllFutureBtn) ctx.els.deleteAllFutureBtn.disabled = true;
    ctx.els.meetingContentModalWrapper.classList.add("hidden");
  });

  ctx.els.deleteAllFutureBtn?.addEventListener("click", async () => {
    const { date, meetingUUID } = ctx.state.activeMeetingContext;

    if (!date || !meetingUUID) {
      alert("Cannot delete future meetings: Meeting information not available.");
      return;
    }

    const meeting = ctx.state.meetings[date]?.[ctx.state.activeMeetingContext.index];
    const isPartOfRecurringChain = !!(meeting?.isRecurring
      || meeting?.parentMeetingUUID
      || meeting?.parentMeetingUuid
      || meeting?.chainId);
    if (!isPartOfRecurringChain) {
      alert("This meeting is not part of a recurring series.");
      return;
    }

    if (!confirm("Delete this meeting and ALL future recurring meetings in this series?\n\nThis action cannot be undone. All future occurrences will be removed from the calendar.")) return;

    try {
      await deleteMeeting(meetingUUID, true);

      const currentMeeting = ctx.state.meetings[date]?.[ctx.state.activeMeetingContext.index];
      if (currentMeeting) {
        const parentId = currentMeeting.chainId || currentMeeting.meetingUUID;
        const clickedDate = new Date(date);
        Object.keys(ctx.state.allMeetings).forEach(d => {
          const current = new Date(d);
          if (current >= clickedDate) {
            ctx.state.allMeetings[d] = (ctx.state.allMeetings[d] || []).filter(m => {
              const mParent = m.chainId || m.meetingUUID;
              return mParent !== parentId;
            });
            if (ctx.state.allMeetings[d].length === 0) delete ctx.state.allMeetings[d];
          }
        });
      }
    } catch (error) {
      alert(`Failed to delete future meetings: ${error.message}\n\nThe meetings may have already been deleted or you may not have permission.`);
      return;
    }

    await refreshMeetings();
    ctx.state.activeMeetingContext = { date: null, index: null, chainId: null, meetingUUID: null, creatorUUID: null };
    if (ctx.els.deleteAllFutureBtn) ctx.els.deleteAllFutureBtn.disabled = true;
    ctx.els.meetingContentModalWrapper.classList.add("hidden");
  });
}

export function bindFormSubmission(ctx, { refreshMeetings, syncRecurringControlState }) {
  ctx.els.meetingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const courseUUID = getCourseIdFromUrl();
    if (!courseUUID) {
      alert("Course ID not found. Please navigate to a course page.");
      return;
    }

    const title = ctx.els.meetingTitleInput.value.trim();
    const date = ctx.els.meetingDateInput.value;
    const time = ctx.els.meetingTimeInput.value;
    const endTime = ctx.els.meetingEndTimeInput?.value || "";
    const type = ctx.els.meetingTypeSelect.value;
    const desc = ctx.els.meetingDescTextarea.value.trim();
    const location = ctx.els.meetingLocationInput?.value.trim() || "";
    const recurring = ctx.els.recurringCheckbox.checked;

    if (!endTime) {
      alert("Please enter an end time for the meeting.");
      return;
    }

    const meetingStart = new Date(`${date}T${time}`);
    const meetingEnd = new Date(`${date}T${endTime}`);

    if (isNaN(meetingStart.getTime()) || isNaN(meetingEnd.getTime())) {
      alert("Please enter valid start and end times.");
      return;
    }

    if (meetingEnd <= meetingStart) {
      alert("End time must be after start time.");
      return;
    }

    const durationMs = meetingEnd - meetingStart;
    const durationMinutes = durationMs / (1000 * 60);
    const durationHours = durationMinutes / 60;

    if (durationMinutes < 15) {
      alert("Meeting must be at least 15 minutes long.");
      return;
    }

    if (durationHours > 12) {
      alert("Meeting cannot be longer than 12 hours.");
      return;
    }

    if (location && !isValidMeetingLocation(location)) {
      alert("Invalid URL. Use a Zoom or Google Meet link, or plain text location.");
      return;
    }

    const allParticipants = Array.from(ctx.els.participantsContainer.querySelectorAll("input[type=\"checkbox\"]:checked"))
      .map(cb => cb.value);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const participants = [...new Set(allParticipants.filter(p => uuidRegex.test(p)))];

    const [dateYear, dateMonth, dateDay] = date.split("-").map(Number);
    const [timeHours, timeMinutes] = time.split(":").map(Number);
    const meetingDateTime = new Date(dateYear, dateMonth - 1, dateDay, timeHours, timeMinutes, 0, 0);
    const now = new Date();

    if (meetingDateTime < now) {
      alert("You cannot create a meeting in the past.");
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser?.userUuid) {
      alert("User information not available. Please refresh the page.");
      return;
    }

    const meetingTypeInt = parseInt(mapMeetingTypeToInt(type), 10);
    if (!Number.isInteger(meetingTypeInt) || meetingTypeInt < 0 || meetingTypeInt > 3) {
      alert(`Invalid meeting type: ${type}. Please select a valid meeting type.`);
      return;
    }

    const createMeetingData = (dateStr, timeStr, endTimeStr, isRecurringFlag = false, parentMeetingUUIDValue = null) => {
      const meetingStartTime = new Date(`${dateStr}T${timeStr}`);
      const meetingEndTime = new Date(`${dateStr}T${endTimeStr}`);
      const [dy, dm, dd] = dateStr.split("-").map(Number);
      const dateWithNoon = new Date(dy, dm - 1, dd, 12, 0, 0);

      return {
        creatorUUID: currentUser.userUuid,
        courseUUID: courseUUID,
        meetingStartTime: meetingStartTime.toISOString(),
        meetingEndTime: meetingEndTime.toISOString(),
        meetingDate: dateWithNoon.toISOString(),
        meetingTitle: title,
        meetingDescription: desc || null,
        meetingLocation: location || null,
        meetingType: meetingTypeInt,
        isRecurring: isRecurringFlag,
        parentMeetingUUID: parentMeetingUUIDValue || null,
        participants
      };
    };

    if (recurring) {
      if (!ctx.els.recurringEndInput?.value) {
        alert("Please select an end date for recurring meetings.");
        return;
      }

      const [year, month, day] = date.split("-").map(Number);
      const startDate = new Date(year, month - 1, day);

      const [endYear, endMonth, endDay] = ctx.els.recurringEndInput.value.split("-").map(Number);
      const endDate = new Date(endYear, (endMonth || 1) - 1, endDay || 1);

      if (isNaN(endDate.getTime()) || endDate < startDate) {
        alert(endDate < startDate ? "Recurring end date must be on or after the first meeting." : "Please select a valid end date for recurring meetings.");
        return;
      }

      const nextDate = new Date(startDate);
      let previousMeetingUUID = null;

      while (nextDate <= endDate) {
        const nextDateStr = formatDate(nextDate);
        const meetingData = createMeetingData(nextDateStr, time, endTime, true, previousMeetingUUID);

        try {
          const response = await createMeeting(meetingData);
          if (response?.meeting) {
            previousMeetingUUID = response.meeting.meetingUUID || response.meeting.meetingUuid;
          }
        } catch (error) {
          if (!error.message.includes("201") && !error.message.includes("Created") && !error.message.includes("Failed to fetch")) {
            alert(`Failed to create meeting on ${nextDateStr}: ${error.message}`);
            return;
          }
        }

        nextDate.setDate(nextDate.getDate() + 7);
      }
    } else {
      try {
        await createMeeting(createMeetingData(date, time, endTime, false, null));
      } catch (error) {
        if (!error.message.includes("201") && !error.message.includes("Created") && !error.message.includes("Failed to fetch")) {
          alert(`Failed to create meeting: ${error.message}`);
          return;
        }
      }
    }

    await refreshMeetings();
    ctx.els.meetingModal.classList.add("hidden");
    ctx.els.meetingForm.reset();
    if (ctx.els.recurringEndInput) ctx.els.recurringEndInput.value = "";
    syncRecurringControlState(ctx);
  });
}

