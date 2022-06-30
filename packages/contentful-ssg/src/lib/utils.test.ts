import { Entry, ObservableContext, TransformContext } from '../types.js';
import { collect, collectParentValues, collectValues, waitFor } from './utils.js';
import { ReplaySubject } from 'rxjs';
import { WrappedError } from './error.js';

const data = new Map([
  ['1', { sys: { id: '1' }, fields: { slug: 'a' } }],
  ['2', { sys: { id: '2' }, fields: { slug: 'b', parent: '1' } }],
  ['3', { sys: { id: '3' }, fields: { slug: 'c', parent: '2' } }],
  ['4', { sys: { id: '4' }, fields: { slug: 'd', parent: '3' } }],
  ['5', { sys: { id: '5' }, fields: { slug: 'e', parent: '4' } }],
]) as unknown as Map<string, Entry>;

const contentType = { sys: { id: 'test-type' } };

const entryMap = new Map([
  ['1', { sys: { id: '1', contentType }, fields: { slug: 'a' } }],
  [
    '2',
    {
      sys: { id: '2', contentType },
      fields: { slug: 'b', parent: { sys: { id: '1' } }, link: { sys: { id: '1' } } },
    },
  ],
  [
    '3',
    {
      sys: { id: '3', contentType },
      fields: { slug: 'c', parent: { sys: { id: '2' } }, link: { sys: { id: '1' } } },
    },
  ],
  [
    '4',
    {
      sys: { id: '4', contentType },
      fields: { slug: 'd', parent: { sys: { id: '3' } }, link: { sys: { id: '3' } } },
    },
  ],
  [
    '5',
    {
      sys: { id: '5', contentType },
      fields: { slug: 'e', parent: { sys: { id: '4' } }, link: { sys: { id: '3' } } },
    },
  ],
  [
    '6',
    {
      sys: { id: '6', contentType },
      fields: { slug: 'f', parent: { sys: { id: '1' } }, link: { sys: { id: '1' } } },
    },
  ],
  [
    '7',
    {
      sys: { id: '7', contentType },
      fields: { slug: 'g', parent: { sys: { id: '2' } }, link: { sys: { id: '1' } } },
    },
  ],
  [
    '8',
    {
      sys: { id: '8', contentType },
      fields: { slug: 'h', parent: { sys: { id: '3' } }, link: { sys: { id: '3' } } },
    },
  ],
  [
    '9',
    {
      sys: { id: '9', contentType },
      fields: { slug: 'i', parent: { sys: { id: '4' } }, link: { sys: { id: '3' } } },
    },
  ],
]) as unknown as Map<string, Entry>;

const transformContext = { entryMap } as unknown as TransformContext;

describe('Utils', () => {
  test('collectValues', () => {
    const entry = entryMap.get('5');
    expect(entry).toBeTruthy();
    if (entry) {
      const slugsReverse = collectValues({ ...transformContext, entry })('fields.slug');
      const slugs = collectValues({ ...transformContext, entry })('fields.slug', {
        reverse: false,
      });

      expect(slugsReverse).toEqual(['a', 'b', 'c', 'd', 'e']);
      expect(slugs).toEqual(['e', 'd', 'c', 'b', 'a']);
    }
  });

  test('collectValues (empty)', () => {
    const entry = entryMap.get('1');
    expect(entry).toBeTruthy();
    if (entry) {
      const slugs = collectValues({ ...transformContext, entry })('fields.slug');
      const parent = collectParentValues({ ...transformContext, entry })('fields.slug');

      expect(slugs).toEqual(['a']);
      expect(parent).toEqual([]);
    }
  });

  test('collectValues with different link field', () => {
    const entry = entryMap.get('5');
    expect(entry).toBeTruthy();
    if (entry) {
      const slugsReverse = collectValues({ ...transformContext, entry })('fields.slug', {
        linkField: 'fields.link',
      });
      const slugs = collectValues({ ...transformContext, entry })('fields.slug', {
        reverse: false,
        linkField: 'fields.link',
      });

      expect(slugsReverse).toEqual(['a', 'c', 'e']);
      expect(slugs).toEqual(['e', 'c', 'a']);
    }
  });

  test('collectParentValues', () => {
    const entry = entryMap.get('5');
    expect(entry).toBeTruthy();
    if (entry) {
      const slugsReverse = collectParentValues({ ...transformContext, entry })('fields.slug');
      const slugs = collectParentValues({ ...transformContext, entry })('fields.slug', {
        reverse: false,
      });

      expect(slugsReverse).toEqual(['a', 'b', 'c', 'd']);
      expect(slugs).toEqual(['d', 'c', 'b', 'a']);
    }
  });

  test('collect', () => {
    const getter = {
      getId: (item) => item.sys.id,
      getNextId: (item) => item.fields.parent,
      getValue: (item) => item.fields.slug,
    };

    const entry = data.get('5');
    expect(entry).toBeTruthy();
    if (entry) {
      const a = collect(entry, data, {
        ...getter,
        reverse: true,
      });
      const b = collect(entry, data, {
        ...getter,
        reverse: false,
      });

      expect(a).toEqual(['a', 'b', 'c', 'd', 'e']);
      expect(b).toEqual(['e', 'd', 'c', 'b', 'a']);
    }
  });

  test('waitFor', async () => {
    const subject = new ReplaySubject<ObservableContext>();
    const observable = subject.asObservable();

    // Throw error when waiting for the current entry
    expect(async () => {
      await waitFor({ ...transformContext, entry: entryMap.get('2') as Entry, observable })('2');
    }).rejects.toThrowError(/2.*waiting.*2/);

    // Throw error when waiting for non existing entry
    expect(async () => {
      await waitFor({ ...transformContext, entry: entryMap.get('3') as Entry, observable })('10');
    }).rejects.toThrowError('No entry with id "10" available');

    // // Throw error when waiting timeout is reached
    await expect(async () => {
      await waitFor({ ...transformContext, entry: entryMap.get('1') as Entry, observable })(
        '4',
        50
      );
    }).rejects.toThrowError(/Exceeded timeout of 50 ms/);

    // Mimic 500ms wait time for entry
    setTimeout(() => {
      subject.next({ ...transformContext, id: '4' });
    }, 500);

    const value = await waitFor({
      ...transformContext,
      entry: entryMap.get('1') as Entry,
      observable,
    })('4');

    expect(value).toEqual({ ...transformContext, id: '4' });
  });

  test('waitFor error', async () => {
    const subject = new ReplaySubject<ObservableContext>();
    const observable = subject.asObservable();
    const entry = entryMap.get('3') as Entry;

    // Mimic 500ms wait time for entry
    setTimeout(() => {
      subject.next({
        ...transformContext,
        id: '4',
        error: new Error('test error'),
      });
    }, 500);

    await expect(async () => {
      await waitFor({ ...transformContext, entry, observable })('4');
    }).rejects.toThrowError(WrappedError);

    try {
      await waitFor({ ...transformContext, entry, observable })('4');
    } catch (error) {
      expect(error).toBeInstanceOf(WrappedError);
      expect(error.message).toMatch('Awaited entry 4 (test-type) errored');
      expect(error.originalError.message).toEqual('test error');
    }
  });

  test('detect cyclic dependency', async () => {
    const subject = new ReplaySubject<ObservableContext>();
    const observable = subject.asObservable();

    // let 9 finish regularly
    setTimeout(() => {
      subject.next({
        ...transformContext,
        id: '9',
      });
    }, 100);

    // mimic behaviour in index.ts
    const waitMock = async (source: string, dest: string, delay: number) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        await waitFor({ ...transformContext, entry: entryMap.get(source) as Entry, observable })(
          dest,
          1000
        );
        subject.next({
          ...transformContext,
          id: source,
        });
        return `SUCCESS ${source}`;
      } catch (error) {
        subject.next({
          ...transformContext,
          id: source,
          error,
        });
        return `${error.message}`;
      }
    };

    const result = await Promise.all([
      waitMock('6', '8', 0),
      waitMock('8', '5', 10),
      waitMock('5', '7', 20),
      waitMock('7', '6', 30),
      waitMock('3', '9', 40),
    ]);

    expect(result[0]).toMatch('Found cyclic dependency in 6 (test-type): 6 -> 8 -> 5 -> 7 -> 6');
    expect(result[1]).toMatch('Found cyclic dependency in 8 (test-type): 8 -> 5 -> 7 -> 6 -> 8');
    expect(result[2]).toMatch('Found cyclic dependency in 5 (test-type): 5 -> 7 -> 6 -> 8 -> 5');
    expect(result[3]).toMatch(/Awaited entry 6 \(test-type\) errored/);
    expect(result[4]).toMatch('SUCCESS 3');
  });

  test('handle subscriptions on postponed subscribe', async () => {
    const subject = new ReplaySubject<ObservableContext>();
    const observable = subject.asObservable();

    const finishSuccess = (id, time = 0) =>
      setTimeout(() => {
        subject.next({
          ...transformContext,
          id,
        });
      }, time);

    const finishError = (id, time = 0) =>
      setTimeout(() => {
        subject.next({
          ...transformContext,
          id,
          error: new Error(`Error on ${id}`),
        });
      }, time);

    finishSuccess('2', 20);
    finishSuccess('3', 40);
    finishError('4', 30);
    finishSuccess('5', 50);

    const transFormMock = () =>
      Promise.all([
        waitFor({ ...transformContext, entry: entryMap.get('1') as Entry, observable })('2'),
        waitFor({ ...transformContext, entry: entryMap.get('1') as Entry, observable })('3'),
        waitFor({ ...transformContext, entry: entryMap.get('1') as Entry, observable })('4'),
        waitFor({ ...transformContext, entry: entryMap.get('1') as Entry, observable })('5'),
      ]);

    const result = await new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const result = await transFormMock();
          resolve(result);
        } catch (error) {
          resolve(error);
        }
      }, 500);
    });

    expect(result).toBeInstanceOf(WrappedError);
    expect((result as WrappedError).message).toMatch(/Awaited entry 4 \(test-type\) errored/);
  });
});
