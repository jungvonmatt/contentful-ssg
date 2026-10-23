import {
  ContentTypeRenderer as ContentTypeRendererBase,
  type RenderContext,
} from 'cf-content-types-generator';
import { context } from './context.js';

export class LocalizedContentTypeRenderer extends ContentTypeRendererBase {
  public createContext(): RenderContext {
    return context;
  }
}
