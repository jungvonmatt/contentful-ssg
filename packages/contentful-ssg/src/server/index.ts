import { type Asset, type ContentType, type Entry, type EntrySkeletonType } from 'contentful';
import express, { type Express, type Response } from 'express';
import { type IncomingHttpHeaders } from 'http';

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
  }),
);

declare module 'http' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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

type ContentfulWebhookRequest = {
  headers: IncomingHttpHeaders;
  body: Entry<EntrySkeletonType, undefined> | Asset | ContentType;
};

export const getApp = (callback: () => Promise<void>): Express => {
  app.get('/status', (_req, res: Response) => res.status(200).send('ok'));

  app.get('/', (_req, res: Response, next) => {
    Promise.resolve(callback())
      .then(() => res.status(200).send('ok'))
      .catch(next);
  });
  app.post('/', (req: ContentfulWebhookRequest, res: Response, next) => {
    if (!req.body.sys) {
      res.status(401).send('error');
      return;
    }

    Promise.resolve(callback())
      .then(() => res.status(200).send('ok'))
      .catch(next);
  });

  return app;
};
