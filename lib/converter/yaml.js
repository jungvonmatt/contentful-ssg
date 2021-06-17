const yaml = require('js-yaml');

const getPredicate = (type) => (data) => typeof data === 'string' && data.startsWith(`${type} `);
const getRepresent = (type) => (data) => data.replace(`${type} `, '');
const getConstruct = (type) => (data) => `${type} ${data}`;

const growYamlConstructors = ['!g.csv', '!g.doc', '!g.json', '!g.static', '!g.string', '!g.url', '!g.yaml'];

const growYamlTypes = growYamlConstructors.map(
  (type) =>
    new yaml.Type(type, {
      kind: 'scalar',
      predicate: getPredicate(type),
      represent: getRepresent(type),
      construct: getConstruct(type),
    })
);

/**
 * Convert object to yaml
 * @param {Object} obj Source object
 * @returns {String} Yaml representation of source object
 */
const stringifyYaml = (obj) => {
  const GROW_SCHEMA = yaml.DEFAULT_SCHEMA.extend(growYamlTypes);
  return yaml.dump(obj, { schema: GROW_SCHEMA });
};

/**
 * parse yaml to object
 * @param {String} string yaml string
 * @returns {Object} parsed object
 */
const parseYaml = (obj) => {
  const GROW_SCHEMA = yaml.DEFAULT_SCHEMA.extend(growYamlTypes);
  return yaml.load(obj, { schema: GROW_SCHEMA });
};

module.exports.stringifyYaml = stringifyYaml;
module.exports.parseYaml = parseYaml;
