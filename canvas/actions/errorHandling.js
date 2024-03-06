import chalk from "chalk";
import constants from "../constants.js";

// Error codes
const {
  ERR_COURSE_NOT_CONFIRMED,
  ERR_OPERATION_CANCELLED,
  ERR_FILE_LOAD_FAILURE,
  ERR_REQUEST_FAILED,
  ERR_DUPLICATE_OPERATION,
  ERR_UNIT_NUMBER_MISSING,
} = constants;

const errorMessages = {
  [ERR_COURSE_NOT_CONFIRMED]:
    "The course could not be confirmed. Please check the CANVAS_COURSE_ID in your `.env` file.",
  [ERR_OPERATION_CANCELLED]: "The operation was cancelled by the user.",
  [ERR_FILE_LOAD_FAILURE]:
    "The file could not be loaded. Please check the file name and location.",
  [ERR_REQUEST_FAILED]: "The API request failed.",
  [ERR_DUPLICATE_OPERATION]:
    "This operation would create duplicate resources. Please delete the duplicate resources and then try again.",
  [ERR_UNIT_NUMBER_MISSING]:
    "For this operation, the unit number is needed. Please provide the number as part of the command.",
};

export function handleError(code, customMessage = null) {
  const message = customMessage || errorMessages[code];
  const formatted = chalk.redBright(message);
  console.error(formatted);
}
