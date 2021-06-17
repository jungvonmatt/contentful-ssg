const { parse, stringify, JSON, MARKDOWN, YAML, TOML } = require('../lib/converter');

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
    const obj = parse(stringify(src, JSON), JSON);
    expect(obj).toMatchObject(src);
  });

  test('parse & stringify yaml', () => {
    const obj = parse(stringify(src, YAML), YAML);
    expect(obj).toMatchObject(src);
  });

  test('parse & stringify toml', () => {
    const obj = parse(stringify(src, TOML), TOML);
    expect(obj).toMatchObject(src);
  });

  test('parse & stringify markdown', () => {
    const obj = parse(stringify(src, MARKDOWN), MARKDOWN);
    expect(obj).toMatchObject(src);
  });
});
