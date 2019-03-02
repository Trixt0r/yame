import { Component, ElementRef, Output, EventEmitter, AfterViewInit, NgZone } from '@angular/core';
import { ResizeableComponent } from 'ng/module/utils/idx';
import { Store, Select as StoreSelect } from '@ngxs/store';
import { Observable } from 'rxjs/Observable';
import { ISelectionState } from 'ng/module/toolbar/tools/selection/ngxs/state';
import { UpdateEntityProperty } from 'ng/module/pixi/ngxs/actions';
import { Property } from './property/abstract';

function state(state: any) {
  return state.selection;
}

@Component({
  moduleId: module.id.toString(),
  selector: 'yame-properties',
  templateUrl: 'properties.html',
  styleUrls: ['./properties.scss'],
})
export class PropertiesComponent extends ResizeableComponent implements AfterViewInit {
  title = 'Properties';

  @Output() updateVisibility = new EventEmitter();

  protected visible;
  protected onResizeBind: EventListenerObject;

  properties: Property[];
  entities: string[] = [];

  constructor(public ref: ElementRef, protected store: Store, protected zone: NgZone) {
    super(ref, zone);
    this.maxVal = window.innerHeight - 100;
    this.onResizeBind = this.onResize.bind(this);
    this.setVisibility(false);
    this.zone.runOutsideAngular(() => window.addEventListener('resize', this.onResizeBind));
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

  dispatch(property: Property) {
    this.store.dispatch(new UpdateEntityProperty('select', { [property.name]: property.value }));
  }
}
