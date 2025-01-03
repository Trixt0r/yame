import { AbstractTypeComponent } from '../abstract';
import { Component, ChangeDetectionStrategy, OnChanges, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { RangeSceneComponent } from 'common/scene';
import { TranslateService } from '@ngx-translate/core';
import { NzMarks } from 'ng-zorro-antd/slider';

@Component({
    selector: 'yame-type-component-range',
    templateUrl: './range.component.html',
    styleUrls: ['../style.scss', '../inline.actions.scss', './range.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class RangeTypeComponent extends AbstractTypeComponent<RangeSceneComponent> implements OnChanges {
  static readonly type: string = 'range';

  /**
   * The minimal allowed value.
   */
  get min(): number {
    return (this.component?.min as number) || 0;
  }

  /**
   * The maximum allowed value.
   */
  get max(): number {
    return (this.component?.max as number) || 100;
  }

  /**
   * The step value.
   */
  get step(): number {
    return (this.component?.step as number) || 1;
  }

  /**
   * The ticks value.
   */
  get ticks(): NzMarks | null {
    if (!this.component?.ticks) return null;
    if (typeof this.component.ticks === 'number') {
      const marks: NzMarks = {};
      for (let i = this.min; i <= this.max; i += this.component.ticks) marks[i] = String(i);
      return marks;
    }
    return this.component.ticks;
  }

  set value(value: number) {
    if (!this.component) return;
    this.component.value = this.reverse(value) as number;
    delete this.component.mixed;
    super.onUpdate({});
  }

  /**
   * The current value.
   */
  get value(): number {
    return !this.component?.mixed && typeof this.component?.value === 'number'
      ? (this.transform(this.component.value) as number)
      : 0;
  }

  constructor(protected translate: TranslateService, private cdr: ChangeDetectorRef) {
    super(translate);
  }

  /**
   * @inheritdoc
   */
  onExternalUpdate(): void {
    this.ngOnChanges();
  }

  /**
   * @inheritdoc
   */
  ngOnChanges() {
    this.cdr.markForCheck();
  }
}
