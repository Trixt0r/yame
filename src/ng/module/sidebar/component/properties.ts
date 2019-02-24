import { Component, ElementRef, Output, EventEmitter } from '@angular/core';
import { ResizeableComponent } from 'ng/module/utils/idx';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs/Observable';
import { ISelectionState } from 'ng/module/toolbar/tools/selection/ngxs/state';
import { ISceneState } from 'ng/module/pixi/ngxs/state';
import { UpdateSelection } from 'ng/module/toolbar/tools/selection/ngxs/actions';
import { DEG_TO_RAD } from 'pixi.js';
import { PixiService } from 'ng/module/pixi/idx';
import { UpdateEntity, UpdateEntityProperty } from 'ng/module/pixi/ngxs/actions';
import { EntityData } from 'ng/module/pixi/scene/entity';
import { MatSliderChange } from '@angular/material';

const transformable = ['number', 'range'];

@Component({
  moduleId: module.id.toString(),
  selector: 'yame-properties',
  templateUrl: 'properties.html',
  styleUrls: ['./properties.scss'],
})
export class PropertiesComponent extends ResizeableComponent {
  title = 'Properties';

  @Select() scene$: Observable<ISceneState>;
  @Select() selection$: Observable<ISelectionState>;
  @Output() updateVisibility = new EventEmitter();

  protected visible: boolean;

  data: ISelectionState;

  constructor(public ref: ElementRef, protected store: Store, protected pixi: PixiService) {
    super(ref);
    this.maxVal = window.innerHeight - 100;
    this.selection$.subscribe(data => {
      this.data = data;
      this.setVisibility(data.entities.length > 0);
    });
  }

  get isVisibile(): boolean {
    return this.visible;
  }

  setVisibility(visible: boolean) {
    if (visible === this.visible) return;
    this.visible = visible;
    (<HTMLElement>this.ref.nativeElement).style.display = this.visible ? 'block' : 'none';
    this.updateVisibility.next(this.visible);
  }

  /** @override */
  onResize() {
    this.maxVal = window.innerHeight - 100;
    super.onResize();
  }

  update(event: Event | MatSliderChange, attr: string) {
    const value = event instanceof MatSliderChange ? event.value : (<HTMLInputElement>event.currentTarget).value || '';
    const data = { };
    data[attr] = value;
    const observable = this.store.dispatch(new UpdateEntityProperty('select', data));
    if (this.data.entities.length !== 1) return;
    observable.subscribe(() => {
      const current = this.pixi.scene.find(entity => entity.id === this.data.entities[0]);
      if (!current) return;
      current.export('.').then(values => {
        this.store.dispatch(new UpdateEntity(values, `Update value ${attr}`));
      });
    });
  }
}
