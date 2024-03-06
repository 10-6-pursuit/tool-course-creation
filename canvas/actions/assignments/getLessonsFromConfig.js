import { requestConfigFile } from "../util.js";

const concat = (a, b) => a.concat(b);

export default async function getLessonsFromConfig(unitName) {
  const json = await requestConfigFile(unitName);
  const sections = Object.values(json.sequence);
  return sections.reduce(concat);
}
