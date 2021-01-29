import { Component, EventEmitter, HostBinding, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SceneComponent, SceneEntity } from 'common/scene';
import { ISelectState } from 'ng/modules/scene';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface AbstractInputEvent<T extends SceneComponent = SceneComponent> {
  originalEvent: any;
  component?: T | null;
  index?: number;
}

export interface AbstractRemoveEvent<T extends SceneComponent = SceneComponent> {
  component?: T | null;
  index?: number;
}

@Component({ template: '' })
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

  /**
   * Emitted as soon as the component got destroyed.
   */
  protected destroy$ = new Subject();

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

  constructor(protected translate: TranslateService) {
    this.externalEvent.pipe(takeUntil(this.destroy$)).subscribe((comps: SceneComponent[]) => {
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
   * Returns the label for currently bound component.
   */
  getLabel(): string {
    if (!this.component || !this.component.id) return '';
    const found = this.translate.instant(`componentLabel.${this.component.id}`);
    if (typeof found === 'string' && found.indexOf('componentLabel.') < 0) return found;
    return this.component.id;
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
