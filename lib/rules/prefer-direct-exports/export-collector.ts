import { ExportNamedDeclaration, Identifier } from "estree";
import { ExportInfo } from "./types";

export const exportCollector = {
  collect(node: ExportNamedDeclaration): ExportInfo[] {
    // Skip if it's already a direct export (has a source)
    if (node.source) return [];

    // Skip if it's exporting a declaration (like `export const x = 1`)
    if (node.declaration) return [];

    const exports: ExportInfo[] = [];

    node.specifiers.forEach((specifier) => {
      if (specifier.type === "ExportSpecifier") {
        // Handle named exports
        const exported = specifier.exported;
        let exportedName: string;

        if ("type" in exported && exported.type === "Identifier") {
          exportedName = exported.name;
        } else {
          exportedName = String((exported as any).value);
        }

        const local = specifier.local as Identifier;
        const localName = local.name;

        exports.push({
          exportedName,
          localName,
          node,
          isDefault: false,
        });
      }
    });

    return exports;
  },
};
