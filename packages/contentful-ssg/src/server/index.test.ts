import request from 'supertest';
import { getApp } from './index.js';

const mockCallback = jest.fn(() => true);
const app = getApp(mockCallback);

describe('Watch server', () => {
  beforeEach(() => mockCallback.mockReset());

  test('responds to /status', async () => {
    const res = await request(app).get('/status');
    expect(res.header['x-powered-by']).toBeFalsy();
    expect(res.statusCode).toBe(200);
    expect(res.text).toEqual('ok');
  });

  test('responds to /', async () => {
    const res = await request(app).get('/');
    expect(res.header['x-powered-by']).toBeFalsy();
    expect(res.statusCode).toBe(200);
    expect(res.text).toEqual('ok');
    expect(mockCallback).toBeCalled();
  });

  test('responds to contentful webhook', async () => {
    const res = await request(app)
      .post('/')
      .send({ sys: { id: 1 } });

    expect(res.header['x-powered-by']).toBeFalsy();
    expect(res.statusCode).toBe(200);
    expect(res.text).toEqual('ok');
    expect(mockCallback).toBeCalled();
  });

  test('fails on invalid contentful webhook', async () => {
    const res = await request(app).post('/').send({ result: 42 });

    expect(res.header['x-powered-by']).toBeFalsy();
    expect(res.statusCode).toBe(401);
    expect(res.text).toEqual('error');
    expect(mockCallback).not.toBeCalled();
  });
});
