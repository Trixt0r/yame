import { Component, ElementRef, Output, EventEmitter } from '@angular/core';
import { ResizeableComponent } from 'ng/module/utils/idx';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs/Observable';
import { ISelectionState } from 'ng/module/toolbar/tools/selection/ngxs/state';
import { ISceneState } from 'ng/module/pixi/ngxs/state';
import { Translate, Rotate, Resize } from 'ng/module/toolbar/tools/selection/ngxs/actions';

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

  constructor(public ref: ElementRef, protected store: Store) {
    super(ref);
    this.maxVal = window.innerHeight - 100;
    this.selection$.subscribe(data => {
      this.setVisibility(data.entities.length > 0);
      this.data = data;
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
    const value = parseFloat((<HTMLInputElement>event.currentTarget).value);
    if (isNaN(value) || !isFinite(value)) return;
    const obj = this.data[object];
    const before = attr ? obj[attr] : obj;
    if (value === before) return;
    const newObj = typeof obj === 'object' ? Object.assign({ }, obj) : value;
    if (typeof newObj === 'object')
      newObj[attr] = value;
    switch (object) {
      case 'position': this.store.dispatch(new Translate(newObj)); break;
      case 'rotation': this.store.dispatch(new Rotate(newObj)); break;
      case 'size': this.store.dispatch(new Resize(newObj)); break;
    }
  }
}
