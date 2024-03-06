import request from "../api.js";

export function show(courseId) {
  return request("GET", `/courses/${courseId}`);
}
