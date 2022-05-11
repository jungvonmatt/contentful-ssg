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

    const { sys } = req.body;
    if (
      !sys ||
      !sys.id ||
      (sys.type !== 'Asset' &&
        sys.type !== 'Entry' &&
        sys.type !== 'ContentType' &&
        sys.type !== 'DeletedEntry')
    ) {
      return res.status(401).send('Invalid format');
    }

    const triggerType = req.headers['x-contentful-topic'];
    if (typeof triggerType !== 'string') {
      return res.status(401).send('Invalid format');
    }

    return res.status(200).send({
      id: sys.id,
      type: sys.type,
      message: 'Did nothing',
    });
  });

  return app.listen(port, () => {
    console.log();
    console.log(` [contentful-ssg] server started at http://localhost:${port}`);
  });
};
