import camelcase from 'camelcase';
import { createDefaultContext, RenderContext } from 'cf-content-types-generator';

export const moduleName = (name: string) => `${camelcase(name, { pascalCase: true })}`;
export const moduleFieldsName = (name: string) => `${moduleName(name)}Fields`;
export const context: RenderContext = { ...createDefaultContext(), moduleName, moduleFieldsName };
