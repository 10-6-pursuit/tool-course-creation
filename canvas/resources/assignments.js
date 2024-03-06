import request from "../api.js";

const { CANVAS_COURSE_ID } = process.env;

export function index() {
  return request("GET", `/courses/${CANVAS_COURSE_ID}/assignments?per_page=50`);
}

/*
  Visit API Documentation for all options:
  https://canvas.instructure.com/doc/api/assignments.html#method.assignments_api.create
*/
export async function create(assignment) {
  return request("POST", `/courses/${CANVAS_COURSE_ID}/assignments`, {
    assignment,
  });
}
