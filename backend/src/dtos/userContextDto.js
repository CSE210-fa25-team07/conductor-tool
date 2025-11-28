/**
 * @module userContext/dto
 */

function toUserDto(user, sessionName) {
  return {
    userUuid: user.userUuid,
    name: sessionName || `${user.firstName} ${user.lastName}`,
    email: user.email,
    isStaff: !!user.staff,
    isSystemAdmin: user.staff?.isSystemAdmin || false,
    isLeadAdmin: user.staff?.isLeadAdmin || false
  };
}

function toCourseDto(enrollment) {
  return {
    courseUuid: enrollment.course.courseUuid,
    courseCode: enrollment.course.courseCode,
    courseName: enrollment.course.courseName,
    role: enrollment.role.role,
    enrollmentStatus: enrollment.enrollmentStatus
  };
}

function toEnrolledCourseDto(enrollment) {
  return {
    courseUuid: enrollment.course.courseUuid,
    courseCode: enrollment.course.courseCode,
    courseName: enrollment.course.courseName,
    role: enrollment.role.role
  };
}

function toTeamDto(teamMembership) {
  return {
    teamUuid: teamMembership.team.teamUuid,
    teamName: teamMembership.team.teamName,
    courseUuid: teamMembership.team.courseUuid,
    role: "member"
  };
}

function toUserContextDto(user, enrollments, teamMemberships, sessionName, activeCourseId) {
  const activeCourse = activeCourseId
    ? enrollments.find(e => e.courseUuid === activeCourseId)
    : enrollments[0];

  return {
    user: toUserDto(user, sessionName),
    activeCourse: activeCourse ? toCourseDto(activeCourse) : null,
    enrolledCourses: enrollments.map(toEnrolledCourseDto),
    teams: teamMemberships.map(toTeamDto)
  };
}

export {
  toUserDto,
  toCourseDto,
  toEnrolledCourseDto,
  toTeamDto,
  toUserContextDto
};
