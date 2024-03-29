import { stringify, parse } from './markdown.js';

describe('Markdown', () => {
  test('Markdown frontmatter', () => {
    const expected = `---
csv: !g.csv /pod/path/to.csv
doc: !g.doc /content/page/about.yaml
json: !g.json /pod/path/to.json
static: !g.static /pod/path/to.img
string: !g.string string.key.reference
url: !g.url /content/page/about.yaml
yaml: !g.yaml /pod/path/to.yaml
unsupported: '!g.unsupported /content/page/about.yaml'
---
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

  test('deep reference', () => {
    const expected = `---
json: !g.json /pod/path/to.json?key.sub_key
yaml: !g.yaml /pod/path/to.yaml?key.sub_key
---
`;

    const value = stringify({
      json: '!g.json /pod/path/to.json?key.sub_key',
      yaml: '!g.yaml /pod/path/to.yaml?key.sub_key',
    });

    expect(value).toEqual(expected);
  });

  test('parse & stringify', () => {
    const expected = `---
json: !g.json /pod/path/to.json?key.sub_key
yaml: !g.yaml /pod/path/to.yaml?key.sub_key
---
CONTENT
`;
    const { data, content } = parse(expected);
    const value = stringify(data, content);

    expect(value).toEqual(expected);
  });
});
