import groups from "./groups/index.js";
import assignments from "./assignments/index.js";
import modules from "./modules/index.js";

export default {
  groups,
  assignments,
  modules,
  all: async (unit, number) => {
    await groups(unit, number);
    await assignments(unit, number);
    await modules(unit, number);
  },
};
