import { pascalCase } from 'change-case';
import { createContext, type RenderContext } from 'cf-content-types-generator';

export const moduleName = (name: string) => pascalCase(name);
export const moduleFieldsName = (name: string) => `${moduleName(name)}Fields`;
export const moduleSkeletonName = (name: string): string => `${moduleName(name)}Skeleton`;
export const context: RenderContext = {
  ...createContext(),
  moduleName,
  moduleFieldsName,
  moduleSkeletonName,
};
