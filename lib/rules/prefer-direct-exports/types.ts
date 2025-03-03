import { ImportDeclaration, ExportNamedDeclaration, Identifier } from "estree";

export type ImportInfo = {
  source: string;
  importedName: string;
  localName: string;
  node: ImportDeclaration;
  isDefault: boolean;
};

export type ExportInfo = {
  exportedName: string;
  localName: string;
  node: ExportNamedDeclaration;
  isDefault: boolean;
};

export type ExportSpecifier = {
  imported: string;
  exported: string;
  isDefault: boolean;
};

export type RuleOptions = {
  ignoreModules?: string[];
  onlyIndexFiles?: boolean;
};
