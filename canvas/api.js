import { config } from "dotenv";
import fetch from "node-fetch";
config();

const API_BASE_URL = process.env.API_BASE_URL;

export default async function request(method, path, body) {
  const url = API_BASE_URL + path;
  const headers = {
    Authorization: `Bearer ${process.env.CANVAS_TOKEN}`,
    "Content-Type": "application/json",
  };

  let options = { method, headers };
  if (body) options = { ...options, body: JSON.stringify(body) };

  const response = await fetch(url, options);
  const json = await response.json();

  return json;
}
