import { CFDefinitionsBuilder, type CFContentType } from 'cf-content-types-generator';
import { moduleName, moduleFieldsName, moduleSkeletonName } from './context.js';
import { DefaultContentTypeRenderer, V10ContentTypeRenderer } from './contentTypeRenderer.js';
import { JsDocRenderer } from './jsDocRenderer.js';
import { LocalizedContentTypeRenderer } from './localizedContentRenderer.js';
import { TypeGuardRenderer, V10TypeGuardRenderer } from './typeGuardRenderer.js';

const contentType: CFContentType = {
  sys: { id: 'page-block', type: 'ContentType' } as CFContentType['sys'],
  name: 'Page Block',
  displayField: 'title',
  description: '',
  fields: [
    {
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      required: true,
      localized: false,
      omitted: false,
      disabled: false,
      validations: [],
    },
  ],
};

describe('renderer/context', () => {
  test('moduleName converts to pascal case', () => {
    expect(moduleName('page-block')).toBe('PageBlock');
    expect(moduleName('hero_section')).toBe('HeroSection');
  });

  test('moduleFieldsName appends Fields', () => {
    expect(moduleFieldsName('page-block')).toBe('PageBlockFields');
  });

  test('moduleSkeletonName appends Skeleton', () => {
    expect(moduleSkeletonName('page-block')).toBe('PageBlockSkeleton');
  });
});

describe('renderer/contentTypeRenderer', () => {
  test('DefaultContentTypeRenderer produces interfaces with PascalCase id', () => {
    const builder = new CFDefinitionsBuilder([new DefaultContentTypeRenderer()]);
    builder.appendType(contentType);
    const out = builder.toString();
    expect(out).toContain('PageBlock');
  });

  test('V10ContentTypeRenderer produces skeleton types', () => {
    const builder = new CFDefinitionsBuilder([new V10ContentTypeRenderer()]);
    builder.appendType(contentType);
    const out = builder.toString();
    expect(out).toContain('PageBlock');
    expect(out).toContain('Skeleton');
  });
});

describe('renderer/jsDocRenderer', () => {
  test('emits JSDoc comments referencing Pascal cased name', () => {
    const builder = new CFDefinitionsBuilder([new V10ContentTypeRenderer(), new JsDocRenderer()]);
    builder.appendType(contentType);
    const out = builder.toString();
    expect(out).toMatch(/\/\*\*[\s\S]*PageBlock/);
  });
});

describe('renderer/localizedContentRenderer', () => {
  test('emits localized type when included', () => {
    const builder = new CFDefinitionsBuilder([
      new V10ContentTypeRenderer(),
      new LocalizedContentTypeRenderer(),
    ]);
    builder.appendType(contentType);
    const out = builder.toString();
    expect(out).toContain('Localized');
  });
});

describe('renderer/typeGuardRenderer', () => {
  test('TypeGuardRenderer emits isPageBlock guard', () => {
    const builder = new CFDefinitionsBuilder([
      new DefaultContentTypeRenderer(),
      new TypeGuardRenderer(),
    ]);
    builder.appendType(contentType);
    const out = builder.toString();
    expect(out).toContain('export function isPageBlock');
    expect(out).toContain("entry.sys.contentType.sys.id === 'page-block'");
  });

  test('V10TypeGuardRenderer emits skeleton-aware guard', () => {
    const builder = new CFDefinitionsBuilder([
      new V10ContentTypeRenderer(),
      new V10TypeGuardRenderer(),
    ]);
    builder.appendType(contentType);
    const out = builder.toString();
    expect(out).toContain('export function isPageBlock');
    expect(out).toContain('ChainModifiers');
  });
});
