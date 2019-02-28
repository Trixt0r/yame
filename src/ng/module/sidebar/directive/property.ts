import {
  Directive,
  Input,
  ViewContainerRef,
  ComponentFactoryResolver,
  OnChanges,
  ComponentRef,
  EventEmitter,
  Output,
  SimpleChanges,
} from '@angular/core';
import { PropertyService } from '../service/property';
import { PropertyComponent, InputEvent } from '../component/property/abstract';
import { PropertyOptionsExt } from 'ng/module/pixi/scene/entity';

const componentRefCache: { [key: string]: { ref: ComponentRef<PropertyComponent>, index: number; } } = { };

@Directive({
  selector: '[propertyHost]',
})
export class PropertyDirective implements OnChanges {
  /** @type {Asset} The asset group to render. */
  @Input('propertyHost') properties: PropertyOptionsExt[];

  /** @type {EventEmitter<InputEvent>} The click event, which should be triggered by the rendered component. */
  @Output() update: EventEmitter<InputEvent> = new EventEmitter();

  constructor(
    private service: PropertyService,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
  ) { }

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.properties)
      this.render();
  }

  /**
   * Renders the group item, if a component type for the currently set group is registered.
   *
   * @returns {ComponentRef<AssetPreviewComponent>} The created component reference or `null`
   *                                          if no component found for the current group.
   */
  render(): ComponentRef<PropertyComponent>[] {
    const comps: ComponentRef<PropertyComponent>[] = [];
    const viewContainerRef = this.viewContainerRef;
    this.properties.forEach((property) => {
      const compType = this.service.get(property.type);
      if (!compType) return;
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
      const cacheKey = `${property.type}-${property.name}`;
      let componentRef: ComponentRef<PropertyComponent>;
      const cached = componentRefCache[cacheKey];
      if (cached) {
        componentRef = cached.ref;
        viewContainerRef.insert(componentRef.hostView, cached.index);
      } else {
        componentRef = viewContainerRef.createComponent(componentFactory);
        componentRef.instance.updateEvent.subscribe(event => this.update.emit(event));
        componentRefCache[cacheKey] = { ref: componentRef, index: viewContainerRef.indexOf(componentRef.hostView) };
      }
      componentRef.instance.property = property;
      comps.push(componentRef);
    });
    for (const key in componentRefCache) {
      if (!componentRefCache.hasOwnProperty(key)) continue;
      const cached = componentRefCache[key];
      const idx = viewContainerRef.indexOf(cached.ref.hostView);
      if (idx < 0 || comps.indexOf(cached.ref) >= 0) continue;
      viewContainerRef.detach(idx);
    }
    return comps;
  }
}
