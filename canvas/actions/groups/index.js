import chalk from "chalk";
import constants from "../../constants.js";
import { confirmAction, actionComplete } from "../util.js";
import { handleError } from "../errorHandling.js";
import * as assignmentGroupsAPI from "../../resources/assignmentGroups.js";

// Constants
const {
  ASSIGNMENT_GROUPS,
  ERR_OPERATION_CANCELLED,
  ERR_DUPLICATE_OPERATION,
  ERR_REQUEST_FAILED,
  ERR_UNIT_NUMBER_MISSING,
} = constants;

// Helper Functions
const generateAssignmentGroupsToCreate = (number) => {
  return ASSIGNMENT_GROUPS.map((name) => `Unit ${number} - ${name}`);
};
const runConfirmation = async (groups) => {
  const listText = chalk.cyanBright(groups.join("\n\t"));
  const prompt = `About to create the following groups:\n\t${listText}`;

  return confirmAction(prompt);
};
const doGroupsAlreadyExist = (existing, groups) => {
  return existing.some(({ name }) => groups.includes(name));
};
const createGroup = (name) => assignmentGroupsAPI.create({ name });

export default async function createAssignmentGroups(_unitName, unitNumber) {
  if (!unitNumber) return handleError(ERR_UNIT_NUMBER_MISSING);

  const groupsToCreate = generateAssignmentGroupsToCreate(unitNumber);
  const { actionIsConfirmed } = await runConfirmation(groupsToCreate);
  if (!actionIsConfirmed) return handleError(ERR_OPERATION_CANCELLED);

  let existing;
  try {
    existing = await assignmentGroupsAPI.index();
  } catch (error) {
    if (global.verbose) console.error(error);
    return handleError(ERR_REQUEST_FAILED);
  }

  const alreadyExists = doGroupsAlreadyExist(existing, groupsToCreate);
  if (alreadyExists) return handleError(ERR_DUPLICATE_OPERATION);

  const promises = groupsToCreate.map(createGroup);
  try {
    await Promise.all(promises);
    console.log("Assignment groups created.");
    actionComplete("/assignments");
  } catch (error) {
    if (global.verbose) console.error(error);
    return handleError(ERR_REQUEST_FAILED);
  }
}
