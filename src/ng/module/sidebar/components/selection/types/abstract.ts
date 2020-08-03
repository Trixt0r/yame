import { EventEmitter, HostBinding } from '@angular/core';
import { SceneComponent, SceneEntity } from 'common/scene';
import { ISelectState } from 'ng/module/scene/states/select.state';

export interface AbstractInputEvent<T extends SceneComponent = SceneComponent> {
  originalEvent: any;
  component: T;
  index?: number;
}

export interface AbstractRemoveEvent<T extends SceneComponent = SceneComponent> {
  component: T;
  index?: number;
}

export abstract class AbstractTypeComponent<T extends SceneComponent = SceneComponent> {

  static readonly type: string = 'abstract';

  /**
   * The property, this component should render.
   */
  component: T;

  /**
   * The entities, this view belongs to.
   */
  entities: SceneEntity[];

  /**
   * The select state.
   */
  selectState: ISelectState = { entities: [], components: [] };

  /**
   * The parent this view belongs to.
   */
  parent: SceneComponent;

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

  get disabled(): boolean {
    return this.component.enabled === false;
  }


  @HostBinding('class.embedded')
  get embedded(): boolean {
    return !!this.component.group;
  }

  /**
   * The placeholder.
   */
  get placeholder(): any {
    if (!this.component) return '';
    return this.component && this.component.mixed ? '(mixed)' : this.component.placeholder || '';
  }

  /**
   * Handler, which emits the update event.
   *
   * @param event The original event emitted.
   */
  update(event: any) {
    const data: AbstractInputEvent<T> = {
      originalEvent: event,
      component: this.component
    };
    this.updateEvent.emit(data);
  }

  remove(event: any) {
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
      event.stopPropagation();
    }
    this.removeEvent.emit({ component: this.component });
  }

  edit(event: any) {
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  transform(value: any): any {
    if (!this.component.transform) return value;
    return this.component.transform.apply(value);
  }

  reverse(value: any): any {
    if (!this.component.transform) return value;
    return this.component.transform.reverse(value);
  }
}
