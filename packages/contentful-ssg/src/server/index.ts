/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import express, { Response } from 'express';
import { Server } from 'net';
import { IncomingHttpHeaders } from 'http';
import { Entry, Asset, ContentType } from 'contentful';

const app = express();
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
  body: Entry<unknown> | Asset | ContentType;
}

export const startServer = (port = 1414, callback: Function = () => 1): Server => {
  app.get('/status', (_req, res: Response) => res.status(200).send('ok'));

  app.get('/', async (_req, res: Response) => {
    await callback();
    return res.status(200).send('ok');
  });
  app.post('/', async (req: ContentfulWebhookRequest, res: Response) => {
    if (!req.body.sys) {
      return res.status(401).send();
    }

    await callback();
    return res.status(200).send();
  });

  return app.listen(port);
};
