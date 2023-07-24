import './style.css';

import {
  of,
  map,
  delay,
  switchMap,
  tap,
  MonoTypeOperatorFunction,
  EMPTY,
  ObservableInput,
  OperatorFunction,
  ObservedValueOf,
  interval,
  timer,
  combineLatest,
  ObservableInputTuple,
} from 'rxjs';
import {
  catchError,
  combineLatestWith,
  exhaustMap,
  sample,
  shareReplay,
  take,
  withLatestFrom,
} from 'rxjs/operators';

const data1$ = of(1);
const data2Slow$ = of(2).pipe(delay(5000));
const data3Reccurent$ = timer(0, 4000);

// simlate issue with withLatestFrom
// it drops the slow observables that were subscribed to earl once source starts
// AND it is missing a take(1) behaviour

of(0)
  .pipe(delay(3000))
  .pipe(
    tap(() => console.log('emission in chain')),
    withLatestFrom(
      data1$.pipe(tap((v) => console.log('data1 emmited: ', v))),

      //This is subscribed to at declaration, but get ignored as it is slower than the source
      data2Slow$.pipe(tap((v) => console.log('data2Slow emmited: ', v)))
    )
  )
  .subscribe(() => {
    console.log('subscriber was called');
  });

/*timer(5000, 20000)
  .pipe(delay(5000))
  .pipe(
    tap((v) => console.log('emission in chain: ', v)),
    switchToLatest([
      data1$.pipe(tap((v) => console.log('data1 emmited: ', v))),

      //This is subscribed to at declaration, but get ignored as it is slower than the source
      data2Slow$.pipe(tap((v) => console.log('data2Slow emmited: ', v))),

      data3Reccurent$.pipe(
        tap((v) => console.log('data3Reccurent emmited: ', v))
      ),
    ])
  )
  .subscribe(([data1, data2Slow, data3Reccurent]) => {
    console.log(
      'subscriber was called, batch of values captured: data1: ' +
        data1 +
        '  data2slow: ' +
        data2Slow +
        '  data3Reccurent: ' +
        data3Reccurent
    );
  });*/

export function switchToLatest<A extends readonly unknown[]>(
  observables: readonly [...ObservableInputTuple<A>]
) {
  return switchMapSafe(() => combineLatest(observables).pipe(take(1)));
}

/*
possibly simpler typings that works on older rx versions

export function switchToLatest<A>(observables: [...Observable<A>[]]) {
  return switchMapSafe(() => combineLatest(observables).pipe(take(1)))
}

*/

/*
  Like switchMap, but, when an error occurs, it is swallowed silently
  Pass in an errorHandler to deal with the error
*/
export function switchMapSafe<T, O extends ObservableInput<any>>(
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
          console.error('Unhandled error in switchMapSafe:');
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

/*
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

*/

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
