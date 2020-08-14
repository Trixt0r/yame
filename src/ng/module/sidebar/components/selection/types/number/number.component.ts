import { Component, ChangeDetectionStrategy, ViewChild, OnChanges, SimpleChanges, SimpleChange } from '@angular/core';
import { AbstractTypeComponent } from '../abstract';
import { NumberSceneComponent, SceneComponent } from 'common/scene';
import { MatInput } from '@angular/material/input';

@Component({
  templateUrl: './number.component.html',
  styleUrls: ['../style.scss', '../inline.actions.scss', './number.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative fill full block'
  },
})
export class NumberTypeComponent extends AbstractTypeComponent<NumberSceneComponent> implements OnChanges {

  static readonly type: string = 'number';

  /**
   * The input reference.
   */
  @ViewChild(MatInput) input: MatInput;

  /**
   * The value for rounding values.
   */
  decimal = 3;

  /**
   * THe current number value.
   */
  get number(): number | string {
    return typeof this.component.number === 'number' ? this.transform(this.component.number) as number : 0;
  }

  /**
   * @inheritdoc
   */
  onUpdate(event: any): void {
    const val: string | number = event.currentTarget.value;
    this.component.number = this.reverse(typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val) as number;
    this.component.mixed = false;
    return super.onUpdate(event);
  }

  /**
   * @inheritdoc
   */
  onExternalUpdate(): void {
    if (this.input) this.input.stateChanges.next();
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
    if (!changes.component) return;
    if (this.input) this.input.stateChanges.next();
  }
}
