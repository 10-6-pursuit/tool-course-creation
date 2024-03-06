import constants from "../../constants.js";
const { ASSIGNMENT_GROUPS, ASSIGNMENT_GROUPS_MAPPING } = constants;

const byLessonsWithActivities = (lesson) => lesson.activity;
const toAssignmentGroupKeys = (acc, group) => ({ ...acc, [group]: [] });
const toLessonsByAssignmentGroup = (acc, lesson) => {
  const key = ASSIGNMENT_GROUPS_MAPPING[lesson.kind];
  acc[key].push(lesson);
  return acc;
};
const removeUnusedGroupKeys = (assignmentsByGroup) => {
  for (let group in assignmentsByGroup) {
    if (!assignmentsByGroup[group]) {
      delete assignmentsByGroup[group];
    }
  }
};

export default function getLessonsByAssignmentGroup(lessons) {
  const lessonsWithActivities = lessons.filter(byLessonsWithActivities);
  const accumulator = ASSIGNMENT_GROUPS.reduce(toAssignmentGroupKeys, {});
  const assignmentsByGroup = lessonsWithActivities.reduce(
    toLessonsByAssignmentGroup,
    accumulator
  );

  removeUnusedGroupKeys(assignmentsByGroup);
  return assignmentsByGroup;
}
