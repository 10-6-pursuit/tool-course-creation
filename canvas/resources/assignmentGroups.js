import request from "../api.js";

const { CANVAS_COURSE_ID } = process.env;

export function index() {
  return request("GET", `/courses/${CANVAS_COURSE_ID}/assignment_groups`);
}

/*
  Visit API Documentation for all options:
  https://canvas.instructure.com/doc/api/assignment_groups.html#method.assignment_groups_api.create
*/
export function create(group) {
  return request(
    "POST",
    `/courses/${CANVAS_COURSE_ID}/assignment_groups`,
    group
  );
}
