/**
 * @module attendance/dto
 */

function toStudentAnalyticsDto(analytics) {
  return {
    userUuid: analytics.userUuid,
    courseUuid: analytics.courseUuid,
    attendanceByType: (analytics.attendanceByType || analytics.byMeetingType || []).map(t => ({
      meetingType: t.meetingType,
      totalMeetings: t.totalMeetings,
      attended: t.attended,
      percentage: Math.round(t.percentage * 100) / 100 // Round to 2 decimals
    }))
  };
}

function toInstructorAnalyticsDto(analytics) {
  return {
    courseUuid: analytics.courseUuid,
    timeline: (analytics.timeline || analytics.meetings || []).map(m => ({
      date: m.meetingDate || m.date,
      meetingType: m.meetingType,
      meetingTitle: m.meetingTitle,
      totalParticipants: m.totalParticipants,
      attended: m.attended,
      attendancePercentage: Math.round((m.attendancePercentage ?? m.percentage ?? 0) * 100) / 100
    }))
  };
}

function toGroupAnalyticsDto(analytics) {
  return {
    groupName: analytics.groupName,
    teamRate: analytics.teamRate,
    memberCount: analytics.memberCount,
    meetingCount: analytics.meetingCount,
    avgResponseTime: analytics.avgResponseTime,
    trendData: analytics.trendData,
    members: analytics.members
  };
}

export { toStudentAnalyticsDto, toInstructorAnalyticsDto, toGroupAnalyticsDto };
