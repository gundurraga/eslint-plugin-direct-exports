import { Rule } from "eslint";
import { ImportDeclaration, ExportNamedDeclaration } from "estree";
import { ExportSpecifier } from "./types";

export const fixGenerator = {
  createDirectExport(
    source: string,
    specifiers: ExportSpecifier[],
    removeImports: boolean,
    importNodes: Set<ImportDeclaration>,
    exportNode: ExportNamedDeclaration,
    sourceCode: Rule.RuleContext["sourceCode"]
  ): (fixer: Rule.RuleFixer) => Rule.Fix[] {
    return (fixer) => {
      const fixes: Rule.Fix[] = [];

      // Get the indentation from the export node
      const exportText = sourceCode.getText(exportNode);
      const indentMatch = exportText.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : "        "; // Default indentation

      // Group specifiers by type (default, namespace, named)
      const defaultSpecifiers = specifiers.filter((s) => s.isDefault);
      const namedSpecifiers = specifiers.filter(
        (s) => !s.isDefault && s.imported !== "*"
      );
      const namespaceSpecifiers = specifiers.filter((s) => s.imported === "*");

      // Create a single string for all exports to maintain order
      let newExports = "";

      // Handle default exports first
      if (defaultSpecifiers.length > 0) {
        defaultSpecifiers.forEach(({ exported }) => {
          newExports += `${indent}export { default as ${exported} } from "${source}";\n`;
        });
      }

      // Format the named specifiers for the direct export
      if (namedSpecifiers.length > 0) {
        const formattedNamedSpecifiers = namedSpecifiers
          .map(({ imported, exported }) => {
            return imported === exported
              ? imported
              : `${imported} as ${exported}`;
          })
          .join(", ");

        newExports += `${indent}export { ${formattedNamedSpecifiers} } from "${source}";\n`;
      }

      // Handle namespace exports
      if (namespaceSpecifiers.length > 0) {
        namespaceSpecifiers.forEach(({ exported }) => {
          newExports += `${indent}export * as ${exported} from "${source}";\n`;
        });
      }

      // Insert all exports at once to maintain order
      if (newExports) {
        fixes.push(fixer.insertTextBefore(exportNode, newExports));
      }

      // Always remove the original export statement
      fixes.push(fixer.remove(exportNode));

      // Remove the original import statements
      importNodes.forEach((importNode) => {
        fixes.push(fixer.remove(importNode));
      });

      return fixes;
    };
  },
};
