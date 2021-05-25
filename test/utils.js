import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { FIELD_TYPE_LINK, LINK_TYPE_ASSET, LINK_TYPE_ENTRY } from '../lib/contentful';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const readFixture = (file) => fs.readJSON(path.join(__dirname, 'fixtures', file));

export const getContent = async () => {
  const assets = await readFixture('assets.json');
  const entries = await readFixture('entries.json');
  const locales = await readFixture('locales.json');
  const contentTypes = await readFixture('content_types.json');

  const [entry] = entries;
  const [asset] = assets;
  const assetLink = {
    sys: {
      id: 'asset-id',
      type: FIELD_TYPE_LINK,
      linkType: LINK_TYPE_ASSET,
    },
  };

  const entryLink = {
    sys: {
      id: 'entry-id',
      type: FIELD_TYPE_LINK,
      linkType: LINK_TYPE_ENTRY,
    },
  };

  return { entries, assets, contentTypes, locales, assetLink, entryLink, entry, asset };
};
