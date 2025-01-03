import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ISettingsOption, ISettingsOptionComponent } from 'ng/modules/preferences/interfaces/settings-option.interface';
import { UpdateSettingsValue } from 'ng/modules/preferences/states/actions/settings.action';
import { ISettingsValues, SettingsState } from 'ng/modules/preferences/states/settings.state';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    template: '',
    standalone: false
})
export class SettingsAbstractComponent<T = unknown> implements ISettingsOptionComponent, OnDestroy, AfterViewInit {
  /**
   * The settings option to visualize.
   */
  option!: ISettingsOption;

  /**
   * Stream triggering value changes.
   */
  @Select(SettingsState.values) values$!: Observable<ISettingsValues>;

  /**
   * Setting values mapping.
   */
  values: ISettingsValues = {};

  /**
   * The current setting value.
   */
  get value(): T {
    return this.values[this.option.id] as T;
  }

  set value(val: T) {
    if (val === this.values[this.option.id]) return;
    this.store.dispatch(new UpdateSettingsValue(this.option.id, val));
  }

  /**
   * Stream for subscribing to future change detections.
   */
  protected beforeChangeDetection$ = new Subject<void>();

  /**
   * Stream for listening to component destroy events.
   */
  protected destroy$ = new Subject<void>();

  constructor(protected cdr: ChangeDetectorRef, protected store: Store) {}

  /**
   * @inheritdoc
   */
  ngAfterViewInit() {
    this.values$.pipe(takeUntil(this.destroy$)).subscribe((values) => {
      if (this.values[this.option.id] === values[this.option.id]) return;
      this.values[this.option.id] = values[this.option.id];
      this.beforeChangeDetection$.next();
      this.cdr.markForCheck();
    });
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy() {
    this.beforeChangeDetection$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
