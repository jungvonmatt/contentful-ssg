import {
  TypeGuardRenderer as TypeGuardRendererOriginal,
  RenderContext,
  CFContentType,
} from 'cf-content-types-generator';
import { SourceFile } from 'ts-morph';
import { context, moduleName } from './context.js';

export class TypeGuardRenderer extends TypeGuardRendererOriginal {
  public createContext(): RenderContext {
    return context;
  }

  public render = (contentType: CFContentType, file: SourceFile): void => {
    const entryInterfaceName = moduleName(contentType.sys.id);

    file.addImportDeclaration({
      moduleSpecifier: `./WithContentTypeLink`,
      namedImports: ['WithContentTypeLink'],
      isTypeOnly: true,
    });

    file.addFunction({
      isExported: true,
      name: `is${entryInterfaceName}`,
      returnType: `entry is ${entryInterfaceName}`,
      parameters: [
        {
          name: 'entry',
          type: 'WithContentTypeLink',
        },
      ],
      statements: `return entry.sys.contentType.sys.id === '${contentType.sys.id}'`,
    });

    file.organizeImports({
      ensureNewLineAtEndOfFile: true,
    });

    file.formatText();
  };
}
