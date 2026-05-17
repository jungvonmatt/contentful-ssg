import {
  ContentTypeRenderer as ContentTypeRendererOriginal,
  type RenderContext,
} from 'cf-content-types-generator';
import { context, v10context } from './context.js';

export class DefaultContentTypeRenderer extends ContentTypeRendererOriginal {
  public createContext(): RenderContext {
    return context;
  }
}

export class V10ContentTypeRenderer extends ContentTypeRendererOriginal {
  public createContext(): RenderContext {
    return v10context;
  }
}
