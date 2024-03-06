import fs from "node:fs";
import { config } from "dotenv";
import { Octokit } from "@octokit/rest";
import { createTokenAuth } from "@octokit/auth-token";

config();
const { GITHUB_AUTH_TOKEN, LOCAL_CONFIG_PATH = "" } = process.env;

function getConfigFromFile() {
  console.log("Getting configuration from local file...");
  const contents = fs.readFileSync(LOCAL_CONFIG_PATH, "utf-8");
  return contents;
}

export default async function getConfigByUnit(unitName) {
  if (LOCAL_CONFIG_PATH) return getConfigFromFile();

  const token = await createTokenAuth(GITHUB_AUTH_TOKEN);
  const octokit = new Octokit(token);
  const result = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner: "pursuit-curriculum",
      repo: `unit-${unitName}`,
      path: "config.yaml",
    }
  );
  return Buffer.from(result.data.content, "base64");
}
