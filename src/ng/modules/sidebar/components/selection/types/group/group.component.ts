import { AbstractTypeComponent, AbstractRemoveEvent } from '../abstract';
import { Component, ChangeDetectorRef, OnChanges, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { GroupSceneComponent, SceneComponent } from 'common/scene';
import { SceneComponentsService } from 'ng/modules/sidebar/services/scene-components.service';
import { EntityComponentsDirective } from 'ng/modules/sidebar/directives/entity-components.directive';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  templateUrl: `./group.component.html`,
  styleUrls: ['../style.scss', './group.component.scss'],
  host: {
    class: 'full block',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupTypeComponent extends AbstractTypeComponent<GroupSceneComponent> implements OnChanges {
  static readonly type: string = 'group';

  /**
   * The entity components directive reference.
   */
  @ViewChild(EntityComponentsDirective) entityComponentsDirective!: EntityComponentsDirective;

  /**
   * The components to display.
   */
  components: SceneComponent[] = [];

  /**
   * Determines whether components can be added to this group or not.
   */
  canAddComponents: boolean = true;

  /**
   * Whether this group component is expanded or not.
   */
  get expanded(): boolean {
    return this.component?.expanded || false;
  }

  constructor(
    protected translate: TranslateService,
    protected store: Store,
    protected sceneComponents: SceneComponentsService,
    private cdr: ChangeDetectorRef
  ) {
    super(translate);
    this.destroy$.next();
    this.externalEvent.pipe(takeUntil(this.destroy$)).subscribe(comps => this.onExternalUpdate(comps));
  }

  /**
   * @inheritdoc
   */
  onUpdate(event: any): void {
    this.updateEvent.emit(event);
  }

  /**
   * Handles the removal of a component by emitting its event
   * for bubbling up to the handlers for this component.
   *
   * @param event The triggered event.
   */
  onRemovedComponent(event: AbstractRemoveEvent<GroupSceneComponent>): void {
    this.removeEvent.emit(event);
  }

  /**
   * @inheritdoc
   */
  onExternalUpdate(comps: SceneComponent[]): void {
    this.entityComponentsDirective.componentsUpdate.next(comps);
  }

  /**
   * @inheritdoc
   */
  ngOnChanges() {
    this.components =
      this.selectState && this.selectState.components
        ? this.selectState.components.filter(it => it.group === this.component?.id)
        : [];
    this.canAddComponents = !!this.sceneComponents.items.find(item => {
      if (this.component) return this.sceneComponents.canSceneComponentBeAddedToGroup(this.component, item);
      return false;
    });
    this.cdr.markForCheck();
  }
}
