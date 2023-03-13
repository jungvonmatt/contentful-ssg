import {
  DefaultContentTypeRenderer as DefaultContentTypeRendererOriginal,
  RenderContext,
} from 'cf-content-types-generator';
import { context } from './context.js';

export class DefaultContentTypeRenderer extends DefaultContentTypeRendererOriginal {
  public createContext(): RenderContext {
    return context;
  }
}
