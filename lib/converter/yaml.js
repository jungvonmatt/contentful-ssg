import yaml from 'js-yaml';

const getPredicate = (type) => (data) => typeof data === 'string' && data.startsWith(`${type} `);
const getRepresent = (type) => (data) => data.replace(`${type} `, '');

const growYamlConstructors = ['!g.csv', '!g.doc', '!g.json', '!g.static', '!g.string', '!g.url', '!g.yaml'];

const growYamlTypes = growYamlConstructors.map(
  (type) =>
    new yaml.Type(type, {
      kind: 'scalar',
      predicate: getPredicate(type),
      represent: getRepresent(type),
    })
);

/**
 * Convert object to yaml
 * @param {Object} obj Source object
 * @returns {String} Yaml representation of source object
 */
export const convert = (object) => {
  const GROW_SCHEMA = yaml.DEFAULT_SCHEMA.extend(growYamlTypes);
  return yaml.dump(object, { schema: GROW_SCHEMA });
};
