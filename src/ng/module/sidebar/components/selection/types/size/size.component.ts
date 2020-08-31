import { Component, ViewChild, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { AbstractTypeComponent, AbstractInputEvent } from '../abstract';
import { PointInputComponent } from 'ng/module/utils';
import { IPoint } from 'common/math';
import { SizeSceneComponent } from 'common/scene/component/size';
import { IPointData } from 'pixi.js';

@Component({
  templateUrl: './size.component.html',
  styleUrls: ['../style.scss', '../inline.actions.scss', './size.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative fill full block'
  },
})
export class SizeTypeComponent extends AbstractTypeComponent<SizeSceneComponent> implements OnChanges {

  static readonly type: string = 'size';

  /**
   * The input reference.
   */
  @ViewChild('input', { static: true }) input: PointInputComponent;

  /**
   * Internal transformed value data.
   */
  protected val: IPointData;

  /**
   * The current value.
   */
  get value() {
    return this.val;
  }

  /**
   * @inheritdoc
   */
  onUpdate(event: any): void {
    if (!this.input.value) return;
    const reversed = this.reverse(this.input.value) as IPoint;
    this.component.width = reversed.x;
    this.component.height = reversed.y;
    this.component.mixed = false;
    const data: AbstractInputEvent<SizeSceneComponent> = {
      originalEvent: event,
      component: this.component
    };
    this.updateEvent.emit(data);
  }

  /**
   * @inheritdoc
   */
  onExternalUpdate(): void {
    this.input.value = this.value as IPoint;
    this.ngOnChanges();
  }

  /**
   * @inheritdoc
   */
  ngOnChanges() {
    if (this.component.mixed) {
      this.val = { x: '', y: '' } as unknown as IPointData;
    } else {
      const transformed = this.transform(this.component) as SizeSceneComponent;
      this.val = transformed ? { x: transformed.width, y: transformed.height } : { x: 0, y: 0 };
    }
    this.input.stateChanges.next();
  }
}
