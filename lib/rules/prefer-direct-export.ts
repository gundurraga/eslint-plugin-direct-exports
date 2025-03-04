import { Rule } from "eslint";
import { ImportDeclaration, ExportNamedDeclaration, Identifier } from "estree";
import * as path from "path";

// Consolidated type definitions
type ImportInfo = {
  source: string;
  importedName: string;
  localName: string;
  node: ImportDeclaration;
  isDefault: boolean;
};

type ExportInfo = {
  exportedName: string;
  localName: string;
  node: ExportNamedDeclaration;
  isDefault: boolean;
};

/**
 * Rule to enforce direct re-exports instead of import-then-export patterns
 * Only applies to index files by default for better maintainability
 */
const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer direct re-exports over import-then-export in index files",
      category: "Best Practices",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoreModules: {
            type: "array",
            items: { type: "string" },
          },
          onlyIndexFiles: {
            type: "boolean",
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferDirectExport:
        "Prefer direct re-export for imports from '{{source}}' instead of separate import and export statements",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const ignoreModules = options.ignoreModules || [];
    const onlyIndexFiles = options.onlyIndexFiles !== false;

    // Skip non-index files if configured to do so
    const filename = context.getFilename();
    const basename = path.basename(filename);

    if (onlyIndexFiles && !basename.match(/^index\.(js|ts|jsx|tsx)$/)) {
      return {};
    }

    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];

    // Helper for extracting name from node, which may have different structures
    function getNameFromNode(node: any): string {
      return node.type === "Identifier" ? node.name : String(node.value);
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value as string;

        // Skip modules explicitly configured to ignore
        if (ignoreModules.includes(source)) {
          return;
        }

        // Process each import specifier
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportSpecifier") {
            // Named imports like: import { foo } from 'module'
            const importedName = getNameFromNode(specifier.imported);
            const localName = (specifier.local as Identifier).name;

            imports.push({
              source,
              importedName,
              localName,
              node,
              isDefault: false,
            });
          } else if (specifier.type === "ImportDefaultSpecifier") {
            // Default imports like: import foo from 'module'
            const localName = (specifier.local as Identifier).name;

            imports.push({
              source,
              importedName: "default",
              localName,
              node,
              isDefault: true,
            });
          } else if (specifier.type === "ImportNamespaceSpecifier") {
            // Namespace imports like: import * as foo from 'module'
            const localName = (specifier.local as Identifier).name;

            imports.push({
              source,
              importedName: "*",
              localName,
              node,
              isDefault: false,
            });
          }
        }
      },

      ExportNamedDeclaration(node) {
        // Skip direct exports (already has a source) or declaration exports
        if (node.source || node.declaration) {
          return;
        }

        // Process export specifiers
        for (const specifier of node.specifiers) {
          if (specifier.type === "ExportSpecifier") {
            const exportedName = getNameFromNode(specifier.exported);
            const localName = (specifier.local as Identifier).name;

            exports.push({
              exportedName,
              localName,
              node,
              isDefault: false,
            });
          }
        }
      },

      "Program:exit"() {
        // Map local names to their import information for quick lookup
        const importMap = new Map<string, ImportInfo>();
        for (const importInfo of imports) {
          importMap.set(importInfo.localName, importInfo);
        }

        // Check each export against imports
        for (const exportInfo of exports) {
          const { localName, node: exportNode } = exportInfo;
          const matchingImport = importMap.get(localName);

          if (matchingImport) {
            const { source } = matchingImport;

            context.report({
              node: exportNode,
              messageId: "preferDirectExport",
              data: { source },
            });
          }
        }
      },
    };
  },
};

export default rule;
