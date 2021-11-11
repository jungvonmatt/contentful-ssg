/**
 * Convert object to json
 * @param {Object} obj Source object
 * @returns {String} JSON representation of source object
 */
export const stringify = (obj: any) => JSON.stringify(obj, null, '  ');

/**
 * Parse json to object
 * @param {String} string JSON string
 * @returns {Object} parsed object
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const parse = (string: string) => JSON.parse(string);

