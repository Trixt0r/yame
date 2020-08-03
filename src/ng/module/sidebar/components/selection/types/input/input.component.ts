import { AbstractTypeComponent } from '../abstract';
import { Component, ChangeDetectionStrategy, OnChanges, ViewChild, SimpleChanges } from '@angular/core';
import { SceneComponent, StringSceneComponent } from 'common/scene';
import { MatInput } from '@angular/material/input';

@Component({
  templateUrl: './input.component.html',
  styleUrls: ['../style.scss', '../inline.actions.scss', './input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative fill full block'
  },
})
export class InputTypeComponent<T extends SceneComponent = SceneComponent> extends AbstractTypeComponent<T> implements OnChanges {

  static readonly type: string = 'string';

  @ViewChild(MatInput) input: MatInput;

  /**
   * @inheritdoc
   */
  update(event: any) {
    (this.component as unknown as StringSceneComponent).string = this.reverse(event.currentTarget.value);
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
