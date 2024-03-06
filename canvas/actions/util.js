import { config } from "dotenv";
import chalk from "chalk";
import * as converter from "js-yaml";
import inquirer from "inquirer";
import githubConfigRequest from "../github.js";
import * as coursesAPI from "../resources/courses.js";

config();
const { CANVAS_COURSE_ID } = process.env;

export async function confirmCourse() {
  // Confirm that course exists and can be accessed.
  let course;
  try {
    course = await coursesAPI.show(CANVAS_COURSE_ID);
    if (!course.name) throw new Error();
  } catch (error) {
    if (global.verbose) console.error(error);
    return { courseIsConfirmed: false };
  }

  // Ask user to confirm course.
  console.log(`Updating course ${chalk.magentaBright(course.name)}.`);
  const confirm = {
    type: "confirm",
    name: "courseIsConfirmed",
    message: `Is this correct?`,
    default: false,
  };
  return inquirer.prompt(confirm);
}

export function confirmAction(text) {
  console.log(text);
  const confirm = {
    type: "confirm",
    name: "actionIsConfirmed",
    message: "Continue with the operation?",
    default: false,
  };

  return inquirer.prompt(confirm);
}

export function actionComplete(path) {
  console.log(
    "Your action is complete. Please visit the link below to check the work of this tool."
  );

  console.log(
    chalk.blueBright(
      `${process.env.BASE_URL}/courses/${CANVAS_COURSE_ID}${path}`
    )
  );
}

export async function requestConfigFile(name) {
  const repository = `unit-${name}`;
  console.log(
    `Requesting config file from the ${chalk.cyanBright(
      repository
    )} repository.`
  );
  const yaml = await githubConfigRequest(name);
  return converter.load(yaml);
}

const formatAsLab = (name) => `🔬 ${name} Lab`;
const formatAsProject = (name) => `⚽️ ${name} Project`;
const formatAsAssessment = (name) => `🏁 ${name} Assessment`;
const formatAsTask = (name) => `✅ ${name} Task`;
const FORMAT_FNS = {
  lesson: formatAsLab,
  project: formatAsProject,
  assessment: formatAsAssessment,
  task: formatAsTask,
};
export function formatAssignmentName(assignment) {
  const formatter = FORMAT_FNS[assignment.kind];
  assignment.name = formatter(assignment.name);
}
