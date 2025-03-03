import { Rule } from "eslint";
import { ImportDeclaration, ExportNamedDeclaration } from "estree";
import { ImportInfo, ExportInfo, RuleOptions, ExportSpecifier } from "./types";
import { importCollector } from "./import-collector";
import { exportCollector } from "./export-collector";
import { fixGenerator } from "./fix-generator";
import * as path from "path";

/**
 * Rule to enforce direct re-exports instead of import-then-export patterns
 * @type {Rule.RuleModule}
 */
const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer direct re-exports over import-then-export",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
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
    const options: RuleOptions = context.options[0] || {};
    const ignoreModules = options.ignoreModules || [];
    const onlyIndexFiles = options.onlyIndexFiles || false;

    // Check if we should apply the rule to this file
    const filename = context.getFilename();
    const basename = path.basename(filename);

    if (onlyIndexFiles && !basename.match(/^index\.(js|ts|jsx|tsx)$/)) {
      return {}; // Skip this file if it's not an index file and onlyIndexFiles is true
    }

    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];

    return {
      ImportDeclaration(node) {
        const source = node.source.value as string;

        // Skip modules that should be ignored
        if (ignoreModules.includes(source)) {
          return;
        }

        imports.push(...importCollector.collect(node));
      },

      ExportNamedDeclaration(node) {
        exports.push(...exportCollector.collect(node));
      },

      "Program:exit"() {
        // Group exports by their source node
        const exportsByNode = new Map<ExportNamedDeclaration, ExportInfo[]>();

        for (const exportInfo of exports) {
          const existing = exportsByNode.get(exportInfo.node) || [];
          existing.push(exportInfo);
          exportsByNode.set(exportInfo.node, existing);
        }

        // Process each export node
        for (const [exportNode, nodeExports] of exportsByNode.entries()) {
          // Group exports by their source
          const exportsBySource = new Map<string, ExportSpecifier[]>();
          const importNodesBySource = new Map<string, Set<ImportDeclaration>>();

          for (const exportInfo of nodeExports) {
            const { localName, exportedName } = exportInfo;

            // Find matching import
            const matchingImport = imports.find(
              (imp) => imp.localName === localName
            );

            if (matchingImport) {
              const {
                source,
                importedName,
                isDefault,
                node: importNode,
              } = matchingImport;

              // Create or update the export specifier list for this source
              const specifiers = exportsBySource.get(source) || [];
              specifiers.push({
                imported: importedName,
                exported: exportedName,
                isDefault,
              });
              exportsBySource.set(source, specifiers);

              // Track the import nodes for this source
              const importNodes = importNodesBySource.get(source) || new Set();
              importNodes.add(importNode);
              importNodesBySource.set(source, importNodes);
            }
          }

          // Report and fix for each source
          for (const [source, exportSpecifiers] of exportsBySource.entries()) {
            const importNodes = importNodesBySource.get(source) || new Set();

            context.report({
              node: exportNode,
              messageId: "preferDirectExport",
              data: { source },
              fix(fixer) {
                return fixGenerator.createDirectExport(
                  source,
                  exportSpecifiers,
                  true, // Always remove imports
                  importNodes,
                  exportNode,
                  context.getSourceCode()
                )(fixer);
              },
            });
          }
        }
      },
    };
  },
};

export default rule;
