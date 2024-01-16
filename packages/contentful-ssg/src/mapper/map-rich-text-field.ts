import type { Options } from '@contentful/rich-text-html-renderer';
import type {
  Document,
  Mark,
  Node as RichTextNode,
  TopLevelBlock,
} from '@contentful/rich-text-types';
import type { EntryFields, EntrySkeletonType } from 'contentful';
import type { Config, RichTextData, RuntimeContext, TransformContext } from '../types.js';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { mapReferenceField } from './map-reference-field.js';

export const mapRichTextDataNode = (
  node: RichTextData,
  transformContext: TransformContext,
  runtimeContext: RuntimeContext
) => {
  const { target } = node || {};
  if (target) {
    return mapReferenceField(
      target as EntryFields.EntryLink<EntrySkeletonType>,
      transformContext,
      runtimeContext
    );
  }

  return node;
};

export const mapRichTextContentNode = async (
  nodes: TopLevelBlock[],
  transformContext: TransformContext,
  runtimeContext: RuntimeContext
) =>
  Promise.all(
    (nodes || []).map(async (node) => mapRichTextNodes(node, transformContext, runtimeContext))
  );

export const mapRichTextMarks = (nodes: Mark[] = []) => (nodes || []).map((node) => node.type);

export const mapRichTextNodes = async (
  node: RichTextNode,
  transformContext: TransformContext,
  runtimeContext: RuntimeContext
) => {
  const fieldContent: Record<string, any> = {};
  if (typeof node === 'undefined') {
    return;
  }

  for (const [field, subNode] of Object.entries(node)) {
    switch (field) {
      case 'data': {
        // eslint-disable-next-line no-await-in-loop
        fieldContent[field] = await mapRichTextDataNode(
          subNode as RichTextData,
          transformContext,
          runtimeContext
        );
        break;
      }

      case 'content': {
        // eslint-disable-next-line no-await-in-loop
        fieldContent[field] = await mapRichTextContentNode(
          subNode as TopLevelBlock[],
          transformContext,
          runtimeContext
        );
        break;
      }

      case 'marks': {
        fieldContent[field] = mapRichTextMarks(subNode as Mark[]);
        break;
      }

      default:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        fieldContent[field] = subNode;
        break;
    }
  }

  return fieldContent;
};

/**
 * Convert richtextField to html
 * @param {Object} fieldContent Document value from contentful richtext entry
 * @param {Object} options
 * @returns {String|Array}
 */
export const mapRichTextField = (
  fieldContent: Document,
  transformContext: TransformContext,
  runtimeContext: RuntimeContext,
  config: Config
) => {
  const { richTextRenderer = {} } = config || {};

  if (typeof richTextRenderer === 'function') {
    return richTextRenderer(fieldContent, transformContext, runtimeContext);
  }

  if (richTextRenderer === false) {
    return mapRichTextNodes(fieldContent, transformContext, runtimeContext);
  }

  return documentToHtmlString(fieldContent, richTextRenderer as Options);
};
