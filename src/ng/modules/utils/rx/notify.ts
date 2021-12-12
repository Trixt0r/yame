import { ChangeDetectorRef } from '@angular/core';
import { MonoTypeOperatorFunction, Observable } from 'rxjs';

/**
 * Makes sure the given change detector reference will be notified as soon as the source emitted a value.
 *
 * @param cdr The change detector reference to notify about changes.
 */
export function notify<T>(cdr: ChangeDetectorRef): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => {
    return new Observable((sub) => {
      source.subscribe({
        next: (val) => {
          sub.next(val);
          cdr.markForCheck();
        },
        error: (error) => {
          sub.error(error);
          cdr.markForCheck();
        },
        complete: () => sub.complete(),
      });
    });
  };
}
