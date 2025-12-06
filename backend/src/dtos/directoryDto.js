/**
 * @module directory/dto
 */

function toCourseOverviewDto(course) {
  if (!course) return null;

  return {
    courseUuid: course.courseUuid,
    courseCode: course.courseCode,
    courseName: course.courseName,
    description: course.description,
    syllabusUrl: course.syllabusUrl,
    canvasUrl: course.canvasUrl,
    term: course.term ? {
      year: course.term.year,
      season: course.term.season,
      startDate: course.term.startDate,
      endDate: course.term.endDate,
      isActive: course.term.isActive
    } : undefined,
    stats: {
      totalEnrollments: course._count?.enrollments || 0,
      totalTeams: course._count?.teams || 0
    }
  };
}

function toStaffDto(enrollment) {
  if (!enrollment) return null;

  return {
    userUuid: enrollment.user.userUuid,
    firstName: enrollment.user.firstName,
    lastName: enrollment.user.lastName,
    email: enrollment.user.email,
    photoUrl: enrollment.user.photoUrl,
    role: enrollment.role.role,
    staff: enrollment.user.staff ? {
      officeLocation: enrollment.user.staff.officeLocation,
      researchInterest: enrollment.user.staff.researchInterest,
      personalWebsite: enrollment.user.staff.personalWebsite,
      isProf: enrollment.user.staff.isProf
    } : undefined
  };
}

function toStaffListDto(enrollments) {
  return enrollments.map(toStaffDto);
}

function toUserProfileDto(user) {
  if (!user) return null;

  return {
    userUuid: user.userUuid,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    photoUrl: user.photoUrl,
    pronouns: user.pronouns,
    bio: user.bio,
    phoneNumber: user.phoneNumber,
    githubUsername: user.githubUsername,
    lastLogin: user.lastLogin,
    staff: user.staff ? {
      officeLocation: user.staff.officeLocation,
      researchInterest: user.staff.researchInterest,
      personalWebsite: user.staff.personalWebsite,
      isProf: user.staff.isProf,
      isSystemAdmin: user.staff.isSystemAdmin
    } : undefined,
    courses: user.courseEnrollments?.map(enrollment => ({
      courseUuid: enrollment.course.courseUuid,
      courseCode: enrollment.course.courseCode,
      courseName: enrollment.course.courseName,
      role: enrollment.role.role
    })) || [],
    teams: user.teamMemberships?.map(membership => ({
      teamUuid: membership.team.teamUuid,
      teamName: membership.team.teamName,
      courseUuid: membership.team.courseUuid,
      courseCode: membership.team.course?.courseCode,
      term: membership.team.course?.term
        ? `${membership.team.course.term.season} ${membership.team.course.term.year}`
        : null,
      joinedAt: membership.joinedAt
    })) || []
  };
}

function toRosterDto(rosterData) {
  return {
    students: rosterData.enrollments.map(enrollment => ({
      userUuid: enrollment.user.userUuid,
      firstName: enrollment.user.firstName,
      lastName: enrollment.user.lastName,
      email: enrollment.user.email,
      photoUrl: enrollment.user.photoUrl,
      pronouns: enrollment.user.pronouns,
      role: enrollment.role.role
    })),
    pagination: {
      total: rosterData.total,
      page: rosterData.page,
      limit: rosterData.limit,
      totalPages: rosterData.totalPages
    }
  };
}

function toTeamProfileDto(team) {
  if (!team) return null;

  return {
    teamUuid: team.teamUuid,
    teamName: team.teamName,
    teamPageUrl: team.teamPageUrl,
    repoUrl: team.repoUrl,
    course: team.course ? {
      courseUuid: team.course.courseUuid,
      courseCode: team.course.courseCode,
      courseName: team.course.courseName
    } : undefined,
    teamTa: team.teamTa ? {
      userUuid: team.teamTa.userUuid,
      firstName: team.teamTa.firstName,
      lastName: team.teamTa.lastName,
      email: team.teamTa.email,
      photoUrl: team.teamTa.photoUrl
    } : undefined,
    members: team.members?.map(member => ({
      userUuid: member.user.userUuid,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      email: member.user.email,
      photoUrl: member.user.photoUrl,
      pronouns: member.user.pronouns,
      githubUsername: member.user.githubUsername,
      joinedAt: member.joinedAt
    })) || [],
    stats: {
      standupCount: team._count?.standups || 0,
      memberCount: team.members?.length || 0
    }
  };
}

function toTeamListDto(teamsData) {
  return {
    teams: teamsData.teams.map(team => ({
      teamUuid: team.teamUuid,
      teamName: team.teamName,
      teamPageUrl: team.teamPageUrl,
      repoUrl: team.repoUrl,
      teamTa: team.teamTa ? {
        userUuid: team.teamTa.userUuid,
        firstName: team.teamTa.firstName,
        lastName: team.teamTa.lastName,
        email: team.teamTa.email
      } : undefined,
      memberCount: team._count?.members || 0
    })),
    pagination: {
      total: teamsData.total,
      page: teamsData.page,
      limit: teamsData.limit,
      totalPages: teamsData.totalPages
    }
  };
}

export {
  toCourseOverviewDto,
  toStaffDto,
  toStaffListDto,
  toUserProfileDto,
  toRosterDto,
  toTeamProfileDto,
  toTeamListDto
};
