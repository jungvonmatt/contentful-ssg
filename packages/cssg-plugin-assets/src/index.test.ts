import { mapAssetLink } from '@jungvonmatt/contentful-ssg/mapper/map-reference-field';
import { localizeEntry } from '@jungvonmatt/contentful-ssg/tasks/localize';
import {
  getContent,
  getRuntimeContext,
  getTransformContext,
} from '@jungvonmatt/contentful-ssg/__test__/mock';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { existsSync } from 'fs';
import { remove } from 'fs-extra';
import got from 'got';
import { basename, join } from 'path';
import plugin, { ProcessedImage, ProcessedSvg, ProcessedVideo } from './index.js';

jest.mock('got', () =>
  jest.fn().mockImplementation(() => {
    return {
      buffer: () =>
        Buffer.from(
          `<svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><g><circle cx="15" cy="15" r="13.85"/></g></svg>`
        ),
    };
  })
);

jest.mock('@ffmpeg/ffmpeg', () => {
  const createFFmpeg = jest.fn().mockReturnValue({
    FS: jest.fn().mockReturnValue('content'),
    run: jest.fn().mockResolvedValue(true),
    load: jest.fn().mockResolvedValue(true),
    isLoaded: jest.fn().mockReturnValue(false),
  });
  const fetchFile = jest.fn().mockResolvedValue(true);

  return {
    createFFmpeg,
    fetchFile,
  };
});

const mockedGot = got as jest.MockedFunction<typeof got>;
const mockedCreateFFmpeg = createFFmpeg as jest.MockedFunction<typeof createFFmpeg>;
const mockedFetchFile = fetchFile as jest.MockedFunction<typeof fetchFile>;

const getMockData = async (type) => {
  const content = await getContent();
  const runtimeContext = getRuntimeContext();
  const entry = localizeEntry(content.entry, 'en-US', runtimeContext.data);
  const asset = localizeEntry(
    content.assets.find((asset) => asset?.fields?.file?.['en-US']?.contentType === type),
    'en-US',
    runtimeContext.data
  );

  const transformContext = getTransformContext({
    entry,
    asset,
    fieldId: 'media',
  });

  const defaultValue = mapAssetLink(transformContext);

  return { transformContext, runtimeContext, defaultValue };
};

describe('cssg-plugin-assets', () => {
  afterEach(async () => {
    const cacheDir = join(process.cwd(), '.cache');
    if (existsSync(cacheDir)) {
      await remove(cacheDir);
    }
  });

  it('mapAssetLink (basic)', async () => {
    const { transformContext, runtimeContext, defaultValue } = await getMockData('image/jpeg');
    const instance = plugin();
    const result = (await instance.mapAssetLink(
      transformContext,
      runtimeContext,
      defaultValue
    )) as ProcessedImage;

    // All fields from default value should be present
    expect(result).toMatchObject(defaultValue);
    expect(result?.derivatives?.original?.srcsets?.length).toBe(3);

    expect(result?.derivatives?.original?.srcsets?.[0]?.type).toBe('image/avif');
    expect(result?.derivatives?.original?.srcsets?.[1]?.type).toBe('image/webp');
    expect(result?.derivatives?.original?.srcsets?.[2]?.type).toBe('image/jpeg');
  });

  it('mapAssetLink (ratios)', async () => {
    const { transformContext, runtimeContext, defaultValue } = await getMockData('image/jpeg');
    const instance = plugin({
      ratios: {
        default: { square: 1 / 1, landscape: 16 / 9, portrait: 3 / 4, rectangle: 4 / 3 },
      },
    });
    const result = (await instance.mapAssetLink(
      transformContext,
      runtimeContext,
      defaultValue
    )) as ProcessedImage;

    const original = result?.derivatives?.original;
    const square = result?.derivatives?.square;
    const landscape = result?.derivatives?.landscape;
    const portrait = result?.derivatives?.portrait;
    const rectangle = result?.derivatives?.rectangle;

    expect(original.width).toBe(1920);
    expect(original.height).toBe(1080);
    expect(original.sizes).toBe('(max-width: 1920px) 100vw, 1920px');
    expect(original.src).toMatch(/[?&]w=1920(&|$)/);
    expect(original.src).not.toMatch(/[?&]h=/);

    expect(square.width).toBe(1080);
    expect(square.height).toBe(1080);
    expect(square.sizes).toBe('(max-width: 1080px) 100vw, 1080px');
    expect(square.src).toMatch(/[?&]w=1080(&|$)/);
    expect(square.src).toMatch(/[?&]h=1080(&|$)/);

    expect(landscape.width).toBe(1920);
    expect(landscape.height).toBe(1080);
    expect(landscape.sizes).toBe('(max-width: 1920px) 100vw, 1920px');
    expect(landscape.src).toMatch(/[?&]w=1920(&|$)/);
    expect(landscape.src).toMatch(/[?&]h=1080(&|$)/);

    expect(portrait.width).toBe(810);
    expect(portrait.height).toBe(1080);
    expect(portrait.sizes).toBe('(max-width: 810px) 100vw, 810px');
    expect(portrait.src).toMatch(/[?&]w=810(&|$)/);
    expect(portrait.src).toMatch(/[?&]h=1080(&|$)/);

    expect(rectangle.width).toBe(1440);
    expect(rectangle.height).toBe(1080);
    expect(rectangle.sizes).toBe('(max-width: 1440px) 100vw, 1440px');
    expect(rectangle.src).toMatch(/[?&]w=1440(&|$)/);
    expect(rectangle.src).toMatch(/[?&]h=1080(&|$)/);
  });

  it('mapAssetLink (sizes)', async () => {
    const { transformContext, runtimeContext, defaultValue } = await getMockData('image/jpeg');
    const extectedMatcher = [/1920w$/, /1280w$/, /10w$/];
    const instance = plugin({
      sizes: [3600, 1980, 1280, 10],
    });
    const result = (await instance.mapAssetLink(
      transformContext,
      runtimeContext,
      defaultValue
    )) as ProcessedImage;

    const image = result?.derivatives?.original;

    expect(image?.width).toBe(1920);

    const [source] = image?.srcsets ?? [];
    const srcset = source?.srcset?.split(',') ?? [];
    expect(srcset.length).toBe(3);
    srcset.forEach((src, i) => expect(src).toMatch(extectedMatcher[i]));
  });

  it('mapAssetLink (formats)', async () => {
    const { transformContext, runtimeContext, defaultValue } = await getMockData('image/jpeg');
    const extraTypes = ['image/avif', 'image/webp', 'image/png'];

    const instance = plugin({ extraTypes });
    const result = (await instance.mapAssetLink(
      transformContext,
      runtimeContext,
      defaultValue
    )) as ProcessedImage;

    const image = result?.derivatives?.original;

    expect(image?.srcsets?.length ?? []).toBe(4);

    extraTypes.forEach((type, i) => expect(image.srcsets[i].type).toBe(type));
    expect(image.srcsets[extraTypes.length].type).toBe('image/jpeg');
  });

  it('mapAssetLink (download)', async () => {
    const { transformContext, runtimeContext, defaultValue } = await getMockData('image/jpeg');
    const assetFolder = join(process.cwd(), 'test-public');
    const cacheFolder = join(process.cwd(), 'test-cache');
    const instance = plugin({
      assetBase: '/test-temp',
      assetFolder,
      cacheFolder,
      download: true,
    });
    const result = (await instance.mapAssetLink(
      transformContext,
      runtimeContext,
      defaultValue
    )) as ProcessedImage;
    await instance.after();

    const image = result?.derivatives?.original;

    expect(image?.src).toMatch(/^\/test-temp/);

    image.srcsets.forEach((source) =>
      source.srcset.split(',').forEach((src) => {
        expect(src.trim()).toMatch(/^\/test-temp/);
        const [file] = src.split(' ');
        expect(existsSync(join(assetFolder, file))).toBe(true);
        expect(existsSync(join(cacheFolder, file))).toBe(true);
      })
    );

    await remove(cacheFolder);
    await remove(assetFolder);
  });

  it('mapAssetLink (generatePoster)', async () => {
    const { transformContext, runtimeContext, defaultValue } = await getMockData('video/mp4');
    const assetFolder = join(process.cwd(), 'test-public');
    const cacheFolder = join(process.cwd(), 'test-cache');
    const instance = plugin({
      assetBase: '/test-temp',
      assetFolder,
      cacheFolder,
      generatePosterImages: true,
    });
    const result = (await instance.mapAssetLink(
      transformContext,
      runtimeContext,
      defaultValue
    )) as ProcessedVideo;
    await instance.after();

    const fileName = basename(`${result.src.replace(/\.\w+$/, '')}-poster.jpg`);

    expect(result.mimeType).toEqual('video/mp4');
    expect(basename(result.poster)).toEqual(fileName);

    expect(existsSync(join(cacheFolder, result.poster))).toBe(true);
    expect(existsSync(join(assetFolder, result.poster))).toBe(true);

    await remove(cacheFolder);
    await remove(assetFolder);
  });

  it('mapAssetLink (generatePoster with parameters)', async () => {
    const { transformContext, runtimeContext, defaultValue } = await getMockData('video/mp4');
    const assetFolder = join(process.cwd(), 'test-public');
    const cacheFolder = join(process.cwd(), 'test-cache');
    const instance = plugin({
      assetBase: '/test-temp',
      assetFolder,
      cacheFolder,
      generatePosterImages: true,
      posterScale: '300:200',
      posterPosition: '00:02',
    });

    const result = (await instance.mapAssetLink(
      transformContext,
      runtimeContext,
      defaultValue
    )) as ProcessedVideo;
    await instance.after();

    const fileName = basename(`${result.src.replace(/\.\w+$/, '')}-poster.jpg`);

    expect(result.mimeType).toEqual('video/mp4');
    expect(basename(result.poster)).toEqual(fileName);

    expect(existsSync(join(cacheFolder, result.poster))).toBe(true);
    expect(existsSync(join(assetFolder, result.poster))).toBe(true);

    const mock = mockedCreateFFmpeg.getMockImplementation()();
    expect(mock.run).toHaveBeenCalledWith(
      '-i',
      'test-temp-3NIRCubNZhxuGRRca3zQMo-city-jimmy.mp4',
      '-ss',
      '00:02',
      '-vf',
      'scale=300:200',
      '-vframes',
      '1',
      '-f',
      'image2',
      'test-temp-3NIRCubNZhxuGRRca3zQMo-city-jimmy-poster.jpg'
    );

    await remove(cacheFolder);
    await remove(assetFolder);
  });

  it('mapAssetLink (download with HUGO_BASEURL)', async () => {
    process.env.HUGO_BASEURL = '/hugo-base';
    const { transformContext, runtimeContext, defaultValue } = await getMockData('image/jpeg');
    const assetFolder = join(process.cwd(), 'test-public');
    const cacheFolder = join(process.cwd(), 'test-cache');
    const instance = plugin({
      assetBase: '/test-temp',
      assetFolder,
      cacheFolder,
      download: true,
    });
    const result = (await instance.mapAssetLink(
      transformContext,
      runtimeContext,
      defaultValue
    )) as ProcessedImage;

    const image = result?.derivatives?.original;

    expect(image?.src ?? '').toMatch(/^\/hugo-base\/test-temp/);

    image.srcsets.forEach((source) =>
      source.srcset.split(',').forEach((src) => {
        expect(src.trim()).toMatch(/^\/hugo-base\/test-temp/);
      })
    );
  });

  it('mapAssetLink (empty asset)', async () => {
    const { transformContext, runtimeContext, defaultValue } = await getMockData('image/svg+xml');

    const instance = plugin();
    const result = (await instance.mapAssetLink(
      { ...transformContext, asset: null },
      runtimeContext,
      defaultValue
    )) as ProcessedSvg;

    expect(result.mimeType).toBe('image/svg+xml');
    expect(result?.source).toEqual(undefined);
  });

  it('mapAssetLink (svg)', async () => {
    const { transformContext, runtimeContext, defaultValue } = await getMockData('image/svg+xml');
    const instance = plugin();
    const result = (await instance.mapAssetLink(
      transformContext,
      runtimeContext,
      defaultValue
    )) as ProcessedSvg;

    expect(result.mimeType).toBe('image/svg+xml');
    expect(result?.source ?? '').toMatch(/^<svg.*<\/svg>/gm);
  });

  it('mapAssetLink (cache)', async () => {
    mockedGot.mockClear();
    const { transformContext, runtimeContext, defaultValue } = await getMockData('image/svg+xml');
    const instance = plugin();
    const result = await instance.mapAssetLink(transformContext, runtimeContext, defaultValue);
    const resultFromCache = await instance.mapAssetLink(
      transformContext,
      runtimeContext,
      defaultValue
    );

    expect(result).toMatchObject(resultFromCache);
    expect(got).toHaveBeenCalledTimes(1);
  });
});
