import { AbstractTypeComponent } from '../abstract';
import { Component, ChangeDetectionStrategy, ViewChild, OnChanges, ChangeDetectorRef } from '@angular/core';
import { RangeSceneComponent, SceneComponent } from 'common/scene';
import { MatSlider, MatSliderChange } from '@angular/material/slider';

@Component({
  templateUrl: './range.component.html',
  styleUrls: ['../style.scss', '../inline.actions.scss', './range.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative fill full block'
  },
})
export class RangeTypeComponent extends AbstractTypeComponent<RangeSceneComponent> implements OnChanges {

  static readonly type: string = 'range';

  /**
   * The slider reference.
   */
  @ViewChild(MatSlider) slider: MatSlider;

  /**
   * The minimal allowed value.
   */
  get min(): number {
    return this.component.min as number || 0;
  }

  /**
   * The maximum allowed value.
   */
  get max(): number {
    return this.component.max as number || 100;
  }

  /**
   * The step value.
   */
  get step(): number {
    return this.component.step as number || 1;
  }

  /**
   * The ticks value.
   */
  get ticks(): number | 'auto' {
    return this.component.ticks ? this.component.ticks as number | 'auto' : 0;
  }

  /**
   * The current value.
   */
  get value(): number {
    return !this.component.mixed && typeof this.component.value === 'number' ? this.transform(this.component.value) as number : 0;
  }

  constructor(private cdr: ChangeDetectorRef) {
    super();
  }

  /**
   * @inheritdoc
   */
  onUpdate(event: any): void {
    this.component.value = this.reverse(event.value) as number;
    delete this.component.mixed;
    return super.onUpdate(event);
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
    if (!this.slider) return;
    const change = new MatSliderChange();
    change.value = this.value;
    this.slider.change.emit(change);
    this.cdr.markForCheck();
  }

}
