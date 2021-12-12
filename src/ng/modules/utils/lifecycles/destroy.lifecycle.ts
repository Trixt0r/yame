import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Injectable for being used to auto unsubscribe to streams on the ngOnDestroy life-cycle.
 */
@Injectable()
export class DestroyLifecycle extends Subject<void> implements OnDestroy {
  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.next();
    this.complete();
  }
}
