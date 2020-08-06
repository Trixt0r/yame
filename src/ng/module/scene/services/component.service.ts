import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { GroupSceneComponent, SceneEntity, SceneComponent } from 'common/scene';
import * as _ from 'lodash';
import { SceneService } from './scene.service';
import { Observable } from 'rxjs';
import { UpdateEntity } from '../states/actions/entity.action';
import { EntityNotFoundException } from '../exceptions/scene/entity-not-found.exception';
import { Select, UpdateComponents } from '../states/actions/select.action';

@Injectable({ providedIn: 'root' })
export class SceneComponentService {

  protected reservedIds: string[];

  /**
   * Creates a new instance of the scene component service.
   *
   * @param scene The scene service, for querying.
   * @param store The store, for applying component changes.
   */
  constructor(protected scene: SceneService, protected store: Store) {
    this.reservedIds = [];
  }

  /**
   * Returns whether the given type can be added to the given group.
   *
   * @param type The type to check for.
   * @param group The group to check.
   * @return Whether the type can be added.
   */
  canTypeBeAddedToGroup(type: string, group: GroupSceneComponent): boolean {
    if (_.isNil(group.allowedMemberItems) && _.isNil(group.allowedMemberTypes)) return true;
    if (group.allowedMemberTypes) {
      if (group.allowedMemberTypes.length === 0) return false;
      if (!group.allowedMemberTypes.find(it => it === type)) return false;
    }
    return true;
  }

  /**
   * Returns whether the given item id can be added to the given group.
   *
   * @param type The item id to check for.
   * @param group The group to check.
   * @return Whether the id can be added.
   */
  canIdBeAddedToGroup(id: string, group: GroupSceneComponent): boolean {
    if (_.isNil(group.allowedMemberItems) && _.isNil(group.allowedMemberTypes)) return true;
    if (group.allowedMemberItems) {
      if (group.allowedMemberItems.length === 0) return false;
      if (!group.allowedMemberItems.find(it => it === id)) return false;
    }
    return true;
  }

  reserveId(componentId: string): void {
    if (this.reservedIds.indexOf(componentId) < 0)
      this.reservedIds.push(componentId);
  }

  /**
   * Returns whether the given component id is used by another component for the given entity.
   *
   * @param componentId The component id.
   * @param entityId The entity id.
   * @return Whether the component id is available.
   */
  isIdInUse(componentId: string, entityId: string): boolean {
    const entity = this.scene.getEntity(entityId);
    return entity ? !!entity.components.find(comp => comp.id === componentId) : false;
  }

  /**
   * Returns whether the given component id is reserved or not.
   *
   * @param componentId The component id.
   * @return Whether the id is reserved or not.
   */
  isIdReserved(componentId: string): boolean {
    return this.reservedIds.indexOf(componentId) >= 0;
  }

  /**
   * Returns whether the given component id is available for creating
   * or renaming a component on the given entity.
   *
   * @param componentId The component id.
   * @param entityId The entity id.
   * @return Whether the given component id can be used without
   */
  isIdAvailable(componentId: string, entityId: string): boolean {
    return !this.isIdReserved(componentId) && !this.isIdInUse(componentId, entityId);
  }

  /**
   * Generates a new component id for the given entity and component type.
   *
   * @param entity The entity.
   * @param type The component type.
   * @return The new component id.
   */
  generateComponentId(entities: (string | SceneEntity)[], type: string): string {
    const entityObjects = entities.map(it => {
      const entityObj = this.scene.getEntity(it);
      if (!this.scene.assertEntity(entityObj))
        throw new EntityNotFoundException('No entity found', it);
      return entityObj;
    });
    const max = _.maxBy(entityObjects, it => it.components.byType(type).length);
    const components = max.components.byType(type);
    return `${type} ${components.length + 1}`;
  }

  /**
   * Adds a new scene component to the given entities in the given group.
   *
   * @param entities The entity references.
   * @param component The scene component id.
   * @param group Optional group, to attach the scene component to.
   * @return An observable, finishing on successful entity update.
   */
  add(
    entities: (string | SceneEntity)[],
    component: SceneComponent,
    group?: GroupSceneComponent
  ): Observable<any> {
    const entityObjects = entities.map(it => {
      const entityObj = this.scene.getEntity(it);
      if (!this.scene.assertEntity(entityObj))
        throw new EntityNotFoundException('No entity found', it);
      return entityObj;
    });

    // Custom components can always be removed and edited
    component.removable = true;
    component.editable = true;
    // Make sure the hierarchy is set up properly
    if (group) {
      if (group.type === 'group') {
        if (!group.members) group.members = [];
        group.members.push(component.id);
        component.group = group.id;
      }
    }

    const selected = this.store.selectSnapshot(data => data.select);
    const data = entityObjects.map(it => ({ id: it.id, components: [_.cloneDeep(component)] }));
    selected.components = selected.components.concat([component]);
    return this.store.dispatch([
      new UpdateEntity(
        data,
        `Component added in entities ${data.map(it => it.id).join(',')}`
      ),
      selected && selected.entities.length > 0 ? new UpdateComponents(selected.components, true) : void 0
    ]);
  }

  /**
   * Removes the given component from the given entities.
   *
   * @param entities The entity references.
   * @param component The component to remove.
   * @return An observable, finishing on successful entity update.
   */
  remove(entities: (string | SceneEntity)[], component: SceneComponent): Observable<any> {
    const entityObjects = entities.map(it => {
      const entityObj = this.scene.getEntity(it);
      if (!this.scene.assertEntity(entityObj))
        throw new EntityNotFoundException('No entity found', it);
      return entityObj;
    });
    component.markedForDelete = true;
    const selected = this.store.selectSnapshot(data => data.select);
    const data = entityObjects.map(it => ({ id: it.id, components: [component] }));
    const components = selected.components.slice();
    const idx = components.indexOf(component);
    if (idx >= 0) {
      components.splice(idx, 1);
      selected.components = components;
    }
    return this.store.dispatch([
      new UpdateEntity(
        data,
        `Component ${component.id} removed in entity ${data.map(it => it.id).join(',')}`
      ),
      selected && selected.entities.length > 0 ? new UpdateComponents(selected.components, true) : void 0
    ]);
  }

  /**
   * Updates the given component for the given entities.
   *
   * @param entities The entity references.
   * @param component The component to update.
   * @param old The old component data.
   * @return An observable, finishing on successful entity update.
   */
  update(entities: (string | SceneEntity)[], component: SceneComponent, old: SceneComponent): Observable<any> {
    const entityObjects = entities.map(it => {
      const entityObj = this.scene.getEntity(it);
      if (!this.scene.assertEntity(entityObj))
        throw new EntityNotFoundException('No entity found', it);
      return entityObj;
    }).filter(entity => !!entity.components.byId(old.id));
    const selected = this.store.selectSnapshot(data => data.select);
    old.markedForDelete = true;
    const data = entityObjects.map(it => ({ id: it.id, components: [_.cloneDeep(component), _.cloneDeep(old)] }));
    const idx = selected.components.indexOf(old);
    if (idx >= 0) selected.components[idx] = component;
    return this.store.dispatch([
      new UpdateEntity(
        data,
        `Component ${component.id} update in entity ${data.map(it => it.id).join(',')}`
      ),
      selected && selected.entities.length > 0 ? new UpdateComponents(selected.components, true) : void 0
    ]);
  }
}
