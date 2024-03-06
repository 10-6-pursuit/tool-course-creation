import path from "node:path";
import { config } from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import canvasActions from "./canvas/actions/index.js";
import { confirmCourse } from "./canvas/actions/util.js";
import { handleError } from "./canvas/actions/errorHandling.js";
import constants from "./canvas/constants.js";
const { ERR_COURSE_NOT_CONFIRMED } = constants;
const { pathname } = new URL(import.meta.url);
global.root = path.dirname(pathname);
config();

yargs(hideBin(process.argv))
  .demand(2)
  .command(
    "canvas <resource> <unit> [number]",
    "create new canvas resources",
    (yargs) => {
      return yargs
        .positional("resource", {
          describe: "a specific resource to create",
        })
        .positional("unit", {
          describe: "the name of the unit to perform the operation on",
        })
        .positional("number", {
          describe: "the unit number; usually optional",
          type: "number",
        });
    },
    async ({ verbose, resource, unit = null, number = null }) => {
      global.verbose = verbose;

      const { courseIsConfirmed } = await confirmCourse();
      if (!courseIsConfirmed) return handleError(ERR_COURSE_NOT_CONFIRMED);

      const action = canvasActions[resource];
      if (!action) {
        console.log(`"${resource}" is not a valid resource.`);
      } else {
        action(unit, number);
      }
    }
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    default: false,
    description: "Run with verbose logging",
  })
  .parse();
