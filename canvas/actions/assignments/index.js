import chalk from "chalk";

import getLessonsByAssignmentGroup from "./getLessonsByAssignmentGroup.js";
import getLessonsFromConfig from "./getLessonsFromConfig.js";
import generateAssignmentRequests from "./generateAssignmentRequests.js";

import * as assignmentGroupsAPI from "../../resources/assignmentGroups.js";

import constants from "../../constants.js";
import { confirmAction, actionComplete } from "../util.js";
import { handleError } from "../errorHandling.js";

// Constants
const { ERR_OPERATION_CANCELLED, ERR_REQUEST_FAILED } = constants;
const { CANVAS_COURSE_ID } = process.env;

// Helper functions
const getConfirmationPrompt = (assignmentsByGroup) => {
  let prompt = "About to create the following assignments:";

  for (let groupName in assignmentsByGroup) {
    const groupAssignmentsList = assignmentsByGroup[groupName];
    if (groupAssignmentsList.length) {
      prompt += "\n ❖ " + chalk.cyanBright(groupName) + "\n";
      const assignmentNames = groupAssignmentsList
        .map(({ name }) => name)
        .join("\n\t");
      prompt += chalk.cyanBright("\t" + assignmentNames);
    }
  }

  return prompt;
};

const validateAssignmentGroups = (localGroups, liveGroups) => {
  const tuples = localGroups.reduce((acc, localName) => {
    const liveGroup = liveGroups.find((name) => name.includes(localName));
    acc.push([localName, liveGroup]);
    return acc;
  }, []);

  return tuples.every(([_name, liveName]) => !!liveName);
};

// Main function
export default async function createAssignments(unitName) {
  let lessons;
  try {
    lessons = await getLessonsFromConfig(unitName);
  } catch (error) {
    if (global.verbose) console.error(error);
    return handleError(ERR_REQUEST_FAILED);
  }

  // Confirm assignments to create
  const assignmentsByGroup = getLessonsByAssignmentGroup(lessons);
  const prompt = await getConfirmationPrompt(assignmentsByGroup);
  const { actionIsConfirmed } = await confirmAction(prompt);
  if (!actionIsConfirmed) return handleError(ERR_OPERATION_CANCELLED);

  // Load assignment groups
  let liveAssignmentGroups;
  try {
    console.log("Loading live Assignment Groups...");
    liveAssignmentGroups = await assignmentGroupsAPI.index(CANVAS_COURSE_ID);
  } catch (error) {
    if (global.verbose) console.error(error);
    return handleError(ERR_REQUEST_FAILED);
  }

  // Confirm live assignment groups match
  const localGroupNames = Object.keys(assignmentsByGroup);
  const liveGroupNames = liveAssignmentGroups.map(({ name }) => name);
  const isValid = validateAssignmentGroups(localGroupNames, liveGroupNames);
  if (!isValid) {
    const err =
      "Assignment Groups have not been created. Please first create the Assignment Groups before running this command.";
    return handleError("ERR_CUSTOM", err);
  }

  console.log("Assignment Groups are live.");

  // Create assignments
  const promises = generateAssignmentRequests(
    assignmentsByGroup,
    liveAssignmentGroups
  );

  try {
    await Promise.all(promises);
    console.log("Assignments created.");
    actionComplete("/assignments");
  } catch (error) {
    if (global.verbose) console.error(error);
    return handleError(ERR_REQUEST_FAILED);
  }
}
