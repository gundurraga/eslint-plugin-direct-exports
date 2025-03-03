const { RuleTester } = require("eslint");
const rule = require("../../lib/rules/prefer-direct-exports").default;
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

    // 3. Import used in code, not just re-exported
    withFilename(`
      import { foo } from "module-a";
      console.log(foo);
      export { foo };
    `),

    // 4. Non-index file with onlyIndexFiles option
    {
      ...withFilename(
        `
        import { foo } from "module-a";
        export { foo };
      `,
        "utils.js"
      ),
      options: [{ onlyIndexFiles: true }],
    },

    // 5. Ignored module
    {
      ...withFilename(`
        import { foo } from "ignored-module";
        export { foo };
      `),
      options: [{ ignoreModules: ["ignored-module"] }],
    },
  ],

  invalid: [
    // 1. Basic case: import and export from same module
    {
      ...withFilename(`
        import { foo } from "module-a";
        export { foo };
      `),
      output: 'export { foo } from "module-a";',
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
      output: 'export { foo, bar } from "module-a";',
      errors: [
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
      output:
        'export { foo } from "module-a";\nexport { bar } from "module-b";',
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
      output: 'export { default as defaultExport } from "module-a";',
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
      output: 'export { foo as bar } from "module-a";',
      errors: [
        {
          messageId: "preferDirectExport",
          data: { source: "module-a" },
        },
      ],
    },

    // 6. Mixed default and named imports
    {
      ...withFilename(`
        import React, { useState } from "react";
        export { React, useState };
      `),
      output:
        'export { default as React } from "react";\nexport { useState } from "react";',
      errors: [
        {
          messageId: "preferDirectExport",
          data: { source: "react" },
        },
      ],
    },
  ],
});
