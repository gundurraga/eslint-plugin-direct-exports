module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer direct re-exports over import-then-export",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    schema: [], // no options
  },
  create(context) {
    const exportedIdentifiers = new Map();
    const importedIdentifiers = new Map();

    return {
      // Track imports
      ImportDeclaration(node) {
        const source = node.source.value;

        node.specifiers.forEach((specifier) => {
          if (specifier.type === "ImportSpecifier") {
            const importedName = specifier.imported.name;
            const localName = specifier.local.name;

            importedIdentifiers.set(localName, {
              source,
              importedName,
              node: specifier,
            });
          }
        });
      },

      // Track exports
      ExportNamedDeclaration(node) {
        if (node.source) return; // Skip if it's already a direct export

        if (node.specifiers.length > 0) {
          node.specifiers.forEach((specifier) => {
            if (specifier.type === "ExportSpecifier") {
              const exportedName = specifier.exported.name;
              const localName = specifier.local.name;

              exportedIdentifiers.set(localName, {
                exportedName,
                node: specifier,
              });
            }
          });
        }
      },

      // At the end of the program, check for import-then-export patterns
      "Program:exit"() {
        // Find identifiers that are both imported and exported
        for (const [localName, importInfo] of importedIdentifiers.entries()) {
          const exportInfo = exportedIdentifiers.get(localName);

          if (exportInfo) {
            context.report({
              node: exportInfo.node,
              message: `Prefer direct re-export for '${localName}' from '${importInfo.source}'`,
              fix(fixer) {
                // This is a simplified fix that might not work in all cases
                // A more robust implementation would need to handle multiple imports/exports
                const importNode = importInfo.node.parent;
                const exportNode = exportInfo.node.parent;

                // Remove the export statement
                const exportRemoval = fixer.remove(exportNode);

                // Modify the import to be a direct export
                const importedName = importInfo.importedName;
                const exportedName = exportInfo.exportedName;

                let replacement;
                if (importNode.specifiers.length === 1) {
                  // If this is the only import, replace the entire statement
                  if (importedName === exportedName) {
                    replacement = `export { ${importedName} } from '${importInfo.source}';`;
                  } else {
                    replacement = `export { ${importedName} as ${exportedName} } from '${importInfo.source}';`;
                  }
                  return [
                    fixer.remove(importNode),
                    fixer.insertTextAfter(importNode, replacement),
                  ];
                }

                // More complex cases would need additional handling
                return exportRemoval;
              },
            });
          }
        }
      },
    };
  },
};
