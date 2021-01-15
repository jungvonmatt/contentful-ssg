const path = require('path');
const fs = require('fs-extra');

const readFixture = (file) => fs.readJSON(path.join(__dirname, 'fixtures', file));

const getContent = async () => {
  const assets = await readFixture('assets.json');
  const entries = await readFixture('entries.json');
  const locales = await readFixture('locales.json');
  const contentTypes = await readFixture('content_types.json');

  return { entries, assets, contentTypes, locales };
};

module.exports.getContent = getContent;
module.exports.readFixture = readFixture;
