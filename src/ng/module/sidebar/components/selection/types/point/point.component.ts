import { Component, ViewChild, ChangeDetectionStrategy, OnChanges, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { AbstractTypeComponent, AbstractInputEvent } from '../abstract';
import { PointSceneComponent } from 'common/scene/component/point';
import { PointInputComponent } from 'ng/module/utils';
import { IPoint } from 'pixi.js';

@Component({
  templateUrl: './point.component.html',
  styleUrls: ['../style.scss', '../inline.actions.scss', './point.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative fill full block'
  },
})
export class PointTypeComponent extends AbstractTypeComponent<PointSceneComponent> implements OnChanges {

  static readonly type: string = 'point';

  @ViewChild('input', { static: true }) input: PointInputComponent;

  get value() {
    return this.component.mixed ? { x: '', y: '' } : this.transform(this.component) || { x: 0, y: 0 };
  }

  constructor() {
    super();
    this.externalEvent.subscribe(() => {
      this.input.value = this.value;
      this.ngOnChanges();
    });
  }

  /**
   * @inheritdoc
   */
  update(event: any): void {
    if (!this.input.value) return;
    const reversed = this.reverse(this.input.value);
    this.component.x = reversed.x;
    this.component.y = reversed.y;
    this.component.mixed = false;
    const data: AbstractInputEvent<PointSceneComponent> = {
      originalEvent: event,
      component: this.component
    };
    this.updateEvent.emit(data);
  }

  /**
   * @inheritdoc
   */
  ngOnChanges() {
    this.input.stateChanges.next();
  }
}
