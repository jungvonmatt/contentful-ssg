import {
  TypeGuardRenderer as TypeGuardRendererOriginal,
  V10TypeGuardRenderer as V10TypeGuardRendererOriginal,
  RenderContext,
  CFContentType,
  renderTypeGeneric,
} from 'cf-content-types-generator';
import { SourceFile } from 'ts-morph';
import { context, v10context, moduleName } from './context.js';

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

export class V10TypeGuardRenderer extends V10TypeGuardRendererOriginal {
  public createContext(): RenderContext {
    return v10context;
  }

  public render = (contentType: CFContentType, file: SourceFile): void => {
    const entryInterfaceName = moduleName(contentType.sys.id);

    file.addImportDeclaration({
      moduleSpecifier: `contentful`,
      namedImports: ['ChainModifiers', 'Entry', 'LocaleCode'],
      isTypeOnly: true,
    });

    file.addFunction({
      isExported: true,
      name: renderTypeGeneric(
        `is${entryInterfaceName}`,
        'Modifiers extends ChainModifiers',
        'Locales extends LocaleCode'
      ),
      returnType: `entry is ${renderTypeGeneric(entryInterfaceName, 'Modifiers', 'Locales')}`,
      parameters: [
        {
          name: 'entry',
          type: renderTypeGeneric('Entry', 'EntrySkeletonType', 'Modifiers', 'Locales'),
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
