import {
  Component,
  ElementRef,
  Output,
  EventEmitter,
  AfterViewInit,
  NgZone,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ResizeableComponent } from 'ng/module/utils/idx';
import { Store, Select as StoreSelect } from '@ngxs/store';
import { Observable } from 'rxjs/Observable';
import { ISelectionState } from 'ng/module/toolbar/tools/selection/ngxs/state';
import { PixiService } from 'ng/module/pixi/idx';
import { UpdateEntity, UpdateEntityProperty } from 'ng/module/pixi/ngxs/actions';
import { MatSliderChange } from '@angular/material';
import { PropertyOptionsExt } from 'ng/module/pixi/scene/entity';

function state(state: any) {
  return state.selection;
}

@Component({
  moduleId: module.id.toString(),
  selector: 'yame-properties',
  templateUrl: 'properties.html',
  styleUrls: ['./properties.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesComponent extends ResizeableComponent implements AfterViewInit {
  title = 'Properties';

  @StoreSelect(state) selection$: Observable<ISelectionState>;
  @Output() updateVisibility = new EventEmitter();

  protected visible;
  protected onResizeBind: EventListenerObject;

  properties: PropertyOptionsExt[];
  entities: string[] = [];
  private timer: any;

  constructor(
    public ref: ElementRef,
    protected store: Store,
    protected pixi: PixiService,
    protected zone: NgZone,
    protected cdr: ChangeDetectorRef
  ) {
    super(ref, zone);
    this.maxVal = window.innerHeight - 100;
    this.onResizeBind = this.onResize.bind(this);
    this.zone.runOutsideAngular(() => {
      this.selection$.subscribe(data => {
          if (this.timer) clearTimeout(this.timer);
          this.timer = setTimeout(() => {
            this.properties = data.properties;
            this.entities = data.entities;
            this.setVisibility(this.entities.length > 0);
            cdr.detectChanges();
          }, 1000 / 30);
      });
    });
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

  update(event: Event | MatSliderChange, attr: string) {
    const value = event instanceof MatSliderChange ? event.value : (<HTMLInputElement>event.currentTarget).value || '';
    const data = {};
    data[attr] = value;
    const observable = this.store.dispatch(new UpdateEntityProperty('select', data));
    if (this.entities.length !== 1) return;
    this.zone.runOutsideAngular(() => {
      observable.subscribe(() => {
        const current = this.pixi.scene.find(entity => entity.id === this.entities[0]);
        if (!current) return;
        current.export('.').then(values => {
          this.store.dispatch(new UpdateEntity(values, `Update value ${attr}`));
        });
      });
    });
  }
}
