import { pascalCase } from 'change-case';
import {
  createDefaultContext,
  createV10Context,
  type RenderContext,
} from 'cf-content-types-generator';

export const moduleName = (name: string) => `${pascalCase(name)}`;
export const moduleFieldsName = (name: string) => `${moduleName(name)}Fields`;
export const moduleSkeletonName = (name: string): string => `${moduleName(name)}Skeleton`;
export const context: RenderContext = {
  ...createDefaultContext(),
  moduleName,
  moduleFieldsName,
  moduleSkeletonName,
};
export const v10context: RenderContext = {
  ...createV10Context(),
  moduleName,
  moduleFieldsName,
  moduleSkeletonName,
};
