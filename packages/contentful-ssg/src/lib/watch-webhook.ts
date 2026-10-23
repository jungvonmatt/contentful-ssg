import { createHash } from 'crypto';
import { hostname } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { addWebhook } from '@jungvonmatt/contentful-client';
import type { ContentfulConfig } from '@jungvonmatt/contentful-client';

export const addWatchWebhook = async (options: ContentfulConfig, url: string) => {
  let topics = [
    'ContentType.publish',
    'ContentType.unpublish',
    'ContentType.delete',
    'Entry.archive',
    'Entry.unarchive',
    'Entry.publish',
    'Entry.unpublish',
    'Entry.delete',
    'Asset.archive',
    'Asset.unarchive',
    'Asset.publish',
    'Asset.unpublish',
    'Asset.delete',
  ];

  if (options.preview) {
    topics = [
      ...topics,
      'ContentType.save',
      'Entry.save',
      'Entry.auto_save',
      'Asset.save',
      'Asset.auto_save',
    ];
  }

  const uuid = url ? createHash('sha1').update(url).digest('hex') : uuidv4();

  return addWebhook(options, uuid, {
    name: `contentful-ssg (${hostname()})`,
    url,
    httpBasicUsername: null,
    topics,
    filters: [
      {
        equals: [
          {
            doc: 'sys.environment.sys.id',
          },
          options.environmentId,
        ],
      },
    ],
    transformation: {
      includeContentLength: true,
    },
    headers: [],
  });
};
