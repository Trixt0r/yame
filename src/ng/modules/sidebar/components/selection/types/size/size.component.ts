import { Component, ViewChild, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { AbstractTypeComponent, AbstractInputEvent } from '../abstract';
import { PointInputComponent } from 'ng/modules/utils';
import { IPoint } from 'common/math';
import { SizeSceneComponent } from 'common/scene/component/size';
import { IPointData } from 'pixi.js';
import { PointSceneComponent } from 'common/scene';
import { cloneDeep } from 'lodash';
import { TranslateService } from '@ngx-translate/core';

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
  @ViewChild('input', { static: true }) input!: PointInputComponent;

  /**
   * Internal transformed value data.
   */
  protected val?: IPointData;

  /**
   * The current value.
   */
  get value() {
    return this.val;
  }

  constructor(protected translate: TranslateService) {
    super(translate);
  }

  /**
   * @inheritdoc
   */
  onUpdate(event: any): void {
    if (!this.input.value || !this.component) return;
    const reversed = this.reverse(this.input.value) as IPoint;
    this.component.width = reversed.x;
    this.component.height = reversed.y;
    let scale = this.selectState.components.find(comp => comp.type === 'scale') as PointSceneComponent;
    if (!scale) return;
    scale = cloneDeep(scale);
    if (this.component.localWidth !== 0) scale.x = this.component.width / this.component.localWidth;
    else scale.x = 0;
    if (this.component.localHeight !== 0) scale.y = this.component.height / this.component.localHeight;
    else scale.y = 0;
    delete this.component.mixed;
    const data: AbstractInputEvent<PointSceneComponent> = {
      originalEvent: event,
      component: scale
    };
    this.updateEvent.emit(data as any);
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
    if (this.component?.mixed) {
      this.val = { x: '', y: '' } as unknown as IPointData;
    } else {
      const transformed = this.transform(this.component) as SizeSceneComponent;
      this.val = transformed ? { x: transformed.width, y: transformed.height } : { x: 0, y: 0 };
    }
    this.input.stateChanges.next();
  }
}
