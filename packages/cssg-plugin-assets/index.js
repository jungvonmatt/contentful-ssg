import { resolve, extname as pathExtname, basename, dirname, join } from 'path';
import { existsSync, promises } from 'fs';
import mkdirp from 'mkdirp';
import got from 'got';
import { SingleBar, Presets } from 'cli-progress';
import { optimize } from 'svgo';

// Max width that can be handled by the contentful image api
const contentfulMaxWidth = 4000;
// Some image formats (avif) have an additional limitation on the megapixel size
const maxMegaPixels = {
  avif: 9,
};

/**
 *
 * @param {*} options
 * @returns
 */
const processOptions = (options = {}) => {
  const defaultOptions = {
    sizes: [1920, 1280, 640, 320],
    rootDir: process.cwd(),
    assetBase: '/assets/cf',
    assetFolder: 'static',
    cacheFolder: '.cache',
    extraTypes: ['image/avif', 'image/webp'],
    quality: 80,
    ratios: {},
    focusAreas: {},
  };

  const { rootDir, cacheFolder, assetFolder } = { ...defaultOptions, ...options };

  return {
    ...defaultOptions,
    rootDir,
    assetFolder,
    cacheFolder,
    cachePath: resolve(rootDir, cacheFolder),
    assetPath: resolve(rootDir, assetFolder),
    ...options,
  };
};

export default (pluginOptions) => {
  const queue = new Set();
  const options = processOptions(pluginOptions);

  const getLocalPath = (src, sys, addToQueue = true) => {
    const url = new URL(src);
    const { updatedAt } = sys || {};
    const { searchParams, pathname } = url;
    const extname = pathExtname(pathname);
    const filename = basename(pathname, extname);
    const params = new URLSearchParams(searchParams);
    const { w, h, f, fm = extname.substring(1) } = Object.fromEntries(params.entries());

    const [, , assetId] = dirname(pathname).split('/');

    const file = [filename, w ? `-w${w}` : '', h ? `-h${h}` : '', f ? `-${f}` : '', '.', fm]
      .filter((v) => v)
      .join('');

    const queueEntry = {
      src,
      timestamp: updatedAt ? Date.parse(updatedAt) : 0,
    };
    if (addToQueue) {
      queue.add(JSON.stringify(queueEntry));
    }

    return join(options.assetBase, assetId, file);
  };

  const getModifiedTime = async (file) => {
    if (existsSync(file)) {
      const { mtime } = await promises.stat(file);
      return Date.parse(mtime);
    }

    return 0;
  };

  const getLocalSrc = (src, sys, addToQueue = true) => {
    const localPath = getLocalPath(src, sys, addToQueue);
    if (process.env.HUGO_BASEURL) {
      return join('/', process.env.HUGO_BASEURL, localPath);
    }

    return localPath;
  };

  const readAsset = async (asset) => {
    const { sys, fields } = asset || {};
    const { createdAt, updatedAt } = sys || {};
    const fileUrl = fields?.file?.url ?? '';
    const src = fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl;

    if (!src) {
      return;
    }

    const timestamp = Date.parse(updatedAt || createdAt) || 0;
    const url = new URL(src);
    const filepath = join(options.cachePath, getLocalPath(src, {}, false));
    await mkdirp(dirname(filepath));
    if (!existsSync(filepath) || !timestamp || timestamp > (await getModifiedTime(filepath))) {
      try {
        const response = got(url);
        const buffer = await response.buffer();

        await promises.writeFile(filepath, buffer);
      } catch {
        console.log('Error downloading image:', url);
      }
    }

    return promises.readFile(filepath, 'utf8');
  };

  const fetchAsset = async (src, timestamp) => {
    const url = new URL(src);

    const filepath = getLocalPath(src, {}, false);
    const cacheFile = join(options.cachePath, filepath);
    const file = join(options.assetPath, filepath);

    await mkdirp(dirname(cacheFile));
    await mkdirp(dirname(file));

    if (!existsSync(cacheFile) || (timestamp && timestamp > (await getModifiedTime(cacheFile)))) {
      try {
        const response = got(url);
        const buffer = await response.buffer();
        await promises.writeFile(cacheFile, buffer);
      } catch {
        console.log('Error downloading image:', url);
      }
    }

    await promises.copyFile(cacheFile, file);

    return filepath;
  };

  const fetchAssets = async () => {
    const files = [...queue].map((json) => JSON.parse(json));

    const bar = new SingleBar(
      { format: '    ➞ Fetching files: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}' },
      Presets.legacy
    );
    let progress = 0;
    // Start the progress bar with a total value of 200 and start value of 0
    bar.start(files.length, 0);
    await Promise.all(
      files.map(async (file) => {
        const { src, timestamp } = file;
        try {
          await fetchAsset(src, timestamp);
          progress++;
          bar.update(progress);
        } catch (error) {
          console.log(error);
        }
      })
    );

    bar.stop();
    return true;
  };

  const getImageData = (asset, ratio, focusArea) => {
    const { width, height } = asset?.fields?.file?.details?.image ?? {};
    const mimeType = asset?.fields?.file?.contentType;
    const url = asset?.fields?.file?.url;
    const types = [...new Set([...(options.extraTypes || []), mimeType])];
    const sizes = (options.sizes || []).map((value) => {
      if (typeof value === 'function') {
        return value(asset, ratio, focusArea);
      }

      return parseFloat(value);
    });

    if (!url || !width || !height) {
      return {};
    }

    const src = url.startsWith('//') ? `https:${url}` : url;

    // Compute possible widths considering ratio & contentful max size
    const widths = [
      ...new Set(
        (ratio
          ? [
              contentfulMaxWidth,
              contentfulMaxWidth * ratio,
              width,
              Math.floor(height * ratio),
              ...sizes,
            ]
          : [contentfulMaxWidth, width, ...sizes]
        )
          .sort((a, b) => b - a)
          .filter(
            (w) =>
              w <= width &&
              w <= contentfulMaxWidth &&
              (!ratio || (w / ratio <= contentfulMaxWidth && w / ratio <= height))
          )
          .map((w) => Math.round(w))
      ),
    ];

    const [maxWidth] = widths;
    const maxHeight = Math.round(maxWidth / (ratio || width / height));
    const sizesAttribute = `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`;

    const sizeParams = (width, ratio) => {
      if (!ratio) {
        return `w=${width}`;
      }

      return [
        'fit=fill',
        `w=${width}`,
        `h=${Math.floor(width / ratio)}`,
        `f=${focusArea || 'center'}`,
      ].join('&');
    };

    const megaPixelFilter = (w, type = '-') => {
      const max = maxMegaPixels?.[type.replace('image/', '')];
      const r = ratio || width / height;
      return !max || max >= (w * Math.floor(w / r)) / 1000000;
    };

    const sources = Object.fromEntries(
      types.map((type) => {
        const fm = type === mimeType ? '' : `&fm=${type.replace('image/', '')}`;
        return [
          type,
          widths
            .filter((w) => megaPixelFilter(w, type))
            .map((w) => ({
              src: `${src}?${sizeParams(w, ratio)}&q=${options.quality}${fm}`,
              width: w,
            })),
        ];
      })
    );

    const [assetFile] = sources[mimeType];
    const { src: assetSrc } = assetFile;

    // Fetch original src and srcsets for production use
    const finalSrc = options.download ? getLocalSrc(assetSrc, asset.sys) : assetSrc;
    const finalSrcsets = Object.entries(sources).map(([type, files]) => {
      const srcset = files.map((file) => {
        const { width, src } = file;
        return `${options.download ? getLocalSrc(src, asset.sys) : src} ${width}w`;
      });
      return {
        type,
        srcset: srcset.join(', '),
      };
    });

    return {
      width: maxWidth,
      height: maxHeight,
      sizes: sizesAttribute,
      srcsets: finalSrcsets,
      src: finalSrc,
    };
  };

  const mapAssetLink = async (transformContext, runtimeContext, defaultValue) => {
    const { download } = options || {};
    const { asset, entry, fieldId } = transformContext;
    const { sys } = asset || {};
    const { url, mimeType = '' } = defaultValue;
    const src = url.startsWith('//') ? `https:${url}` : url;

    // Get ratio from config
    const defaultRatio = entry?.fields?.ratio ?? options?.ratios?.default;
    const contentTypeDefaultRatio =
      options?.ratios?.[entry?.sys?.contentType?.sys?.id ?? 'unknown']?.default ?? defaultRatio;
    const { [entry?.sys?.contentType?.sys?.id ?? 'unknown']: contentTypeRatios } = options.ratios;
    const ratioConfig = contentTypeRatios?.[fieldId] ?? contentTypeDefaultRatio;

    // Get focusArea from config
    const defaultFocusArea = entry?.fields?.focus_area ?? options?.focusAreas?.default ?? 'center';
    const contentTypeDefaultFocusArea =
      options?.focus_area?.[entry?.sys?.contentType?.sys?.id ?? 'unknown']?.default ??
      defaultFocusArea;
    const { [entry?.sys?.contentType?.sys?.id ?? 'unknown']: focusAreaConfig } = options.focusAreas;
    const focusArea = focusAreaConfig?.[fieldId] ?? contentTypeDefaultFocusArea;

    if (mimeType === 'image/svg+xml') {
      const source = await readAsset(asset);

      const { data: optimized } = await optimize(source, {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
              },
            },
          },
          'removeDimensions',
          {
            name: 'removeAttrs',
            params: {
              attrs: 'fill',
            },
          },
        ],
      });

      // Add viewBox if not present
      return {
        ...defaultValue,
        source: optimized,
        srcsets: [],
        src: download ? getLocalSrc(src, sys) : src,
      };
    }

    if (mimeType.startsWith('image')) {
      const original = getImageData(asset, undefined, focusArea);
      const derivatives = Object.fromEntries(
        Object.entries(ratioConfig || {}).map(([name, ratio]) => [
          name,
          getImageData(asset, ratio, focusArea),
        ])
      );
      return { ...defaultValue, src: original.src, derivatives: { original, ...derivatives } };
    }

    return { ...defaultValue, src: download ? getLocalSrc(src, sys) : src };
  };

  const after = async () => {
    if (options.download) {
      await fetchAssets();
    }
  };

  return {
    after,
    mapAssetLink,
  };
};
