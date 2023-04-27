import './style.css';

import {
  of,
  map,
  Observable,
  delay,
  switchMap,
  BehaviorSubject,
  tap,
  MonoTypeOperatorFunction,
  EMPTY,
  interval,
  ObservableInput,
  OperatorFunction,
  ObservedValueOf,
} from 'rxjs';
import { catchError, exhaustMap, retry, shareReplay } from 'rxjs/operators';

/*
  Like switchMap, but, when an error occurs, it is swallowed silently
  Pass in an errorHandler to deal with the error
*/
export function switchMapKeepAlive<T, O extends ObservableInput<any>>(
  fn: (value: T, index: number) => O,
  errorHandler?: (error: any) => void
): OperatorFunction<T, ObservedValueOf<O>> {
  return switchMap((value) => {
    return of(value).pipe(
      switchMap((_, index) => fn(_, index)),
      catchError((err) => {
        if (errorHandler) {
          errorHandler(err);
        } else {
          console.error('Unhandled error in switchMapKeepAlive:');
          console.error(err);
          console.error(new Error().stack);
        }
        return EMPTY;
      })
    );
  });
}

/*
  Like exhaustMap, but, when an error occurs, it is swallowed silently
  Pass in an errorHandler to deal with the error
*/
export function exhaustMapSafe<T, O extends ObservableInput<any>>(
  fn: (value: T, index: number) => O,
  errorHandler?: (error: any) => void
): OperatorFunction<T, ObservedValueOf<O>> {
  return exhaustMap((value) => {
    return of(value).pipe(
      exhaustMap((_, index) => fn(_, index)),
      catchError((err) => {
        if (errorHandler) {
          errorHandler(err);
        } else {
          console.error('Unhandled error in exhaustMapSafe:');
          console.error(err);
          console.error(new Error().stack);
        }
        return EMPTY;
      })
    );
  });
}

interval(500)
  .pipe(
    exhaustMapSafe(
      () => callApi(),
      () => console.log('I caught you!')
    )
  )
  .subscribe((data) => {
    console.log('data obtained: ' + data);
  });

const userClicksOnButton$ = of('click');

userClicksOnButton$.pipe(exhaustMapSafe(() => callApi())).subscribe((value) => {
  console.log('obtained: ' + value);
});

function callApi() {
  return of('data').pipe(
    delay(5000),
    map((data) => {
      if (Math.random() < 0.1) {
        throw new Error();
      }
      return data;
    })
  );
}

export function broadcast(): MonoTypeOperatorFunction<unknown> {
  return shareReplay({ bufferSize: 1, refCount: true });
}
