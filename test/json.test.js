const { stringifyJson, parseJson } = require('../lib/converter/json');

describe('JSON', () => {
  test('parse & stringify', () => {
    const src = {
      languages: {
        en: {
          contentDir: 'content/english',
          languageName: 'English',
          weight: 10,
        },
        fr: {
          contentDir: 'content/french',
          languageName: 'Français',
          weight: 20,
        },
      },
    };

    const string = stringifyJson(src);
    const obj = parseJson(string);

    expect(obj).toMatchObject(src);
  });
});
