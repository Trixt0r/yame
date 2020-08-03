import { Component, ChangeDetectionStrategy, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractTypeComponent } from '../abstract';
import { NumberSceneComponent } from 'common/scene';
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

  @ViewChild(MatInput) input: MatInput;

  decimal = 2;

  get number(): number | string {
    return typeof this.component.number === 'number' ? this.transform(this.component.number) : 0;
  }

  /**
   * @inheritdoc
   */
  update(event: any) {
    const val: string | number = event.currentTarget.value;
    this.component.number = this.reverse(typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val);
    this.component.mixed = false;
    return super.update(event);
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
    if (!changes.component) return;
    if (this.input) this.input.stateChanges.next();
  }
}
