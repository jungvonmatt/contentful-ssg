import { stringify, parse } from './json.js';

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

    const string = stringify(src);
    const obj = parse(string);

    expect(obj).toMatchObject(src);
  });
});
