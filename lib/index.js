module.exports = {
  rules: {
    "prefer-direct-export": require("./rules/prefer-direct-export"),
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
