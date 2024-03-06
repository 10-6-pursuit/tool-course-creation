import request from "../api.js";

const { CANVAS_COURSE_ID } = process.env;

export function index() {
  return request("GET", `/courses/${CANVAS_COURSE_ID}/modules`);
}

/*
  Visit API Documentation for all options:
  https://canvas.instructure.com/doc/api/modules.html#method.context_modules_api.create
*/
export function create(name) {
  return request("POST", `/courses/${CANVAS_COURSE_ID}/modules`, {
    module: { name },
  });
}
