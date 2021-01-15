const yaml = require('js-yaml');

const convert = (obj) => {
  return yaml.dump(obj);
};

module.exports.convert = convert;
