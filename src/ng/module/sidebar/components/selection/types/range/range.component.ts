import { AbstractTypeComponent } from '../abstract';
import { Component, ChangeDetectionStrategy, ViewChild, OnChanges, ChangeDetectorRef } from '@angular/core';
import { RangeSceneComponent } from 'common/scene';
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

  @ViewChild(MatSlider) slider: MatSlider;

  get min(): number {
    return this.component.min as number || 0;
  }

  get max(): number {
    return this.component.max as number || 100;
  }

  get step(): number {
    return this.component.step as number || 1;
  }

  get ticks(): number | 'auto' {
    return this.component.ticks ? this.component.ticks as number | 'auto' : 0;
  }

  get value(): number {
    return !this.component.mixed && typeof this.component.value === 'number' ? this.transform(this.component.value) : 0;
  }

  constructor(private cdr: ChangeDetectorRef) {
  super();
    this.externalEvent.subscribe(() => this.ngOnChanges());
  }

  /**
   * @inheritdoc
   */
  update(event: any) {
    this.component.value = this.reverse(event.value);
    this.component.mixed = false;
    return super.update(event);
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
