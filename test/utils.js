const path = require('path');
const fs = require('fs-extra');
const { FIELD_TYPE_LINK, LINK_TYPE_ENTRY, LINK_TYPE_ASSET } = require('../lib/contentful');

const readFixture = (file) => fs.readJSON(path.join(__dirname, 'fixtures', file));

const getContent = async () => {
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

module.exports.getContent = getContent;
module.exports.readFixture = readFixture;
