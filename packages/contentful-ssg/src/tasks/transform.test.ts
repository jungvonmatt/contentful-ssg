import { transform } from './transform.js';
import { getRuntimeContext, getTransformContext, getConfig } from '../__test__/mock.js';

jest.mock('../mapper/map-entry.js', () => ({
  mapEntry: jest.fn().mockResolvedValue({ mocked: true }),
}));

describe('transform', () => {
  test('runs transform task', async () => {
    const config = getConfig({
      resolvedPlugins: [
        {
          transform: (context) => ({
            ...(context?.content ?? {}),
            plugin: 'mocked',
          }),
        },
      ],
    });
    const runtimeContext = getRuntimeContext({ config });
    const transformContext = getTransformContext();
    const value = await transform(transformContext, runtimeContext, config);

    expect(value).toEqual({ plugin: 'mocked', mocked: true });
  });
});
