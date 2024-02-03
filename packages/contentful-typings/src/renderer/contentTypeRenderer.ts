import {
  DefaultContentTypeRenderer as DefaultContentTypeRendererOriginal,
  V10ContentTypeRenderer as V10ContentTypeRendererOriginal,
  type RenderContext,
} from 'cf-content-types-generator';
import { context, v10context } from './context.js';

export class DefaultContentTypeRenderer extends DefaultContentTypeRendererOriginal {
  public createContext(): RenderContext {
    return context;
  }
}

export class V10ContentTypeRenderer extends V10ContentTypeRendererOriginal {
  public createContext(): RenderContext {
    return v10context;
  }
}
