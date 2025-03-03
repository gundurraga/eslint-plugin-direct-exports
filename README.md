# eslint-plugin-direct-exports

An ESLint plugin that enforces direct re-exports instead of import-then-export patterns, improving code clarity and reducing unnecessary statements.

## Installation

```bash
npm install eslint-plugin-direct-exports --save-dev
```

## Usage

Add the plugin to your ESLint configuration:

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["direct-exports"],
  extends: ["plugin:direct-exports/recommended"],
  // Or configure rules manually:
  rules: {
    "direct-exports/prefer-direct-export": "warn",
  },
};
```

## Rules

### prefer-direct-export

This rule identifies cases where you're importing a value and then exporting it without modification, and suggests using a direct re-export instead.

#### ❌ Incorrect

```javascript
// Importing and then exporting separately
import { useState, useEffect } from "react";
import { formatDate } from "./utils";

// Later in the file
export { useState, useEffect, formatDate };
```

#### ✅ Correct

```javascript
// Direct re-exports
export { useState, useEffect } from "react";
export { formatDate } from "./utils";
```

## Why use direct exports?

- **Cleaner code:** Reduces the number of statements in your files
- **Better readability:** Makes it clear that you're just re-exporting without modifications
- **Improved maintainability:** Easier to track the origin of exports
