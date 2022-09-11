import type { Observable } from 'rxjs';
import { filter, count, takeUntil, timer } from 'rxjs';

export const getObservableValues = async <T, U = Partial<T>>(
  observable$: Observable<T>,
  cb: (value: T) => U = (value) => value as unknown as U
): Promise<U[]> => {
  const terminator$ = timer(1);
  const data: U[] = [];

  await observable$.pipe(takeUntil(terminator$)).forEach((value) => {
    const entry = cb(value);
    data.push(entry);
  });

  return data;
};

export const getObservableCount = async <T>(
  observable$: Observable<T>,
  filterFn: (value: T) => boolean = () => true
): Promise<number> => {
  let result = 0;
  const terminator$ = timer(1);
  await observable$
    .pipe(takeUntil(terminator$))
    .pipe(filter(filterFn))
    .pipe(count())
    .forEach((val) => {
      result = val;
    });

  return result;
};
