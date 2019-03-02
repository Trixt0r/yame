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
  ComponentFactory,
} from '@angular/core';
import { PropertyService } from '../service/property';
import { PropertyComponent, InputEvent, Property } from '../component/property/abstract';
import * as uuid from 'uuid/v4';

type PropertyComponentRef = ComponentRef<PropertyComponent>;

/**
 * Defines the objects living in the property component ref cache.
 *
 * @interface PropertyComponentRefCacheObject
 */
interface PropertyComponentRefCacheObject {
  /**
   * @type {PropertyComponentRef} The property component reference.
   */
  ref: PropertyComponentRef;

  /**
   * @type {number} The index at which it got attached.
   */
  index: number;
}

/**
 * The property component ref cache.
 *
 * @interface PropertyComponenRefCache
 */
interface PropertyComponenRefCache {
  [key: string]: PropertyComponentRefCacheObject;
}

/**
 * The property component ref pool.
 *
 * @interface PropertyComponenRefPool
 */
interface PropertyComponenRefPool {
  [key: string]: PropertyComponentRef[];
}

/**
 * The properties host directive is responsible for obtaining a component for a certain property type and add it to
 * the host element, delegating property specific behaviour and rendering to the component.
 *
 * To get a component rendered for a property type, the component has to registered via the @see {PropertyService} .
 *
 * The directive is using caching and pooling, to reuse already set up components.
 * This way lags won't be noticed during runtime.
 *
 * @export
 * @class PropertiesDirective
 * @implements {OnChanges}
 * @implements {OnInit}
 * @implements {AfterViewInit}
 */
@Directive({
  selector: '[propertiesHost]',
})
export class PropertiesDirective implements OnChanges, OnInit, AfterViewInit {
  private static componentRefCache: PropertyComponenRefCache = {};
  private static componentRefPool: PropertyComponenRefPool = {};
  private static poolSizePerType = 20;

  /**
   * @type {Property[]} A list of properties to attach to the host element.
   */
  @Input('propertiesHost') properties: Property[];

  /**
   * @type {EventEmitter<InputEvent>} The click event, which should be triggered by the rendered component.
   */
  @Output() input: EventEmitter<InputEvent> = new EventEmitter();

  /**
   * @protected
   * @type {string} The internal cache prefix to prevent cache collisions with other instances.
   */
  protected cachePrefix: string;

  constructor(
    private service: PropertyService,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    this.cachePrefix = uuid();
  }

  /**
   * Creates a property component and makes sure the event handler is bound.
   *
   * @protected
   * @param {ComponentFactory<PropertyComponent>} componentFactory
   * @param {Property} [value]
   * @returns {PropertyComponentRef}
   */
  protected createComponent(
    componentFactory: ComponentFactory<PropertyComponent>,
    value?: Property
  ): PropertyComponentRef {
    const componentRef = this.viewContainerRef.createComponent(componentFactory);
    componentRef.instance.updateEvent.subscribe(event => this.input.emit(event));
    if (value) componentRef.instance.property = value;
    return componentRef;
  }

  /**
   * Makes sure the components get updated based on the change.
   *
   * @override
   * @param {SimpleChanges} changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.properties) {
      this.render();
    }
  }

  /**
   * Sets up the compnent ref pool.
   *
   * @override
   */
  ngOnInit(): void {
    this.setUpPool();
  }

  /**
   * Sets up the component ref pool.
   */
  setUpPool(): void {
    const types = this.service.types;
    types.forEach(type => {
      if (!PropertiesDirective.componentRefPool[type]) PropertiesDirective.componentRefPool[type] = [];
      const pool = PropertiesDirective.componentRefPool[type];
      const compType = this.service.get(type);
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
      const count = PropertiesDirective.poolSizePerType - pool.length;
      for (let i = 0; i < count; i++) pool.push(this.createComponent(componentFactory, <any>{}));
    });
  }

  /**
   * Detaches all previously pooled component references.
   *
   * @override
   */
  ngAfterViewInit(): void {
    const types = this.service.types;
    types.forEach(type => {
      PropertiesDirective.componentRefPool[type].forEach(ref => {
        this.viewContainerRef.detach(this.viewContainerRef.indexOf(ref.hostView));
      });
    });
  }

  /**
   * Obtains a component reference from the pool.
   *
   * @param {string} type
   * @returns {PropertyComponentRef}
   */
  obtainComponentRef(type: string): PropertyComponentRef {
    const pool = PropertiesDirective.componentRefPool[type];
    if (!pool || pool.length === 0) return null;
    return pool.shift();
  }

  /**
   * Attaches components to the host element, based on the currently assigned properties.
   *
   * Makes sure that components, which were already initialized, get reused.
   * Either from the component ref cache or pool.
   *
   * @returns {PropertyComponentRef[]} The attached component references.
   */
  render(): PropertyComponentRef[] {
    const comps: PropertyComponentRef[] = [];
    if (this.properties)
      this.properties.forEach(property => {
        const compType = this.service.get(property.type);
        if (!compType) return;
        const cacheKey = `${this.cachePrefix}-${property.type}-${property.name}`;
        let componentRef: PropertyComponentRef;
        const cached = PropertiesDirective.componentRefCache[cacheKey];
        if (cached) {
          componentRef = cached.ref;
          this.viewContainerRef.insert(componentRef.hostView, cached.index);
        } else {
          componentRef = this.obtainComponentRef(property.type);
          if (!componentRef)
            componentRef = this.createComponent(this.componentFactoryResolver.resolveComponentFactory(compType));
          else this.viewContainerRef.insert(componentRef.hostView);
          PropertiesDirective.componentRefCache[cacheKey] = {
            ref: componentRef,
            index: this.viewContainerRef.indexOf(componentRef.hostView),
          };
        }
        componentRef.instance.property = property;
        comps.push(componentRef);
      });
    this.detachCachedComponentRefs(comps);
    return comps;
  }

  /**
   * Detaches all component references from the host element based on the given attached component references.
   *
   * @param {PropertyComponentRef[]} attached
   * @returns {PropertyComponentRef[]}
   */
  detachCachedComponentRefs(attached: PropertyComponentRef[]): PropertyComponentRef[] {
    const detached = [];
    for (const key in PropertiesDirective.componentRefCache) {
      if (!PropertiesDirective.componentRefCache.hasOwnProperty(key)) continue;
      const cached = PropertiesDirective.componentRefCache[key];
      const idx = this.viewContainerRef.indexOf(cached.ref.hostView);
      if (idx < 0 || attached.indexOf(cached.ref) >= 0) continue;
      detached.push(this.viewContainerRef.detach(idx));
    }
    return detached;
  }
}
