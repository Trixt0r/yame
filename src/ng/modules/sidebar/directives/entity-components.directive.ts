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
  SimpleChange,
  ViewRef,
} from '@angular/core';
import { SceneComponentsService } from '../services/scene-components.service';
import { AbstractTypeComponent, AbstractInputEvent, AbstractRemoveEvent } from '../components/selection/types/abstract';
import { SceneComponent, SceneEntity } from 'common/scene';
import { Subscription } from 'rxjs';
import { ISelectState } from 'ng/modules/scene';
import { merge } from 'lodash';
import { v4 } from 'uuid';

type SceneComponentRef = ComponentRef<AbstractTypeComponent>;

/**
 * Defines the objects living in the property component ref cache.
 */
interface SceneComponentRefCacheObject {
  /**
   * The property component reference.
   */
  ref: SceneComponentRef;

  /**
   * The index at which it got attached.
   */
  index: number;
}

/**
 * The property component ref cache.
 */
interface SceneComponentRefCache {
  [key: string]: SceneComponentRefCacheObject;
}

/**
 * The property component ref pool.
 */
interface SceneComponentRefPool {
  [key: string]: SceneComponentRef[];
}

/**
 * The scene components directive is responsible for obtaining an angular component for a certain scene component type
 * and add it to the host element, delegating component type specific behavior.
 *
 * To get a component rendered for a certain type, the angular component has to be registered via the @see {SceneComponentsService}.
 *
 * The directive is using caching and pooling, to reuse already set up components.
 * This way lags won't be noticed during runtime.
 */
@Directive({
  selector: '[yameSceneComponents]',
})
export class EntityComponentsDirective implements OnChanges, OnInit, AfterViewInit {
  private static componentRefCache: SceneComponentRefCache = {};
  private static componentRefSubs: WeakMap<SceneComponentRef, Subscription[]> = new WeakMap();
  private static componentRefPool: SceneComponentRefPool = {};
  private static poolSizePerType = 20;

  /**
   * A list of scene components to attach to the host element.
   */
  @Input('yameSceneComponents') components: SceneComponent[] = [];

  /**
   * The entity reference. This reference is independent from the parent reference
   */
  @Input('yameSceneComponentsEntities') entities: SceneEntity[] = [];

  /**
   * The selected state.
   */
  @Input('yameSelectState') selectState: ISelectState = { entities: [], components: [], isolated: null };

  /**
   * The input event, which should be triggered by the rendered component.
   */
  @Output() yameSceneComponentsInput: EventEmitter<AbstractInputEvent> = new EventEmitter();

  /**
   * The remove event, which should be triggered by the rendered component.
   */
  @Output() yameSceneComponentsRemove: EventEmitter<AbstractRemoveEvent> = new EventEmitter();

  /**
   * The components update event, which should be triggered, as soon as the data model got updated.
   */
  @Output() componentsUpdate = new EventEmitter<SceneComponent[]>();

  /**
   * The internal cache prefix to prevent cache collisions with other instances.
   */
  protected cachePrefix: string;

  constructor(
    private service: SceneComponentsService,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    this.cachePrefix = v4();
  }

  /**
   * Creates an angular scene component.
   *
   * @param componentFactory The factory for creating the view.
   * @param value Optional component.
   */
  protected createComponent(
    componentFactory: ComponentFactory<AbstractTypeComponent>,
    value?: SceneComponent,
    index?: number
  ): SceneComponentRef {
    const componentRef = this.viewContainerRef.createComponent(componentFactory, index);
    if (value) componentRef.instance.component = value;
    return componentRef;
  }

  /**
   * Makes sure the components get updated based on the change.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.components) return;
    this.render();
  }

  /**
   * Sets up the component ref pool.
   */
  ngOnInit(): void {
    this.setUpPool();
  }

  /**
   * Sets up the component ref pool.
   */
  setUpPool(): void {
    const types = this.service.types;
    types.forEach((type) => {
      if (!EntityComponentsDirective.componentRefPool[type]) EntityComponentsDirective.componentRefPool[type] = [];
      const pool = EntityComponentsDirective.componentRefPool[type];
      const compType = this.service.getTypeComponent(type);
      if (!compType) return;
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
      const count = EntityComponentsDirective.poolSizePerType - pool.length;
      for (let i = 0; i < count; i++) pool.push(this.createComponent(componentFactory, <any>{}));
    });
  }

  /**
   * Detaches all previously pooled component references.
   */
  ngAfterViewInit(): void {
    const types = this.service.types;
    types.forEach((type) => {
      if (!EntityComponentsDirective.componentRefPool[type]) return;
      EntityComponentsDirective.componentRefPool[type].forEach((ref) => {
        const idx = this.viewContainerRef.indexOf(ref.hostView);
        if (idx >= 0) this.viewContainerRef.detach(idx);
      });
    });
  }

  /**
   * Obtains a component reference from the pool.
   *
   * @param type
   * @return The component reference or `null`.
   */
  obtainComponentRef(type: string): SceneComponentRef | null {
    const pool = EntityComponentsDirective.componentRefPool[type];
    if (!pool || pool.length === 0) return null;
    return pool.shift() as SceneComponentRef;
  }

  /**
   * Attaches components to the host element, based on the currently assigned properties.
   *
   * Makes sure that components, which were already initialized, get reused.
   * Either from the component ref cache or pool.
   *
   * @return The rendered component references.
   */
  render(): SceneComponentRef[] {
    const comps: SceneComponentRef[] = [];
    if (this.components) {
      let insertCnt = 0;
      this.components.forEach((component) => {
        if (component.hidden) return;
        let identifier = component.id ? component.id : component.type;
        let compType = this.service.getTypeComponent(identifier);
        if (component.id && !compType) {
          compType = this.service.getTypeComponent(component.type);
          if (!compType && component.extends) {
            compType = this.service.getTypeComponent(component.extends);
            identifier = component.extends;
          } else {
            identifier = component.type;
          }
        }
        if (!compType) return;
        const cacheKey = `${this.cachePrefix}-${component.type}-${component.id}`;
        let componentRef: SceneComponentRef;
        let cached = EntityComponentsDirective.componentRefCache[cacheKey];
        if (cached) {
          componentRef = cached.ref;
          this.viewContainerRef.insert(componentRef.hostView, insertCnt++);
        } else {
          componentRef = this.obtainComponentRef(identifier) as SceneComponentRef;
          if (!componentRef) {
            componentRef = this.createComponent(
              this.componentFactoryResolver.resolveComponentFactory(compType),
              void 0,
              insertCnt++
            );
          } else {
            this.viewContainerRef.insert(componentRef.hostView, insertCnt++);
          }
          cached = EntityComponentsDirective.componentRefCache[cacheKey] = {
            ref: componentRef,
            index: this.viewContainerRef.indexOf(componentRef.hostView),
          };
        }
        if (!(<any>componentRef).__tmp) (<any>componentRef).__tmp = v4();
        const previous = componentRef.instance.component;
        componentRef.instance.component = component;
        componentRef.instance.entities = this.entities;
        componentRef.instance.selectState = this.selectState;
        if (typeof (componentRef.instance as any).ngOnChanges === 'function')
          (componentRef.instance as any).ngOnChanges({
            component: new SimpleChange(previous, component, previous === void 0),
          });
        componentRef.changeDetectorRef.detectChanges();
        this.setUpSubs(componentRef);
        comps.push(componentRef);
      });
      this.detachCachedComponentRefs(comps);
    }
    return comps;
  }

  /**
   * Detaches all component references from the host element based on the given attached component references.
   *
   * @param attached A list of component references.
   * @return The detached view references.
   */
  detachCachedComponentRefs(attached: SceneComponentRef[]): ViewRef[] {
    const detached: ViewRef[] = [];
    const keys = Object.keys(EntityComponentsDirective.componentRefCache);
    keys.forEach((key) => {
      if (key.indexOf(this.cachePrefix) < 0) return;
      if (!EntityComponentsDirective.componentRefCache.hasOwnProperty(key)) return;
      const cached = EntityComponentsDirective.componentRefCache[key];
      const idx = this.viewContainerRef.indexOf(cached.ref.hostView);
      if (idx < 0 || attached.indexOf(cached.ref) >= 0) return;
      if (cached.ref) this.removeSubs(cached.ref);
      delete EntityComponentsDirective.componentRefCache[key];
      const ref = this.viewContainerRef.detach(idx);
      if (ref) detached.push(ref);
    });
    return detached;
  }

  /**
   * Subscribes to the events emitted by the instance of the given component reference.
   *
   * @param componentRef
   */
  setUpSubs(componentRef: SceneComponentRef): void {
    this.removeSubs(componentRef);
    EntityComponentsDirective.componentRefSubs.set(componentRef, [
      componentRef.instance.updateEvent.subscribe((event: AbstractInputEvent) =>
        this.yameSceneComponentsInput.emit(event)
      ),
      componentRef.instance.removeEvent.subscribe((event: AbstractRemoveEvent) =>
        this.yameSceneComponentsRemove.emit(event)
      ),
      this.componentsUpdate.subscribe((components: SceneComponent[]) => {
        if (!componentRef.instance.component) return;
        const found = components.find((it) => it.id === componentRef.instance?.component?.id);
        if (found) {
          merge(componentRef.instance.component, found);
          componentRef.changeDetectorRef.markForCheck();
        }
        componentRef.instance.externalEvent.emit(components);
      }),
    ]);
  }

  /**
   * Unsubscribes from the events emitted by the instance of the given component reference.
   *
   * @param componentRef
   */
  removeSubs(componentRef: SceneComponentRef): void {
    const subs = EntityComponentsDirective.componentRefSubs.get(componentRef);
    if (!subs || subs.length === 0) return;
    subs.forEach((sub) => sub.unsubscribe());
  }
}
