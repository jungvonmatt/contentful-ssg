import { homedir } from 'node-homedir';
import { packageUp } from 'package-up';
import { dirname } from 'pathe';
import type { LoadConfigOptions } from '@jungvonmatt/config-loader';
import {
  type ContentfulOptions,
  getApiKey,
  getEnvironments,
  getPreviewApiKey,
  getSpaces,
} from './contentful.js';

export const getPromts = (data: Partial<ContentfulOptions>) => {
  return [
    {
      type: 'input',
      name: 'managementToken',
      message: 'Management Token',
      initial: data.managementToken,
    },
    {
      type: 'select',
      name: 'spaceId',
      message: 'Space ID',
      choices: async (answers: Partial<ContentfulOptions>) => {
        const token = data.managementToken || answers.managementToken;
        if (token) {
          const spaces = await getSpaces({ accessToken: token });
          return spaces.map((space) => ({
            name: `${space.name} (${space.sys.id})`,
            value: space.sys.id,
          }));
        }

        return [];
      },
      initial: data?.spaceId ?? data?.activeSpaceId,
    },
    {
      type: 'select',
      name: 'environmentId',
      message: 'Environment ID',
      choices: async (answers: Partial<ContentfulOptions>) => {
        const token = data.managementToken || answers.managementToken;
        const spaceId = answers.spaceId || data.spaceId;
        if (token && spaceId) {
          const environments = await getEnvironments({ accessToken: token, spaceId });
          return environments.map((environment) => environment.sys.id);
        }

        return [];
      },
      initial: data?.environmentId || data?.activeEnvironmentId,
    },
    {
      type: 'input',
      name: 'accessToken',
      message: 'Content Delivery API - access token',
      skip(answers: Partial<ContentfulOptions>) {
        return !answers.spaceId && !data.spaceId;
      },
      initial: async (answers: Partial<ContentfulOptions>) => {
        if (data.accessToken) {
          return typeof data.accessToken === 'function' ? data.accessToken() : data.accessToken;
        }

        const token = data.managementToken || answers.managementToken;
        const spaceId = answers.spaceId || data.spaceId;
        if (token && spaceId) {
          return getApiKey({ accessToken: token, spaceId });
        }
      },
    },
    {
      type: 'input',
      name: 'previewAccessToken',
      message: 'Content Preview API - access token',
      skip(answers: Partial<ContentfulOptions>) {
        return !answers.spaceId && !data.spaceId;
      },
      initial: async (answers: Partial<ContentfulOptions>) => {
        if (data.previewAccessToken) {
          return typeof data.previewAccessToken === 'function'
            ? data.previewAccessToken()
            : data.previewAccessToken;
        }

        const token = data.managementToken || answers.managementToken;
        const spaceId = answers.spaceId || data.spaceId;
        if (token && spaceId) {
          return getPreviewApiKey({ accessToken: token, spaceId });
        }
      },
    },
  ];
};

type LoadContentfulConfigOptions<T extends Record<string, any> = ContentfulOptions> = Omit<
  LoadConfigOptions<T>,
  'name'
>;

const mergePrompts = <T extends Record<string, any>>(options: LoadContentfulConfigOptions<T>) => {
  const prompts = options.prompts;
  if (prompts === false) {
    return false;
  }

  const result: LoadContentfulConfigOptions<T>['prompts'] = (data) => {
    const defaultPrompts = getPromts(data);
    const optionPrompts = Array.isArray(prompts) ? prompts : (prompts?.(data) ?? undefined);

    if (Array.isArray(optionPrompts)) {
      return [...defaultPrompts, ...optionPrompts];
    }

    return [...defaultPrompts];
  };

  return result;
};

export const loadContentfulConfig = async <T extends Record<string, any> = ContentfulOptions>(
  name: string,
  options: LoadContentfulConfigOptions<T> = {},
) => {
  const { loadConfig } = await import('@jungvonmatt/config-loader');

  // Load global contentful config stored in a .contentfulrc.json file in the home directory
  // https://www.contentful.com/developers/docs/tutorials/cli/config-management/
  const contentfulCliOptions = await loadConfig<T>({
    name: 'contentful',
    cwd: homedir(),
  });

  const packageJson = await packageUp();
  const packageDir = packageJson ? dirname(packageJson) : undefined;

  const result = await loadConfig<T>({
    ...options,
    cwd: options?.cwd || packageDir || process.cwd(),
    name,
    defaultConfig: {
      environmentId: 'master',
      host: 'api.contentful.com',
      ...contentfulCliOptions.config,
      ...options?.defaultConfig,
    },
    envMap: {
      CONTENTFUL_SPACE_ID: 'spaceId',
      CONTENTFUL_ENVIRONMENT_ID: 'environmentId',
      CONTENTFUL_MANAGEMENT_TOKEN: 'managementToken',
      CONTENTFUL_PREVIEW_TOKEN: 'previewAccessToken',
      CONTENTFUL_PREVIEW_ACCESS_TOKEN: 'previewAccessToken',
      CONTENTFUL_DELIVERY_TOKEN: 'accessToken',
      CONTENTFUL_DELIVERY_ACCESS_TOKEN: 'accessToken',
      CONTENTFUL_HOST: 'host',
      ...options?.envMap,
    } as const,
    prompts: mergePrompts<T>(options),
  });

  return { ...result, config: result.config as T };
};
