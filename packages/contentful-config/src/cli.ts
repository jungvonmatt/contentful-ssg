#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { loadContentfulConfig } from './index.js';

const ENV_MAP: Record<string, string> = {
  spaceId: 'CONTENTFUL_SPACE_ID',
  organizationId: 'CONTENTFUL_ORGANIZATION_ID',
  environmentId: 'CONTENTFUL_ENVIRONMENT_ID',
  managementToken: 'CONTENTFUL_MANAGEMENT_TOKEN',
  previewAccessToken: 'CONTENTFUL_PREVIEW_TOKEN',
  accessToken: 'CONTENTFUL_DELIVERY_TOKEN',
  host: 'CONTENTFUL_HOST',
};

const SKIP_KEYS = new Set([
  'organizationId',
  'activeSpaceId',
  'activeEnvironmentId',
  'managementToken',
]);

function usage() {
  console.log(`Usage: contentful-config [options]

Options:
  -n, --name <name>          Config name (default: "contentful")
  -o, --output <file>        Write output to file instead of stdout
  -r, --required <keys>      Required config keys (comma-separated or repeated)
                              Default: spaceId,environmentId,accessToken,previewAccessToken
  -h, --help                 Show this help message`);
}

async function ensureLogin(name: string) {
  const { config } = await loadContentfulConfig(name, { prompts: false });

  if (config.managementToken) {
    return config;
  }

  console.error('No management token found. Starting contentful login…');
  execFileSync('contentful', ['login'], { stdio: 'inherit' });

  // Reload config after login
  const { config: updatedConfig } = await loadContentfulConfig(name, { prompts: false });

  if (!updatedConfig.managementToken) {
    throw new Error('Login failed. No management token found after login.');
  }

  return updatedConfig;
}

async function main() {
  const { values } = parseArgs({
    options: {
      name: { type: 'string', short: 'n', default: 'contentful' },
      output: { type: 'string', short: 'o' },
      required: { type: 'string', short: 'r', multiple: true },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  });

  if (values.help) {
    usage();
    return;
  }

  const { name } = values;

  const defaultRequired = ['spaceId', 'environmentId', 'accessToken', 'previewAccessToken'];
  const required = values.required?.length
    ? values.required.flatMap((v) => v.split(','))
    : defaultRequired;

  await ensureLogin(name);

  const { config } = await loadContentfulConfig(name, {
    required,
    prompt: required,
  });

  const lines: string[] = [];
  for (const [key, value] of Object.entries(config)) {
    if (SKIP_KEYS.has(key) || value === undefined || value === null || value === '') {
      continue;
    }

    const envKey = ENV_MAP[key] ?? `CONTENTFUL_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
    lines.push(`${envKey}=${String(value)}`);
  }

  const output = lines.join('\n') + '\n';

  if (values.output) {
    const filePath = resolve(values.output);
    const newEntries = new Map(
      lines.map((line) => {
        const [key, ...rest] = line.split('=');
        return [key, rest.join('=')];
      }),
    );

    // Read existing file and merge
    const existingLines: string[] = [];
    if (existsSync(filePath)) {
      const existing = readFileSync(filePath, 'utf-8');
      for (const line of existing.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          existingLines.push(line);
          continue;
        }

        const [key] = trimmed.split('=');
        if (newEntries.has(key)) {
          // Replace with new value
          existingLines.push(`${key}=${newEntries.get(key)}`);
          newEntries.delete(key);
        } else {
          existingLines.push(line);
        }
      }
    }

    // Append remaining new entries
    if (newEntries.size > 0) {
      for (const [key, value] of newEntries) {
        existingLines.push(`${key}=${value}`);
      }
    }

    // Ensure trailing newline
    const merged = existingLines.join('\n').replace(/\n*$/, '\n');
    writeFileSync(filePath, merged, 'utf-8');
    console.error(`Config written to ${filePath}`);
  } else {
    process.stdout.write(output);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
