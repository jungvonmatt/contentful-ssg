import { stringify, parse } from './toml.js';

describe('TOML', () => {
  test('grow schema', () => {
    const expected = `csv = "!g.csv /pod/path/to.csv"
doc = "!g.doc /content/page/about.yaml"
json = "!g.json /pod/path/to.json"
static = "!g.static /pod/path/to.img"
string = "!g.string string.key.reference"
url = "!g.url /content/page/about.yaml"
yaml = "!g.yaml /pod/path/to.yaml"
unsupported = "!g.unsupported /content/page/about.yaml"
`;

    const value = stringify({
      csv: '!g.csv /pod/path/to.csv',
      doc: '!g.doc /content/page/about.yaml',
      json: '!g.json /pod/path/to.json',
      static: '!g.static /pod/path/to.img',
      string: '!g.string string.key.reference',
      url: '!g.url /content/page/about.yaml',
      yaml: '!g.yaml /pod/path/to.yaml',
      unsupported: '!g.unsupported /content/page/about.yaml',
    });

    expect(value).toEqual(expected);
  });

  test('nested object', () => {
    const source = {
      languages: {
        en: {
          baseURL: 'https://example.com',
          languageName: 'English',
          title: 'In English',
          weight: 2,
          nested: {
            test: 'X',
          },
        },
        fr: {
          baseURL: 'https://example.fr',
          languageName: 'Français',
          title: 'En Français',
          weight: 1,
        },
      },
    };

    const expected = `[languages.en]
baseURL = "https://example.com"
languageName = "English"
title = "In English"
weight = 2

  [languages.en.nested]
  test = "X"

[languages.fr]
baseURL = "https://example.fr"
languageName = "Français"
title = "En Français"
weight = 1
`;
    const obj = parse(expected);
    expect(obj).toMatchObject(source);

    const value = stringify(source);
    expect(value).toEqual(expected);

    const value2 = stringify(parse(expected));
    expect(value2).toEqual(expected);
  });
});
