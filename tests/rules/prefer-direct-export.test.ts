const { RuleTester } = require("eslint");
const rule = require("../../lib/rules/prefer-direct-export").default;
const path = require("path");

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

// Helper to set filename for tests
function withFilename(code: string, filename = "index.js") {
  return {
    code,
    filename: path.join(process.cwd(), filename),
  };
}

ruleTester.run("prefer-direct-export", rule, {
  valid: [
    // 1. Already using direct exports
    withFilename('export { foo } from "module-a";'),

    // 2. Export with declaration (not just re-exporting)
    withFilename(`
      import { useState } from 'react';
      export const Component = () => {
        const [state, setState] = useState(null);
        return state;
      };
    `),

    // 3. Non-index file (rule should skip)
    withFilename(
      `
      import { foo } from "module-a";
      export { foo };
    `,
      "utils.js"
    ),

    // 4. Ignored module
    {
      ...withFilename(`
        import { foo } from "ignored-module";
        export { foo };
      `),
      options: [{ ignoreModules: ["ignored-module"] }],
    },

    // 5. Non-js/ts file
    withFilename(
      `
      import { foo } from "module-a";
      export { foo };
    `,
      "index.jsx"
    ),
  ],

  invalid: [
    // 1. Basic case: import and export from same module
    {
      ...withFilename(`
        import { foo } from "module-a";
        export { foo };
      `),
      errors: [
        {
          messageId: "preferDirectExport",
          data: { source: "module-a" },
        },
      ],
    },

    // 2. Multiple imports from same module
    {
      ...withFilename(`
        import { foo, bar } from "module-a";
        export { foo, bar };
      `),
      errors: [
        {
          messageId: "preferDirectExport",
          data: { source: "module-a" },
        },
        {
          messageId: "preferDirectExport",
          data: { source: "module-a" },
        },
      ],
    },

    // 3. Imports from multiple modules
    {
      ...withFilename(`
        import { foo } from "module-a";
        import { bar } from "module-b";
        export { foo, bar };
      `),
      errors: [
        {
          messageId: "preferDirectExport",
          data: { source: "module-a" },
        },
        {
          messageId: "preferDirectExport",
          data: { source: "module-b" },
        },
      ],
    },

    // 4. Default import
    {
      ...withFilename(`
        import defaultExport from "module-a";
        export { defaultExport };
      `),
      errors: [
        {
          messageId: "preferDirectExport",
          data: { source: "module-a" },
        },
      ],
    },

    // 5. Renamed export
    {
      ...withFilename(`
        import { foo } from "module-a";
        export { foo as bar };
      `),
      errors: [
        {
          messageId: "preferDirectExport",
          data: { source: "module-a" },
        },
      ],
    },

    // 6. TS file
    {
      ...withFilename(
        `
        import { foo } from "module-a";
        export { foo };
      `,
        "index.ts"
      ),
      errors: [
        {
          messageId: "preferDirectExport",
          data: { source: "module-a" },
        },
      ],
    },
  ],
});
