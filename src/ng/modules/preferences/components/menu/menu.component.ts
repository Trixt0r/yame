import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { IToolComponent, Tool } from 'ng/modules/toolbar/tool';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IPreferenceOption } from '../../interfaces/preference-option.interface';
import { PreferencesState } from '../../states/preferences.state';

@Component({
    templateUrl: 'menu.component.html',
    styleUrls: ['menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PreferencesMenuComponent implements IToolComponent, OnDestroy {
  /**
   * @inheritdoc
   */
  tool!: Tool;

  /**
   * Selector for getting the current preference menu options.
   */
  @Select(PreferencesState.options) options$!: Observable<IPreferenceOption[]>;

  /**
   * The list of preference options to render.
   */
  options: IPreferenceOption[] = [];

  /**
   * Triggered as soon as this component gets destroyed.
   */
  protected destroy$ = new Subject<void>();

  constructor(protected cdr: ChangeDetectorRef, protected store: Store) {
    
    this.options$.pipe(takeUntil(this.destroy$)).subscribe((options) => {
      this.options = options;
      this.cdr.markForCheck();
    });
  }

  /**
   * Handles an option click.
   *
   * @param option The clicked option.
   */
  onClick(option: IPreferenceOption): void {
    if (!option.action) return console.warn('[Preferences] Option has no action', option);
    this.store.dispatch(new option.action());
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
