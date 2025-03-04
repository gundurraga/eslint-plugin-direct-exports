import preferDirectExport from "./rules/prefer-direct-export";

export const rules = {
  "prefer-direct-export": preferDirectExport,
};

export const configs = {
  recommended: {
    plugins: ["direct-exports"],
    rules: {
      "direct-exports/prefer-direct-export": "warn",
    },
  },
};
