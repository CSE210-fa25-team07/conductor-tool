/**
 * @module standup/dto
 */

function toUserDto(user, sessionName) {
  return {
    userUuid: user.userUuid,
    name: sessionName || `${user.firstName} ${user.lastName}`,
    email: user.email,
    isStaff: !!user.staff,
    isSystemAdmin: user.staff?.isSystemAdmin || false
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

function toStandupDto(standup) {
  return {
    standupUuid: standup.standupUuid,
    userUuid: standup.userUuid,
    teamUuid: standup.teamUuid,
    courseUuid: standup.courseUuid,
    dateSubmitted: standup.dateSubmitted,
    whatDone: standup.whatDone,
    whatNext: standup.whatNext,
    blockers: standup.blockers,
    reflection: standup.reflection,
    sentimentScore: standup.sentimentScore,
    visibility: standup.visibility,
    createdAt: standup.createdAt,
    updatedAt: standup.updatedAt,
    user: standup.user ? {
      userUuid: standup.user.userUuid,
      firstName: standup.user.firstName,
      lastName: standup.user.lastName,
      email: standup.user.email
    } : undefined,
    team: standup.team ? {
      teamUuid: standup.team.teamUuid,
      teamName: standup.team.teamName
    } : undefined,
    course: standup.course ? {
      courseUuid: standup.course.courseUuid,
      courseCode: standup.course.courseCode,
      courseName: standup.course.courseName
    } : undefined
  };
}

function toStandupListDto(standups) {
  return standups.map(toStandupDto);
}

function toCourseOverviewDto(overview) {
  return {
    course: {
      courseUuid: overview.course.courseUuid,
      courseCode: overview.course.courseCode,
      courseName: overview.course.courseName
    },
    teams: overview.teams.map(team => ({
      teamUuid: team.teamUuid,
      teamName: team.teamName,
      memberCount: team.memberCount,
      latestStandup: team.latestStandup ? {
        standupUuid: team.latestStandup.standupUuid,
        dateSubmitted: team.latestStandup.dateSubmitted,
        whatDone: team.latestStandup.whatDone,
        whatNext: team.latestStandup.whatNext,
        blockers: team.latestStandup.blockers,
        user: team.latestStandup.user ? {
          userUuid: team.latestStandup.user.userUuid,
          firstName: team.latestStandup.user.firstName,
          lastName: team.latestStandup.user.lastName
        } : undefined
      } : null
    }))
  };
}

export {
  toUserDto,
  toCourseDto,
  toEnrolledCourseDto,
  toTeamDto,
  toUserContextDto,
  toStandupDto,
  toStandupListDto,
  toCourseOverviewDto
};
