// eslint-disable-next-line @typescript-eslint/ban-types
class Queue<T extends Object> {
  data: Set<string>;

  constructor() {
    this.data = new Set<string>();
  }

  add(entry: T) {
    this.data.add(JSON.stringify(entry));
  }

  get size() {
    return this.data.size;
  }

  *values() {
    for (const entry of this.data) {
      yield JSON.parse(entry) as T;
    }
  }

  [Symbol.iterator]() {
    return this.values();
  }
}

const queues = new Map();

export const getQueue = <T = unknown>(key: string): Queue<T> => {
  if (!queues.has(key)) {
    queues.set(key, new Queue<T>());
  }

  return queues.get(key) as Queue<T>;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const DOWNLOAD = 'download';
// eslint-disable-next-line @typescript-eslint/naming-convention
export const FFMPEG = 'ffmpeg';

export const getDownloadQueue = <T = unknown>(): Queue<T> => getQueue<T>(DOWNLOAD);
export const getFfmpegQueue = <T = unknown>(): Queue<T> => getQueue<T>(FFMPEG);
