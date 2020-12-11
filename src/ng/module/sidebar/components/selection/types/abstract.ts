import { EventEmitter, HostBinding, OnDestroy } from '@angular/core';
import { SceneComponent, SceneEntity } from 'common/scene';
import { ISelectState } from 'ng/module/scene';
import { Subscription } from 'rxjs';

export interface AbstractInputEvent<T extends SceneComponent = SceneComponent> {
  originalEvent: any;
  component?: T | null;
  index?: number;
}

export interface AbstractRemoveEvent<T extends SceneComponent = SceneComponent> {
  component?: T | null;
  index?: number;
}

export abstract class AbstractTypeComponent<T extends SceneComponent = SceneComponent> implements OnDestroy {

  static readonly type: string = 'abstract';

  /**
   * The property, this component should render.
   */
  component?: T | null;

  /**
   * The entities, this view belongs to.
   */
  entities?: SceneEntity[];

  /**
   * The select state.
   */
  selectState: ISelectState = { entities: [], components: [], isolated: null };

  /**
   * The parent this view belongs to.
   */
  parent?: SceneComponent;

  /**
   * The event, triggered when the scene component has been updated by the view component.
   */
  updateEvent: EventEmitter<AbstractInputEvent<T>> = new EventEmitter();

  /**
   * The event, triggered when the scene component has been removed.
   */
  removeEvent: EventEmitter<AbstractRemoveEvent<T>> = new EventEmitter();

  /**
   * The event, triggered when the scene component has been updated from outside.
   */
  externalEvent: EventEmitter<SceneComponent[]> = new EventEmitter();

  protected _externalEventSub: Subscription;

  /**
   * Whether this component is disabled or not.
   */
  get disabled(): boolean {
    return this.component?.enabled === false;
  }

  /**
   * The placeholder.
   */
  get placeholder(): any {
    if (!this.component) return '';
    return this.component && this.component.mixed ? '(mixed)' : this.component.placeholder || '';
  }


  @HostBinding('class.embedded')
  get embedded(): boolean {
    return !!this.component?.group;
  }

  constructor() {
    this._externalEventSub = this.externalEvent.subscribe((comps: SceneComponent[]) => {
      const found = comps.find(comp => comp.id === this.component?.id);
      if (!found) return;
      this.onExternalUpdate(comps);
    });
  }

  /**
   * Handles an update event by re-emitting it again,
   * so it bubbles up to update listeners of this component.
   *
   * @param event The original event emitted.
   */
  onUpdate(event: any): void {
    const data: AbstractInputEvent<T> = {
      originalEvent: event,
      component: this.component
    };
    this.updateEvent.emit(data);
  }

  /**
   * Handles a remove event by re-emitting it again,
   * so it bubbles up to update listeners of this component.
   *
   * @param event The original event emitted.
   */
  onRemove(event: any): void {
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
      event.stopPropagation();
    }
    this.removeEvent.emit({ component: this.component });
  }

  /**
   * Called as soon as an external update occurs on this component.
   * Override to your needs.
   *
   * @param comps The updated components.
   */
  onExternalUpdate(comps: SceneComponent[]): void { }

  /**
   * Transforms the given value, based on the currently set component.
   *
   * @param value The value to transform.
   * @return The transformed value or the original value.
   */
  transform(value: unknown): unknown {
    if (!this.component?.transform) return value;
    return this.component?.transform.apply(value);
  }

  /**
   * Reverses the given value, based on the currently set component.
   *
   * @param value The value to reverse.
   * @return The reversed value or the given value.
   */
  reverse(value: unknown): unknown {
    if (!this.component?.transform) return value;
    return this.component?.transform.reverse(value);
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this._externalEventSub.unsubscribe();
  }
}
