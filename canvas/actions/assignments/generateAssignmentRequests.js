import path from "node:path";
import fs from "node:fs";
import { Liquid } from "liquidjs";
import defaults from "../../resources/assignments.defaults.js";
import * as assignmentsAPI from "../../resources/assignments.js";
import { formatAssignmentName } from "../util.js";

const { REPLIT_TEAM_PATH, GITHUB_CLASSROOM_ORGANIZATION_PATH } = process.env;

function isCanvasAssignment({ activity, activity_description }) {
  return (
    ["canvas_text", "canvas_url"].includes(activity) && activity_description
  );
}

function getFilePath(activity, kind) {
  let result = null;
  if (activity === "replit") {
    result = path.join(global.root, "templates", "replit-assignment.hbs");
  } else if (activity === "repository") {
    if (kind === "lesson") {
      result = path.join(global.root, "templates", "repository-lab.hbs");
    } else if (kind === "project") {
      result = path.join(global.root, "templates", "repository-project.hbs");
    } else if (kind === "assessment") {
      result = path.join(global.root, "templates", "repository-assessment.hbs");
    }
  } else if (activity === "presentation") {
    result = path.join(global.root, "templates", "project-presentation.hbs");
  } else {
    result = path.join(global.root, "templates", "repository-lab.hbs");
  }
  return result;
}

function constructAssignmentBody(assignment, group) {
  const {
    activity,
    activity_description,
    kind,
    pursuit_path,
    name,
    points_possible,
  } = assignment;

  const body = {
    ...defaults[activity],
    name: name,
    assignment_group_id: group.id,
  };

  if (Number.isInteger(points_possible)) {
    body.points_possible = points_possible;
  }

  if (isCanvasAssignment(assignment)) {
    body.description = activity_description;
  } else {
    const filePath = getFilePath(activity, kind);
    const contents = fs.readFileSync(filePath, "utf-8");
    const engine = new Liquid();
    const template = engine.parse(contents);
    body.description = engine.renderSync(template, {
      kind,
      replitOrg: REPLIT_TEAM_PATH,
      gitHubOrg: GITHUB_CLASSROOM_ORGANIZATION_PATH,
      path: pursuit_path,
      title: name,
    });
  }

  return body;
}

export default function generateAssignmentRequests(
  assignmentsByGroup,
  liveGroups
) {
  let result = [];
  for (let group in assignmentsByGroup) {
    let assignments = assignmentsByGroup[group];
    assignments.forEach(formatAssignmentName);

    const liveGroup = liveGroups.find(({ name }) => name.includes(group));
    assignments = assignments.map((assignment) =>
      constructAssignmentBody(assignment, liveGroup)
    );
    const promises = assignments.map((assignment) => {
      return assignmentsAPI.create(assignment, liveGroup);
    });
    result.push(...promises);
  }
  return result;
}
