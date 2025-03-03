import preferDirectExport from "./rules/prefer-direct-exports";

module.exports = {
  rules: {
    "prefer-direct-export": preferDirectExport,
  },
  configs: {
    recommended: {
      plugins: ["direct-exports"],
      rules: {
        "direct-exports/prefer-direct-export": "warn",
      },
    },
  },
};
