/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import yaml from 'js-yaml';

const getPredicate = (type: string) => data => typeof data === 'string' && data.startsWith(`${type} `);
const getRepresent = (type: string) => data => typeof data === 'string' ? data.replace(`${type} `, '') : JSON.stringify(data);
const getConstruct = (type: string) => data => typeof data === 'string' ? `${type} ${data}` : `${type} ${typeof data}`;

const growYamlConstructors = ['!g.csv', '!g.doc', '!g.json', '!g.static', '!g.string', '!g.url', '!g.yaml'];

const growYamlTypes = growYamlConstructors.map(
  (type: string) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    new yaml.Type(type, {
      kind: 'scalar',
      predicate: getPredicate(type),
      represent: getRepresent(type),
      construct: getConstruct(type),
    }),
);

/**
 * Convert object to yaml
 * @param {Object} obj Source object
 * @returns {String} Yaml representation of source object
 */
export const stringify = obj => {
  const GROW_SCHEMA = yaml.DEFAULT_SCHEMA.extend(growYamlTypes);
  return yaml.dump(obj, {schema: GROW_SCHEMA});
};

/**
 * Parse yaml to object
 * @param {String} string yaml string
 * @returns {Object} parsed object
 */
export const parse = obj => {
  const GROW_SCHEMA = yaml.DEFAULT_SCHEMA.extend(growYamlTypes);
  return yaml.load(obj, {schema: GROW_SCHEMA});
};
