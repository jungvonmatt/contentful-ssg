import {
  ContentTypeRenderer as ContentTypeRendererOriginal,
  type RenderContext,
} from 'cf-content-types-generator';
import { context } from './context.js';

export class DefaultContentTypeRenderer extends ContentTypeRendererOriginal {
  public createContext(): RenderContext {
    return context;
  }
}
