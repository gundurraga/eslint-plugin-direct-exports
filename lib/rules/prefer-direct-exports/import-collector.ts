import { ImportDeclaration, Identifier } from "estree";
import { ImportInfo } from "./types";

export const importCollector = {
  collect(node: ImportDeclaration): ImportInfo[] {
    const source = node.source.value as string;
    const imports: ImportInfo[] = [];

    node.specifiers.forEach((specifier) => {
      if (specifier.type === "ImportSpecifier") {
        // Handle named imports
        const imported = specifier.imported;
        let importedName: string;

        if ("type" in imported && imported.type === "Identifier") {
          importedName = imported.name;
        } else {
          importedName = String((imported as any).value);
        }

        const local = specifier.local as Identifier;
        const localName = local.name;

        imports.push({
          source,
          importedName,
          localName,
          node,
          isDefault: false,
        });
      } else if (specifier.type === "ImportDefaultSpecifier") {
        // Handle default imports
        const local = specifier.local as Identifier;
        const localName = local.name;

        imports.push({
          source,
          importedName: "default",
          localName,
          node,
          isDefault: true,
        });
      } else if (specifier.type === "ImportNamespaceSpecifier") {
        // Handle namespace imports (import * as X from 'module')
        const local = specifier.local as Identifier;
        const localName = local.name;

        imports.push({
          source,
          importedName: "*",
          localName,
          node,
          isDefault: false,
        });
      }
    });

    return imports;
  },
};
