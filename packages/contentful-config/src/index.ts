import { homedir } from 'node-homedir';
import { packageUp } from 'package-up';
import { dirname } from 'pathe';
import type { LoadConfigOptions, ResolvedConfig } from '@jungvonmatt/config-loader';
import {
  type ContentfulOptions,
  getApiKey,
  getEnvironments,
  getOrganizations,
  getPreviewApiKey,
  getSpaces,
} from './contentful.js';

type EnquirerContext<T extends Record<string, any> = ContentfulOptions> = {
  enquirer: {
    options: Record<string, unknown>;
    answers: Partial<T>;
  };
  choices: Array<{
    message?: string;
    name: string;
    value?: string;
  }>;
};

export type { ResolvedConfig } from '@jungvonmatt/config-loader';

export const getPrompts = (data: Partial<ContentfulOptions> = {}) => {
  return [
    {
      type: 'input',
      name: 'managementToken',
      message: 'Management Token',
      initial: data.managementToken,
    },
    {
      type: 'select',
      name: 'host',
      message: 'API Base URL',
      initial: data.host,
      choices: ['api.contentful.com', 'api.eu.contentful.com'],
    },
    {
      type: 'select',
      name: 'organizationId',
      message: 'Organization',
      async choices(this: EnquirerContext) {
        const answers = this?.enquirer?.answers;
        const managementToken = answers?.managementToken || data?.managementToken;
        const host = answers?.host || data?.host;
        if (managementToken) {
          const organizations = await getOrganizations({ managementToken, host });
          return organizations.map((organization) => ({
            message: `${organization.name}`,
            name: organization.sys.id,
            value: organization.sys.id,
          }));
        }

        return [];
      },
      async skip(this: EnquirerContext) {
        const answers = this?.enquirer?.answers;
        const managementToken = answers?.managementToken || data?.managementToken;
        const host = answers?.host || data?.host;
        if (managementToken) {
          const organizations = await getOrganizations({ managementToken, host });
          return organizations.length <= 1;
        }

        return true;
      },
      async initial(this: EnquirerContext) {
        return this.choices?.[0]?.value;
      },
      format(this: EnquirerContext, value: string) {
        const choice = this.choices?.find((choice) => choice.value === value);
        const name = choice?.message || value;
        return name;
      },
    },
    {
      type: 'select',
      name: 'spaceId',
      message: 'Space ID',
      async choices(this: EnquirerContext) {
        const answers = this?.enquirer?.answers;
        const managementToken = answers?.managementToken || data?.managementToken;
        const host = answers?.host || data?.host;
        if (managementToken) {
          const spaces = await getSpaces({ managementToken, host });
          return spaces
            .filter(
              (space) =>
                !answers?.organizationId ||
                space.sys.organization.sys.id === answers?.organizationId,
            )
            .map((space) => ({
              message: `${space.name} (${space.sys.id})`,
              name: space.sys.id,
              value: space.sys.id,
            }));
        }

        return [];
      },
      initial: data?.spaceId ?? data?.activeSpaceId,
      format(this: EnquirerContext, value: string) {
        const choice = this.choices?.find((choice) => choice.value === value);
        const name = choice?.message || value;
        return name;
      },
    },
    {
      type: 'select',
      name: 'environmentId',
      message: 'Environment ID',
      async choices(this: EnquirerContext) {
        const answers = this?.enquirer?.answers;
        const managementToken = answers?.managementToken || data?.managementToken;
        const host = answers?.host || data?.host;
        const spaceId = answers?.spaceId || data.spaceId;

        if (managementToken && spaceId) {
          const environments = await getEnvironments({ managementToken, spaceId, host });
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
      skip(this: EnquirerContext) {
        const answers = this?.enquirer?.answers;
        return !answers?.spaceId && !data.spaceId;
      },
      async initial(this: EnquirerContext) {
        const answers = this?.enquirer?.answers;
        if (data.accessToken) {
          return typeof data.accessToken === 'function' ? data.accessToken() : data.accessToken;
        }

        const managementToken = answers?.managementToken || data?.managementToken;
        const host = answers?.host || data?.host;
        const spaceId = answers?.spaceId || data.spaceId;
        if (managementToken && spaceId) {
          return getApiKey({ managementToken, spaceId, host });
        }
      },
    },
    {
      type: 'input',
      name: 'previewAccessToken',
      message: 'Content Preview API - access token',
      skip(this: EnquirerContext) {
        const answers = this?.enquirer?.answers;
        return !answers?.spaceId && !data.spaceId;
      },
      async initial(this: EnquirerContext) {
        const answers = this?.enquirer?.answers;
        if (data.previewAccessToken) {
          return typeof data.previewAccessToken === 'function'
            ? data.previewAccessToken()
            : data.previewAccessToken;
        }

        const managementToken = answers?.managementToken || data?.managementToken;
        const host = answers?.host || data?.host;
        const spaceId = answers?.spaceId || data.spaceId;
        if (managementToken && spaceId) {
          return getPreviewApiKey({ managementToken, spaceId, host });
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
  const { prompts } = options;
  if (prompts === false) {
    return false;
  }

  const result: LoadContentfulConfigOptions<T>['prompts'] = (data) => {
    const defaultPrompts = getPrompts(data);
    const optionPrompts = Array.isArray(prompts) ? prompts : (prompts?.(data) ?? undefined);

    if (Array.isArray(optionPrompts)) {
      // Add all default prompts which are not present in prompts passed via options
      return [
        ...defaultPrompts.filter((dp) => !optionPrompts.some((op) => op.name === dp.name)),
        ...optionPrompts,
      ];
    }

    return [...defaultPrompts];
  };

  return result;
};

export const loadContentfulConfig = async <T extends Record<string, any> = ContentfulOptions>(
  name: string,
  options: LoadContentfulConfigOptions<T> = {},
): Promise<ResolvedConfig<T>> => {
  const { loadConfig } = await import('@jungvonmatt/config-loader');

  // Load global contentful config stored in a .contentfulrc.json file in the home directory
  // https://www.contentful.com/developers/docs/tutorials/cli/config-management/
  const contentfulCliOptions = await loadConfig<T>({
    name: 'contentful',
    cwd: homedir(),
  });

  const packageJson = await packageUp();
  const packageDir = packageJson ? dirname(packageJson) : undefined;

  type RequiredKey = Exclude<keyof T, number | symbol>;
  const required = async (data: T) => {
    const originalRequired =
      typeof options.required === 'function' ? await options.required(data) : options.required;

    // When we already have a spaceId or spaceId is not required we simply return the original required option
    if ('spaceId' in data || !originalRequired?.includes('spaceId' as RequiredKey)) {
      return originalRequired;
    }

    // Otherwise we add organizationId to make the spaceId selection less cluttered
    const index = originalRequired?.indexOf('spaceId' as RequiredKey) ?? -1;
    return [
      ...originalRequired.slice(0, index),
      'organizationId',
      ...originalRequired.slice(index),
    ] as RequiredKey[];
  };

  const result = await loadConfig<T>({
    ...options,
    required,
    cwd: options?.cwd || packageDir || process.cwd(),
    name,
    defaults: {
      environmentId: 'master',
      host: 'api.contentful.com',
      ...contentfulCliOptions.config,
      ...options?.defaults,
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
