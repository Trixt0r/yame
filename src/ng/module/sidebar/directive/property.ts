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
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { PropertyService } from '../service/property';
import { PropertyComponent, InputEvent } from '../component/property/abstract';
import { PropertyOptionsExt } from 'ng/module/pixi/scene/entity';

const componentRefCache: { [key: string]: { ref: ComponentRef<PropertyComponent>; index: number } } = {};
const componentRefPool: { [key: string]: ComponentRef<PropertyComponent>[] } = {};
const poolSizePerType = 20;

@Directive({
  selector: '[propertyHost]',
})
export class PropertyDirective implements OnChanges, OnInit, AfterViewInit {
  /** @type {Asset} The asset group to render. */
  @Input('propertyHost') properties: PropertyOptionsExt[];

  /** @type {EventEmitter<InputEvent>} The click event, which should be triggered by the rendered component. */
  @Output() input: EventEmitter<InputEvent> = new EventEmitter();

  constructor(
    private service: PropertyService,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
  }

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.properties) {
      this.render();
    }
  }

  /**
   * Sets up the compnent ref pool.
   */
  ngOnInit(): void {
    this.setUpPool();
  }

  /**
   * Sets up the component ref pool
   */
  setUpPool(): void {
    const types = this.service.types;
    types.forEach(type => {
      if (!componentRefPool[type]) componentRefPool[type] = [];
      const pool = componentRefPool[type];
      const compType = this.service.get(type);
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
      const count = poolSizePerType - pool.length;
      for (let i = 0; i < count; i++) {
        const componentRef = this.viewContainerRef.createComponent(componentFactory);
        componentRef.instance.updateEvent.subscribe(event => this.input.emit(event));
        componentRef.instance.property = <any>{ };
        pool.push(componentRef);
      }
    });
  }

  /**
   * Detaches all previously pooled component refs.
   */
  ngAfterViewInit(): void {
    const types = this.service.types;
    types.forEach(type => {
      componentRefPool[type].forEach(ref => {
        this.viewContainerRef.detach( this.viewContainerRef.indexOf(ref.hostView));
      });
    });
  }

  /**
   * Obtains a component reference from the pool.
   *
   * @param {string} type
   * @returns {ComponentRef<PropertyComponent>}
   */
  obtainComponentRef(type: string): ComponentRef<PropertyComponent> {
    const pool = componentRefPool[type];
    if (!pool || pool.length === 0) return null;
    return pool.shift();
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
    if (this.properties) {
      this.properties.forEach(property => {
        const compType = this.service.get(property.type);
        if (!compType) return;
        const cacheKey = `${property.type}-${property.name}`;
        let componentRef: ComponentRef<PropertyComponent>;
        const cached = componentRefCache[cacheKey];
        if (cached) {
          componentRef = cached.ref;
          viewContainerRef.insert(componentRef.hostView, cached.index);
        } else {
          componentRef = this.obtainComponentRef(property.type);
          if (!componentRef) {
            const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
            componentRef = viewContainerRef.createComponent(componentFactory);
            componentRef.instance.updateEvent.subscribe(event => this.input.emit(event));
          } else {
            viewContainerRef.insert(componentRef.hostView);
          }
          componentRefCache[cacheKey] = { ref: componentRef, index: viewContainerRef.indexOf(componentRef.hostView) };
        }
        componentRef.instance.property = property;
        comps.push(componentRef);
      });
    }
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
