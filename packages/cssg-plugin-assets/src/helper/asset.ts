import { Presets, SingleBar } from 'cli-progress';
import { existsSync, promises } from 'fs';
import got from 'got';
import mkdirp from 'mkdirp';
import { basename, dirname, extname as pathExtname, join } from 'path';
import { type PluginConfig } from '../types.js';
import { getDownloadQueue } from './queue.js';
import { type AssetSys } from 'contentful';

type DownloadEntry = {
  src: string;
  timestamp: number;
};

const queue = getDownloadQueue<DownloadEntry>();

export const getAssetHelper = (options: PluginConfig) => {
  const getAssetTimestamp = (sys: AssetSys) => Date.parse(sys?.updatedAt || sys?.createdAt) || 0;

  const getFileTimestamp = async (file: string) => {
    if (existsSync(file)) {
      const { mtime } = await promises.stat(file);
      return Date.parse(mtime.toISOString());
    }

    return 0;
  };

  const getLocalPath = (src: string, sys: AssetSys, addToQueue = true) => {
    const url = new URL(src);
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
      timestamp: getAssetTimestamp(sys),
    };
    if (addToQueue) {
      queue.add(queueEntry);
    }

    return join(options.assetBase, assetId, file);
  };

  const getLocalSrc = (src: string, sys: AssetSys, addToQueue = true) => {
    const localPath = getLocalPath(src, sys, addToQueue);
    if (process.env.HUGO_BASEURL) {
      return join('/', process.env.HUGO_BASEURL, localPath);
    }

    return localPath;
  };

  const fetchAsset = async (src: string, timestamp: number) => {
    const url = new URL(src);

    const filepath = getLocalPath(src, {} as AssetSys, false);
    const cacheFile = join(options.cachePath, filepath);
    const file = join(options.assetPath, filepath);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await mkdirp(dirname(cacheFile));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await mkdirp(dirname(file));

    const cachedFileTimestamp = await getFileTimestamp(cacheFile);
    const fileTimestamp = await getFileTimestamp(file);

    let buffer: Buffer = null;

    if (!existsSync(cacheFile) || (timestamp && timestamp > cachedFileTimestamp)) {
      try {
        const response = got(url);
        buffer = await response.buffer();
        await promises.writeFile(cacheFile, new Uint8Array(buffer));
      } catch {
        console.log('Error downloading image:', url);
      }
    }

    if (!fileTimestamp || fileTimestamp < cachedFileTimestamp || fileTimestamp < timestamp) {
      await promises.copyFile(cacheFile, file);
    }

    return buffer || promises.readFile(cacheFile);
  };

  const fetchAssets = async () => {
    const bar = new SingleBar(
      { format: '    ➞ Fetching files: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}' },
      Presets.legacy,
    );
    let progress = 0;
    // Start the progress bar with a total value of 200 and start value of 0

    bar.start(queue.size, 0);
    await Promise.all(
      [...queue].map(async (file) => {
        const { src, timestamp } = file;
        try {
          await fetchAsset(src, timestamp);
          progress++;

          bar.update(progress);
        } catch (error: unknown) {
          console.log(error);
        }
      }),
    );

    bar.stop();
    return true;
  };

  const after = async () => {
    if (queue.size) {
      await fetchAssets();
    }
  };

  return {
    getAssetTimestamp,
    getFileTimestamp,
    getLocalPath,
    getLocalSrc,
    fetchAsset,
    fetchAssets,
    after,
  };
};
