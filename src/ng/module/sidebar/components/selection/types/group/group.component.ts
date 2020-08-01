import { AbstractTypeComponent, AbstractRemoveEvent } from '../abstract';
import { Component, ChangeDetectorRef, OnChanges, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { GroupSceneComponent, SceneComponent } from 'common/scene';
import { SceneComponentsService } from 'ng/module/sidebar/services/scene-components.service';
import { EntityComponentsDirective } from 'ng/module/sidebar/directives/entity-components.directive';

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

  @ViewChild(EntityComponentsDirective) entityComponentsDirective: EntityComponentsDirective;

  /**
   * The components to display.
   */
  components: SceneComponent[] = [];

  canAddComponents: boolean = true;

  constructor(
    protected store: Store,
    protected sceneComponents: SceneComponentsService,
    private cdr: ChangeDetectorRef
  ) {
    super();
    this.externalEvent.subscribe(event => this.externalUpdate(event));
  }

  get expanded(): boolean {
    return this.component.expanded;
  }

  /**
   * @inheritdoc
   */
  ngOnChanges() {
    this.components =
      this.selectState && this.selectState.components
        ? this.selectState.components.filter((it) => it.group === this.component.id)
        : [];
    this.canAddComponents = !!this.sceneComponents.items.find((item) => {
      return this.sceneComponents.canSceneComponentBeAddedToGroup(this.component, item);
    });
    this.cdr.markForCheck();
  }

  /**
   * @inheritdoc
   */
  update(event: any) {
    this.updateEvent.emit(event);
  }

  removedComponent(event: AbstractRemoveEvent<GroupSceneComponent>) {
    this.removeEvent.emit(event);
  }

  externalUpdate(event) {
    this.entityComponentsDirective.componentsUpdate.next(event);
  }
}
