import {
  LocalizedContentTypeRenderer as LocalizedContentTypeRendererOriginal,
  type RenderContext,
} from 'cf-content-types-generator';
import { context } from './context.js';

export class LocalizedContentTypeRenderer extends LocalizedContentTypeRendererOriginal {
  public createContext(): RenderContext {
    return context;
  }
}
