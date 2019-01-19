import { Component, ElementRef, Output, EventEmitter } from '@angular/core';
import { ResizeableComponent } from 'ng/module/utils/idx';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs/Observable';
import { ISelectionState } from 'ng/module/toolbar/tools/selection/ngxs/state';
import { ISceneState } from 'ng/module/pixi/ngxs/state';
import { Translate, Rotate, Resize } from 'ng/module/toolbar/tools/selection/ngxs/actions';
import { DEG_TO_RAD } from 'pixi.js';
import { PixiService } from 'ng/module/pixi/idx';
import { UpdateEntity } from 'ng/module/pixi/ngxs/actions';
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
      delete (<any>data).additional;
      this.setVisibility(data.entities.length > 0);
      this.data = data;
      delete (<any>this.data).additionalBefore;
      delete (<any>this.data).additionalAfter;
      if (!this.visible || data.entities.length > 1) return;
      const id = data.entities[0];
      const entity = pixi.scene.find(e => e.id === id, void 0, true);
      if (!entity) return;
      const before = ['id', 'name'];
      const additional = [];
      const types = (<any>entity).internalPropertyOptions;
      for (const x in types) {
        if (before.indexOf(x) < 0 || !types[x].export) continue;
        const obj = Object.assign({ }, types[x], { name: x, value: entity[x] });
        if (typeof obj.transform === 'number' && transformable.indexOf(obj.type) >= 0)
          obj.value *= obj.transform;
        additional.push(obj);
      }
      (<any>data).additionalBefore = additional.slice();
      const skip = ['visibility', 'locked', 'position', 'scale', 'rotation', 'type', 'parentEntity', 'id', 'name'];
      additional.splice(0);
      for (const x in types) {
        if (skip.indexOf(x) >= 0 || !types[x].export) continue;
        const obj = Object.assign({ }, types[x], { name: x, value: entity[x] });
        if (typeof obj.transform === 'number' && transformable.indexOf(obj.type) >= 0)
          obj.value *= obj.transform;
        additional.push(obj);
      }
      (<any>data).additionalAfter = additional;
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

  change(event: Event, object: string, attr?: string) {
    const value = parseFloat((<HTMLInputElement>event.currentTarget).value.replace(',', '.'));
    if (isNaN(value) || !isFinite(value)) return;
    const obj = this.data[object];
    const before = attr ? obj[attr] : obj;
    if (value === before) return;
    const newObj = typeof obj === 'object' ? Object.assign({}, obj) : value;
    if (typeof newObj === 'object') newObj[attr] = value;
    if (object === 'size') newObj[attr] /= 100;
    switch (object) {
      case 'position':
        this.store.dispatch(new Translate(newObj));
        break;
      case 'rotation':
        this.store.dispatch(new Rotate(DEG_TO_RAD * newObj));
        break;
      case 'size':
        this.store.dispatch(new Resize(newObj));
        break;
    }
  }

  update(event: Event | MatSliderChange, attr: string) {
    if (this.data.entities.length !== 1) return;
    const value = event instanceof MatSliderChange ? event.value : (<HTMLInputElement>event.currentTarget).value || '';
    const current = this.pixi.scene.find(entity => entity.id === this.data.entities[0]);
    if (!current) return;
    const typeOptions = (<any>current).internalPropertyOptions;
    const options = typeOptions[attr];
    if (!options) return;
    let val;
    switch (options.type) {
      case 'color': val = typeof value === 'string' ? parseInt(value.replace('#', ''), 16) : val; break;
      case 'number': val = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : val; break;
      default: val = value;
    }
    if (typeof options.transform === 'number' && transformable.indexOf(options.type) >= 0)
      val /= options.transform;
    current.export('.')
      .then(data => {
        data[attr] = val;
        this.store.dispatch(new UpdateEntity(data, `Update value ${attr}`));
      });
  }
}
