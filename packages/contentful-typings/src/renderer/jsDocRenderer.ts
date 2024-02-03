import {
  JsDocRenderer as JsDocRendererOriginal,
  type RenderContext,
} from 'cf-content-types-generator';
import { context } from './context.js';

export class JsDocRenderer extends JsDocRendererOriginal {
  public createContext(): RenderContext {
    return context;
  }
}
