import request from "../api.js";

const { CANVAS_COURSE_ID } = process.env;

export function index(moduleId) {
  return request(
    "GET",
    `/courses/${CANVAS_COURSE_ID}/modules/${moduleId}/items`
  );
}

/*
  Visit API Documentation for all options:
  https://canvas.instructure.com/doc/api/modules.html#method.context_module_items_api.create
*/
export function create(moduleId, body) {
  return request(
    "POST",
    `/courses/${CANVAS_COURSE_ID}/modules/${moduleId}/items`,
    {
      module_item: body,
    }
  );
}
