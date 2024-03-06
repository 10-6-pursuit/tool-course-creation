import chalk from "chalk";
import constants from "../../constants.js";
import { confirmAction, actionComplete, requestConfigFile } from "../util.js";
import { handleError } from "../errorHandling.js";
import * as assignmentsAPI from "../../resources/assignments.js";
import * as modulesAPI from "../../resources/modules.js";
import * as moduleItemsAPI from "../../resources/moduleItems.js";

// Constants
const { ERR_REQUEST_FAILED, ERR_OPERATION_CANCELLED } = constants;
const { GITHUB_CLASSROOM_ORGANIZATION_PATH, CURRICULUM_RESOURCES_PATH } =
  process.env;

const getModulesFromConfig = async (unitName) => {
  const json = await requestConfigFile(unitName);
  return json.sequence;
};

const formatURL = (element, unitName) => {
  const { kind, pursuit_path, pursuit_subpath } = element;
  if (!pursuit_path) return "https://pursuit.org";

  const base = `https://github.com/${GITHUB_CLASSROOM_ORGANIZATION_PATH}`;
  const resourcesBase = `https://github.com/${CURRICULUM_RESOURCES_PATH}`;
  let url;
  if (kind === "reading") {
    url = base + `/unit-${unitName}/tree/main/${pursuit_path}`;
  } else if (kind === "guide") {
    url = resourcesBase + `/guide-${pursuit_path}/tree/main/${pursuit_subpath}`;
  } else if (kind === "starter") {
    url = resourcesBase + `/starter-${pursuit_path}`;
  } else if (kind === "activity") {
    url =
      base + `/unit-${unitName}/tree/main/${element.pursuit_path}/lesson-notes`;
  }

  return url;
};

const formatItem = (item, unitName) => {
  const result = [
    // Create subheader
    {
      title: item.name,
      type: "SubHeader",
      indent: 0,
    },
  ];

  if (item.kind === "lesson") {
    item.elements = [
      { kind: "reading", pursuit_path: item.pursuit_path },
      { kind: "activity", pursuit_path: item.pursuit_path },
      { kind: "recording" },
    ];
  }

  const TITLE_FORMATTER = {
    activity: (name) => `💻 ${name} Classroom Activity`,
    deck: (name) => `⭐️ ${name} Slide Deck`,
    guide: (name) => `🗺 ${name} Guide`,
    reading: (name) => `📕 ${name} Reading`,
    recording: (name) => `📹 ${name} Recording`,
    starter: (name) => `🌱 ${name} Starter`,
  };

  if (item.elements) {
    const items = item.elements.map((el) => ({
      title: TITLE_FORMATTER[el.kind](el.name || item.name),
      type: "ExternalUrl",
      indent: 1,
      external_url: formatURL(el, unitName),
      new_tab: true,
    }));
    result.push(...items);
  }

  if (item.starter) {
    const element = { kind: "starter", pursuit_path: item.starter };
    result.push({
      title: TITLE_FORMATTER.starter(item.name),
      type: "ExternalUrl",
      indent: 1,
      external_url: formatURL(element, unitName),
      new_tab: true,
    });
  }

  if (item.activity) {
    // Add placeholder values for Assignments
    result.push({
      name: item.name,
      type: "Assignment",
      content_id: null,
      indent: 1,
    });
  }

  return result;
};

const reformatLessonData = (lessons, unitName) => {
  for (let sectionName in lessons) {
    let items = lessons[sectionName];
    items = items.map((item) => formatItem(item, unitName));

    lessons[sectionName] = items;
  }
};

const associateAssignmentsWithLessonData = (lessons, assignments) => {
  for (let sectionName in lessons) {
    const itemGroupings = lessons[sectionName];
    itemGroupings.forEach(([subheader, ...items]) => {
      const activity = items.find((item) => item.type === "Assignment");
      if (activity) {
        /*
          Includes a space to indicate that the assignment has been transformed and avoid duplicate associations such as "Git" and "GitHub".
        */
        const assignment = assignments.find(({ name }) => {
          const regexp = new RegExp(`^.{2,3}${subheader.title}`);
          return !!name.match(regexp);
        });
        if (assignment) {
          activity.content_id = assignment.id;
        }
      }
    });
  }
};

const checkForMissingAssignments = (lessons) => {
  let result = [];
  for (let sectionName in lessons) {
    const itemGroupings = lessons[sectionName];
    const items = itemGroupings.reduce((a, b) => a.concat(b));
    const missing = items.filter((item) => item.content_id === null);
    result.push(...missing);
  }
  return result;
};

const addPositionToItems = (lessons) => {
  let result = [];
  let num = 1;
  for (let sectionName in lessons) {
    const itemGroupings = lessons[sectionName];
    const items = itemGroupings.reduce((a, b) => a.concat(b));
    items.forEach((item) => (item.position = num++));
  }
  return result;
};

const createModuleHeadings = (lessons) => {
  let result = [];
  for (let sectionName in lessons) {
    const request = modulesAPI.create(sectionName);
    result.push(request);
  }
  return result;
};

const createModuleItems = (lessons, headingIds) => {
  let result = Promise.resolve();

  for (let sectionName in lessons) {
    const moduleId = headingIds[sectionName];
    let items = lessons[sectionName];
    items = items.reduce((a, b) => a.concat(b));
    result = items.reduce((acc, item, index) => {
      return acc.then(() => {
        const color = index % 2 ? "red" : "green";
        process.stdout.write(chalk[color](". "));
        return moduleItemsAPI.create(moduleId, item);
      });
    }, result);
  }

  return result;
};

export default async function createModules(unitName) {
  let lessons;
  try {
    lessons = await getModulesFromConfig(unitName);
  } catch (error) {
    if (global.verbose) console.error(error);
    return handleError(ERR_REQUEST_FAILED);
  }

  reformatLessonData(lessons, unitName);

  let assignments;
  try {
    assignments = await assignmentsAPI.index();
  } catch (error) {
    if (global.verbose) console.error(error);
    return handleError(ERR_REQUEST_FAILED);
  }

  associateAssignmentsWithLessonData(lessons, assignments);

  const missing = checkForMissingAssignments(lessons);
  if (missing.length) {
    const names = missing.map(({ name }) => `\t${name}`);
    const joinedNames = chalk.cyanBright(names.join("\n"));
    const prompt = `The following assignments are missing. Do you wish to continue?\n${joinedNames}`;

    const { actionIsConfirmed } = await confirmAction(prompt);
    if (!actionIsConfirmed) return handleError(ERR_OPERATION_CANCELLED);
  } else {
    console.log("All assignments found. Moving forward...");
  }

  addPositionToItems(lessons);

  const headingPromises = createModuleHeadings(lessons);
  let headings;
  try {
    headings = await Promise.all(headingPromises);
    console.log(`${headings.length} Modules created.`);
  } catch (error) {
    if (global.verbose) console.error(error);
    return handleError(ERR_REQUEST_FAILED);
  }

  const headingIds = headings.reduce((acc, heading) => {
    acc[heading.name] = heading.id;
    return acc;
  }, {});

  const itemPromises = createModuleItems(lessons, headingIds);
  try {
    console.log("Creating module items. This may take some time.");
    await itemPromises;
    console.log("\nModules items created.");
    actionComplete("/modules");
  } catch (error) {
    if (global.verbose) console.error(error);
    return handleError(ERR_REQUEST_FAILED);
  }
}
