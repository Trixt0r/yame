import { AbstractTypeComponent } from '../abstract';
import { Component, ChangeDetectionStrategy, OnChanges, ViewChild, SimpleChanges, SimpleChange } from '@angular/core';
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

  /**
   * The input reference.
   */
  @ViewChild(MatInput) input: MatInput;

  /**
   * @inheritdoc
   */
  onUpdate(event: any): void {
    (this.component as unknown as StringSceneComponent).string = this.reverse(event.currentTarget.value) as string;
    delete this.component.mixed;
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
