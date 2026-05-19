import type { SetRequired } from 'type-fest';
import {
  type ContentfulClientOptions,
  getOrganizations as getOrganizationsBase,
  getSpaces as getSpacesBase,
  getSpace as getSpaceBase,
  getEnvironments as getEnvironmentsBase,
  getEnvironment as getEnvironmentBase,
  getApiKey as getApiKeyBase,
  getPreviewApiKey as getPreviewApiKeyBase,
} from '@jungvonmatt/contentful-client';

export type ContentfulOptions = ContentfulClientOptions;

/**
 * Get Contentful organizations
 */
export const getOrganizations = async (
  options: SetRequired<ContentfulOptions, 'managementToken'>,
) => {
  return getOrganizationsBase(options);
};

/**
 * Get Contentful spaces
 */
export const getSpaces = async (options: SetRequired<ContentfulOptions, 'managementToken'>) => {
  return getSpacesBase(options);
};

/**
 * Get Contentful space
 */
export const getSpace = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId'>,
) => {
  return getSpaceBase(options);
};

/**
 * Get Contentful environments
 */
export const getEnvironments = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId'>,
) => {
  return getEnvironmentsBase(options);
};

/**
 * Get Contentful environment
 */
export const getEnvironment = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId' | 'environmentId'>,
) => {
  return getEnvironmentBase(options);
};

/**
 * Fetch api key from contentful
 */
export const getApiKey = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId'>,
) => {
  return getApiKeyBase(options);
};

/**
 * Fetch preview api key from contentful
 */
export const getPreviewApiKey = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId'>,
) => {
  return getPreviewApiKeyBase(options);
};
