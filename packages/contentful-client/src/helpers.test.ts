import { describe, it, expect } from 'vitest';
import {
  FIELD_TYPE_LINK,
  LINK_TYPE_ASSET,
  LINK_TYPE_ENTRY,
  getContentTypeId,
  getEnvironmentId,
  getContentId,
  isContentfulObject,
  isLink,
  isAssetLink,
  isEntryLink,
  isAsset,
  isEntry,
  getFieldSettings,
  convertToMap,
} from './helpers.js';

describe('helpers', () => {
  describe('isContentfulObject', () => {
    it('returns true for object with sys property', () => {
      expect(isContentfulObject({ sys: { id: '123' } })).toBe(true);
    });

    it('returns false for plain object without sys', () => {
      expect(isContentfulObject({ id: '123' })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isContentfulObject(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isContentfulObject(undefined)).toBe(false);
    });

    it('returns false for arrays', () => {
      expect(isContentfulObject([{ sys: {} }])).toBe(false);
    });
  });

  describe('isLink', () => {
    it('returns true for link object', () => {
      expect(isLink({ sys: { type: 'Link', linkType: 'Entry', id: '123' } })).toBe(true);
    });

    it('returns false for entry object', () => {
      expect(isLink({ sys: { type: 'Entry', id: '123' } })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isLink(null)).toBe(false);
    });
  });

  describe('isAssetLink', () => {
    it('returns true for asset link', () => {
      expect(isAssetLink({ sys: { type: 'Link', linkType: 'Asset', id: '123' } })).toBe(true);
    });

    it('returns false for entry link', () => {
      expect(isAssetLink({ sys: { type: 'Link', linkType: 'Entry', id: '123' } })).toBe(false);
    });

    it('returns false for non-link object', () => {
      expect(isAssetLink({ sys: { type: 'Asset', id: '123' } })).toBe(false);
    });
  });

  describe('isEntryLink', () => {
    it('returns true for entry link', () => {
      expect(isEntryLink({ sys: { type: 'Link', linkType: 'Entry', id: '123' } })).toBe(true);
    });

    it('returns false for asset link', () => {
      expect(isEntryLink({ sys: { type: 'Link', linkType: 'Asset', id: '123' } })).toBe(false);
    });

    it('returns false for non-contentful object', () => {
      expect(isEntryLink({ id: '123' })).toBe(false);
    });
  });

  describe('isAsset', () => {
    it('returns true for asset object', () => {
      expect(isAsset({ sys: { type: 'Asset', id: '123' } })).toBe(true);
    });

    it('returns false for entry object', () => {
      expect(isAsset({ sys: { type: 'Entry', id: '123' } })).toBe(false);
    });

    it('returns false for asset link', () => {
      expect(isAsset({ sys: { type: 'Link', linkType: 'Asset', id: '123' } })).toBe(false);
    });
  });

  describe('isEntry', () => {
    it('returns true for entry object', () => {
      expect(isEntry({ sys: { type: 'Entry', id: '123' } })).toBe(true);
    });

    it('returns false for asset object', () => {
      expect(isEntry({ sys: { type: 'Asset', id: '123' } })).toBe(false);
    });

    it('returns false for entry link', () => {
      expect(isEntry({ sys: { type: 'Link', linkType: 'Entry', id: '123' } })).toBe(false);
    });
  });

  describe('getContentTypeId', () => {
    it('returns contentType id for regular entry', () => {
      const entry = {
        sys: { type: 'Entry', id: 'e1', contentType: { sys: { id: 'blogPost' } } },
      } as any;
      expect(getContentTypeId(entry)).toBe('blogPost');
    });

    it('returns "asset" for asset nodes', () => {
      const asset = { sys: { type: 'Asset', id: 'a1' } } as any;
      expect(getContentTypeId(asset)).toBe('asset');
    });

    it('returns "unknown" for DeletedEntry', () => {
      const deleted = { sys: { type: 'DeletedEntry', id: 'd1' } } as any;
      expect(getContentTypeId(deleted)).toBe('unknown');
    });

    it('returns "unknown" when contentType is missing', () => {
      const entry = { sys: { type: 'Entry', id: 'e1' } } as any;
      expect(getContentTypeId(entry)).toBe('unknown');
    });
  });

  describe('getEnvironmentId', () => {
    it('returns environment id when present', () => {
      const entry = {
        sys: { type: 'Entry', id: 'e1', environment: { sys: { id: 'master' } } },
      } as any;
      expect(getEnvironmentId(entry)).toBe('master');
    });

    it('returns "unknown" when environment is missing', () => {
      const entry = { sys: { type: 'Entry', id: 'e1' } } as any;
      expect(getEnvironmentId(entry)).toBe('unknown');
    });
  });

  describe('getContentId', () => {
    it('returns sys.id for an entry', () => {
      const entry = { sys: { type: 'Entry', id: 'entry-123' } } as any;
      expect(getContentId(entry)).toBe('entry-123');
    });

    it('returns sys.id for a content type', () => {
      const ct = { sys: { id: 'ct-456' }, fields: [] } as any;
      expect(getContentId(ct)).toBe('ct-456');
    });

    it('returns "unknown" when sys.id is missing', () => {
      const node = { sys: {} } as any;
      expect(getContentId(node)).toBe('unknown');
    });
  });

  describe('getFieldSettings', () => {
    it('converts content types to field settings map', () => {
      const contentTypes = [
        {
          sys: { id: 'blogPost' },
          fields: [
            { id: 'title', type: 'Symbol', name: 'Title' },
            { id: 'body', type: 'RichText', name: 'Body' },
          ],
        },
        {
          sys: { id: 'author' },
          fields: [{ id: 'name', type: 'Symbol', name: 'Name' }],
        },
      ] as any;

      const result = getFieldSettings(contentTypes);

      expect(result).toHaveProperty('blogPost');
      expect(result).toHaveProperty('author');
      expect(result.blogPost.title).toEqual({ id: 'title', type: 'Symbol', name: 'Title' });
      expect(result.blogPost.body).toEqual({ id: 'body', type: 'RichText', name: 'Body' });
      expect(result.author.name).toEqual({ id: 'name', type: 'Symbol', name: 'Name' });
    });

    it('returns empty object for empty array', () => {
      expect(getFieldSettings([])).toEqual({});
    });
  });

  describe('convertToMap', () => {
    it('converts array of nodes to a Map keyed by content id', () => {
      const nodes = [
        { sys: { type: 'Entry', id: 'e1' } },
        { sys: { type: 'Entry', id: 'e2' } },
        { sys: { type: 'Asset', id: 'a1' } },
      ] as any;

      const map = convertToMap(nodes);

      expect(map).toBeInstanceOf(Map);
      expect(map.size).toBe(3);
      expect(map.get('e1')).toBe(nodes[0]);
      expect(map.get('e2')).toBe(nodes[1]);
      expect(map.get('a1')).toBe(nodes[2]);
    });

    it('returns empty Map for empty array', () => {
      const map = convertToMap([]);
      expect(map.size).toBe(0);
    });

    it('returns empty Map when called without arguments', () => {
      const map = convertToMap();
      expect(map.size).toBe(0);
    });
  });
});
