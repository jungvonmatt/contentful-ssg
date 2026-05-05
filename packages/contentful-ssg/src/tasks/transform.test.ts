import { vi } from 'vitest';
import { transform } from './transform.js';
import { getRuntimeContext, getTransformContext, getConfig } from '../__test__/mock.js';

vi.mock('../mapper/map-entry.js', () => ({
  mapEntry: vi.fn().mockResolvedValue({ mocked: true }),
}));

describe('transform', () => {
  test('runs transform task', async () => {
    const config = getConfig({
      resolvedPlugins: [
        {
          transform: (context) => ({
            ...context?.content,
            plugin: 'mocked',
          }),
        },
      ],
    }).config;
    const runtimeContext = getRuntimeContext({ config });
    const transformContext = getTransformContext();
    const value = await transform(transformContext, runtimeContext, config);

    expect(value).toEqual({ plugin: 'mocked', mocked: true });
  });
});