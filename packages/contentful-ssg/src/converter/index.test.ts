import { parse, stringify, TYPE_JSON, TYPE_MARKDOWN, TYPE_YAML, TYPE_TOML } from './index.js';

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

describe('Converter', () => {
  test('parse & stringify json', () => {
    const obj = parse(stringify(src, TYPE_JSON), TYPE_JSON);
    expect(obj).toMatchObject(src);
  });

  test('parse & stringify yaml', () => {
    const obj = parse(stringify(src, TYPE_YAML), TYPE_YAML);
    expect(obj).toMatchObject(src);
  });

  test('parse & stringify toml', () => {
    const obj = parse(stringify(src, TYPE_TOML), TYPE_TOML);
    expect(obj).toMatchObject(src);
  });

  test('parse & stringify markdown', () => {
    const obj = parse(stringify(src, TYPE_MARKDOWN), TYPE_MARKDOWN);
    expect(obj).toMatchObject(src);
  });
});
