import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import type { MapAssetLink, RuntimeContext, TransformContext } from '@jungvonmatt/contentful-ssg';
import { Presets, SingleBar } from 'cli-progress';
import { promises } from 'fs';
import { join } from 'path';
import type { PluginConfig, ProcessedVideo } from '../types.js';
import { getAssetHelper } from './asset.js';
import { getFfmpegQueue } from './queue.js';

const queue = getFfmpegQueue<string>();

export const getVideoHelper = (options: PluginConfig) => {
  const { getLocalSrc, getLocalPath, getFileTimestamp } = getAssetHelper(options);
  const ffmpeg = createFFmpeg();

  const getPosterImageFilePath = (videoFile: string) =>
    `${videoFile.replace(/\.\w+$/, '')}-poster.jpg`;

  const generatePosterImage = async (src: string, dest: string) => {
    const srcPath = join(options.cachePath, src);
    const cachedDestPath = join(options.cachePath, dest);
    const destPath = join(options.assetPath, dest);

    const timestampSrc = await getFileTimestamp(srcPath);
    const timestampDestCached = await getFileTimestamp(cachedDestPath);
    const timestampDest = await getFileTimestamp(cachedDestPath);

    if (!timestampDestCached || timestampDestCached < timestampSrc) {
      const ffmpegSrc = src.replace(/^\//, '').replace(/\//g, '-');
      const ffmpegDest = dest.replace(/^\//, '').replace(/\//g, '-');

      let additionalArgs: string[] = [];
      if (options.posterPosition) {
        additionalArgs = [...additionalArgs, '-ss', options.posterPosition];
      }

      if (options.posterScale) {
        additionalArgs = [...additionalArgs, '-vf', `scale=${options.posterScale}`];
      }

      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }

      // Write file to MEMFS first so that ffmpeg.wasm is able to consume it
      // eslint-disable-next-line new-cap
      ffmpeg.FS('writeFile', ffmpegSrc, await fetchFile(srcPath));
      await ffmpeg.run(
        '-i',
        ffmpegSrc,
        ...additionalArgs,
        '-vframes',
        '1',
        '-f',
        'image2',
        ffmpegDest
      );
      await promises.writeFile(
        cachedDestPath,
        // eslint-disable-next-line new-cap
        ffmpeg.FS('readFile', ffmpegDest)
      );
    }

    if (!timestampDest || timestampDest < timestampDestCached || timestampDest < timestampSrc) {
      await promises.copyFile(cachedDestPath, destPath);
    }

    return dest;
  };

  const generatePosterImages = async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const bar = new SingleBar(
      {
        format:
          '    ➞ Generating poster images: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
      },
      Presets.legacy
    );
    let progress = 0;
    // Start the progress bar with a total value of 200 and start value of 0
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    bar.start(queue.size, 0);

    // Ffmpeg wasm can't process more than one file at a time
    // so we need to run it serial
    for (const src of queue) {
      try {
        const dest = getPosterImageFilePath(src);
        // eslint-disable-next-line no-await-in-loop
        await generatePosterImage(src, dest);
        progress++;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        bar.update(progress);
      } catch (error: unknown) {
        console.log(error);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    bar.stop();
    return true;
  };

  const mapAssetLink = async (
    transformContext: TransformContext,
    runtimeContext: RuntimeContext,
    content: MapAssetLink
  ): Promise<ProcessedVideo> => {
    const { asset } = transformContext;
    const { sys } = asset || {};
    const { url } = content;
    const src = url.startsWith('//') ? `https:${url}` : url;

    const filepath = getLocalPath(src, sys, !options.download);
    queue.add(filepath);

    const result: ProcessedVideo = {
      ...content,
      src: options.download ? getLocalSrc(src, sys) : src,
    };

    if (options.generatePosterImages) {
      if (typeof ffmpeg.setLogging === 'function') {
        ffmpeg.setLogging(runtimeContext.config.verbose);
      }

      result.poster = getPosterImageFilePath(filepath);
    }

    return result;
  };

  const after = async () => {
    if (options.generatePosterImages) {
      await generatePosterImages();
    }
  };

  return {
    mapAssetLink,
    after,
  };
};
