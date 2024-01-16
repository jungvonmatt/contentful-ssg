import { Asset, ContentType, Entry, EntrySkeletonType } from 'contentful';
import express, { Response } from 'express';
import { IncomingHttpHeaders } from 'http';

const app = express();
app.disable('x-powered-by');
app.use(express.urlencoded({ extended: true }));
app.use(
  express.json({
    type: [
      'application/vnd.contentful.management.v1+json',
      'application/vnd.contentful.management.v1+json; charset=utf-8',
      'application/json',
      'application/json; charset=utf-8',
      'application/x-www-form-urlencoded',
      'application/x-www-form-urlencoded; charset=utf-8',
    ],
  })
);

declare module 'http' {
  interface IncomingHttpHeaders {
    'x-contentful-topic':
      | 'ContentManagement.ContentType.create'
      | 'ContentManagement.ContentType.save'
      | 'ContentManagement.ContentType.publish'
      | 'ContentManagement.ContentType.unpublish'
      | 'ContentManagement.ContentType.delete'
      | 'ContentManagement.Entry.create'
      | 'ContentManagement.Entry.save'
      | 'ContentManagement.Entry.auto_save'
      | 'ContentManagement.Entry.archive'
      | 'ContentManagement.Entry.unarchive'
      | 'ContentManagement.Entry.publish'
      | 'ContentManagement.Entry.unpublish'
      | 'ContentManagement.Entry.delete'
      | 'ContentManagement.Asset.create'
      | 'ContentManagement.Asset.save'
      | 'ContentManagement.Asset.auto_save'
      | 'ContentManagement.Asset.archive'
      | 'ContentManagement.Asset.unarchive'
      | 'ContentManagement.Asset.publish'
      | 'ContentManagement.Asset.unpublish'
      | 'ContentManagement.Asset.delete';
    'X-Contentful-Webhook-Name': string;
  }
}

interface ContentfulWebhookRequest {
  headers: IncomingHttpHeaders;
  body: Entry<EntrySkeletonType, undefined> | Asset | ContentType;
}

export const getApp = (callback: () => Promise<void>) => {
  app.get('/status', (_req, res: Response) => res.status(200).send('ok'));

  app.get('/', async (_req, res: Response) => {
    await callback();
    return res.status(200).send('ok');
  });
  app.post('/', async (req: ContentfulWebhookRequest, res: Response) => {
    if (!req.body.sys) {
      return res.status(401).send('error');
    }

    await callback();
    return res.status(200).send('ok');
  });

  return app;
};
