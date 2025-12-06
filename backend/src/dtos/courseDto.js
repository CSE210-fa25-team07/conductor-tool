/**
 * @module course/dto
 */

function toCourseDTO(courseData) {
  return {
    courseUuid: courseData.courseUuid,
    courseCode: courseData.courseCode,
    courseName: courseData.courseName,
    termUuid: courseData.termUuid,
    description: courseData.description,
    syllabusUrl: courseData.syllabusUrl,
    canvasUrl: courseData.canvasUrl,
    lectureUuid: courseData.lectureUuid,
    courseDescription: courseData.courseDescription,
    term: courseData.term,
    year: courseData.year,
    teams: courseData.teams,
    instructorUuid: courseData.instructorUuid
  };
}

function toCourseWithUsersDTO(courseData, users) {
  return {
    ...toCourseDTO(courseData),
    users: users
  };
}

function toCourseWithTeamsDTO(courseData, teams) {
  return {
    ...toCourseDTO(courseData),
    teams: teams
  };
}

export {
  toCourseDTO,
  toCourseWithUsersDTO,
  toCourseWithTeamsDTO
};
