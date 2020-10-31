import { cloneDeep, flattenDeep, flatten } from 'lodash';
import { State, Action, StateContext, Store } from '@ngxs/store';
import { CreateEntity, DeleteEntity, UpdateEntity, SortEntity, CloneEntity } from './actions/entity.action';
import { SceneEntity, SceneEntityData } from 'common/scene';
import { SceneComponentCollectionListener } from 'common/scene/component.collection';
import { Dispatcher, Component, Collection } from '@trixt0r/ecs';
import { SceneService } from '../services/scene.service';
import { PushHistory, Select, Unselect } from './actions';

/**
 * Interface representing the scene state.
 */
export interface ISceneState {
  /**
   * All entities in the scene.
   */
  entities: SceneEntity[];

  /**
   * Any settings for the scene.
   */
  settings: { [key: string]: any };
}

/**
 * Moves the given index
 *
 * @param array The array to sort.
 * @param index The current index.
 * @param newIndex The new index.
 */
function move<T>(array: T[], index: number, newIndex: number) {
  while (index < 0) {
    index += array.length;
  }
  while (newIndex < 0) {
    newIndex += array.length;
  }
  if (newIndex >= array.length) {
    let k = newIndex - array.length + 1;
    while (k--) array.push(undefined);
  }
  array.splice(newIndex, 0, array.splice(index, 1)[0]);
}

@State<ISceneState>({
  name: 'scene',
  defaults: {
    entities: [],
    settings: {},
  },
})
export class SceneState {
  constructor(public store: Store, public service: SceneService) {}

  /**
   * Returns cloned entities for the given data.
   *
   * @param cloneData The data to clone from.
   * @return The cloned entities.
   */
  protected getCloneEntities(cloneData: { id: string; index: number; parent?: string }[]): SceneEntity[] {
    return flattenDeep(
      cloneData.map((it) => {
        const source = this.service.getEntity(it.id);
        if (!source) return null;
        const entity = new SceneEntity();
        entity.components.set.apply(
          entity.components,
          source.components.map((comp) => cloneDeep(comp))
        );
        entity.components.byId('index').index = it.index;
        entity.components.byId('name').string += ' clone';
        entity.type = source.type;
        entity.parent = it.parent;
        if (source.children) {
          const re = this.getCloneEntities(source.children.map((id, index) => ({ id, index, parent: entity.id })));
          entity.children = re.map((child) => child.id);
          return [entity, ...re];
        } else {
          return entity;
        }
      })
    ).filter((it) => it instanceof SceneEntity);
  }

  /**
   * Updates the indices for the current entities based on the given arguments
   * and returns an update diff for the store.
   *
   * @param id The id of the entity to update.
   * @param index The new index of the entity.
   * @param [parent] The new parent of the entity.
   * @return The update array.
   */
  updateIndices(id: string, index: number, parent?: string): Partial<SceneEntityData>[] {
    const entity = this.service.getEntity(id);

    const currentIndex = index;
    const data = [] as Partial<SceneEntityData>[];
    data.push({
      id: id,
      components: [
        {
          id: 'index',
          type: 'index',
          index: currentIndex,
        },
      ],
      parent: parent,
    });

    // If the parents differ
    if (parent !== entity.parent) {
      // ... remove from the old parent
      const oldSiblings = this.service.getChildren(entity.parent, false).filter((it) => it.id !== id);
      oldSiblings.forEach((it, i) => {
        data.push({
          id: it.id,
          components: [
            {
              id: 'index',
              type: 'index',
              index: i,
            },
          ],
        });
      });

      // ... and insert into the new one
      const newSiblings = this.service.getChildren(parent, false);
      newSiblings.splice(index, 0, entity);
      newSiblings.forEach((it, i) => {
        if (it.id === id) return;
        data.push({
          id: it.id,
          components: [
            {
              id: 'index',
              type: 'index',
              index: i,
            },
          ],
        });
      });
    } else {
      // ... otherwise just move the entity in the children list
      const siblings = this.service.getChildren(parent, false);
      const prevIndex = siblings.indexOf(entity);
      const offset = 1;
      const dir = Math.sign(prevIndex - currentIndex);
      const start = dir > 0 ? currentIndex : prevIndex + 1;
      const end = dir > 0 ? prevIndex : currentIndex + 1;
      const parentEntity = this.service.getEntity(parent);
      if (parentEntity) {
        move(parentEntity.children, prevIndex, currentIndex);
      }
      for (let i = start; i < end; i++) {
        const it = siblings[i];
        if (!it) continue;
        data.push({
          id: it.id,
          components: [
            {
              id: 'index',
              type: 'index',
              index: i + dir * offset,
            },
          ],
        });
      }
    }
    return data;
  }

  /**
   * Adds new entities to the scene based on the given action.
   *
   * @param ctx
   * @param action
   */
  @Action(CreateEntity)
  addEntity(ctx: StateContext<ISceneState>, action: CreateEntity) {
    const newEntities = Array.isArray(action.data) ? action.data : [action.data];
    const state = ctx.getState();
    const entities = state.entities.slice();
    const siblings: { [parent: string]: SceneEntity[] } = {};
    newEntities.forEach((entity) => {
      if (!siblings[entity.parent]) {
        siblings[entity.parent] = this.service.getChildren(entity.parent, false);
      }

      if (!entity.components.byId('index')) {
        entity.components.add({ id: 'index', type: 'index', index: siblings[entity.parent].length });
      }

      // If no name is set, set one, based on the type and sibling count
      if (!entity.components.byId('name')) {
        const sameTypeCount = siblings[entity.parent].filter((it) => it.type === entity.type).length;
        entity.components.add({ id: 'name', type: 'name', string: `${entity.type} ${sameTypeCount + 1}` });
      }

      const parentEntity = entities.find((it) => it.id === entity.parent);
      if (parentEntity && parentEntity.children.indexOf(entity.id) < 0) parentEntity.children.push(entity.id);
      entities.push(entity);
    });
    action.created = newEntities;
    ctx.patchState({ entities });
    if (action.persist)
      this.store.dispatch(
        new PushHistory(
          [
            new DeleteEntity(
              action.created.map((it) => it.id),
              [],
              false
            ),
          ],
          [
            new CreateEntity(
              newEntities.map((it) => cloneDeep(it)),
              [],
              false
            ),
          ]
        )
      );
  }

  /**
   * Removes entities from the scene based on the given action.
   *
   * @param ctx
   * @param action
   */
  @Action(DeleteEntity)
  removeEntity(ctx: StateContext<ISceneState>, action: DeleteEntity) {
    const state = ctx.getState();
    const toRemove = Array.isArray(action.id) ? action.id : [action.id];
    const entities = state.entities.slice();
    const entitiesToRemove = [];
    toRemove.slice().forEach((id) => {
      this.service.getChildren(id).forEach((it) => toRemove.push(it.id));
    });
    toRemove.forEach((id) => {
      const idx = entities.findIndex((entity) => entity.id === id);
      if (idx < 0) return console.warn(`[SceneState] No entity found for id ${id}`);
      const entity = state.entities[idx];

      const parentEntity = state.entities.find((it) => it.id === entity.parent);
      if (parentEntity) {
        const childIdx = parentEntity.children.indexOf(id);
        if (childIdx >= 0) parentEntity.children.splice(childIdx, 1);
      }
      entities.splice(idx, 1);
      entitiesToRemove.push(entity);
    });
    action.deleted = entitiesToRemove;
    const select = this.store.snapshot().select;
    ctx.patchState({ entities });
    if (action.persist)
      this.store.dispatch(
        new PushHistory([new CreateEntity(action.deleted, [], false)], [new DeleteEntity(toRemove, [], false)])
      );
  }

  /**
   * Updates the entities in the scene based on the given action.
   *
   * @param ctx
   * @param action
   */
  @Action(UpdateEntity)
  updateEntity(ctx: StateContext<ISceneState>, action: UpdateEntity) {
    const data = Array.isArray(action.data) ? action.data : [action.data];
    if (data.length === 0) return;
    const state = ctx.getState();
    let hasChanges = false;
    let resort = false;

    const dataBefore: Partial<SceneEntityData>[] = action.persist ? [] : null;

    data.forEach((newData) => {
      const entity = this.service.getEntity(newData.id);
      if (!entity) return console.warn(`[SceneState] No entity found for id ${newData.id}`);
      if (!newData.components) return;
      const comps = dataBefore ? entity.components.map((it) => cloneDeep(it)) : null;
      const oldData = dataBefore ? { id: entity.id, parent: entity.parent, components: [] } : null;
      if (dataBefore) dataBefore.push(oldData);
      const listenerIdx = entity.components.listeners.length;
      (entity.components as Dispatcher<SceneComponentCollectionListener>).addListener({
        onAdded: (...added: Component[]) => {
          hasChanges = true;
          if (!dataBefore) return;
          added.forEach((addedComp) => {
            const comp = cloneDeep(addedComp);
            comp.markedForDelete = true;
            oldData.components.push(comp);
          });
        },
        onRemoved: (...removed: Component[]) => {
          hasChanges = true;
          if (!dataBefore) return;
          removed.forEach((comp) => {
            const found = comps.find((it) => it.id === comp.id);
            if (found) oldData.components.push(found);
          });
        },
        onUpdated: (...update: Component[]) => {
          hasChanges = true;
          if (!resort) resort = !!update.find((it) => it.id === 'index');
          if (!dataBefore) return;
          update.forEach((comp) => {
            const found = comps.find((it) => it.id === comp.id);
            if (found) oldData.components.push(found);
          });
        },
      });
      entity.components.set.apply(entity.components, newData.components);
      entity.components.removeListener(listenerIdx);

      // Updated the parent relation, if necessary.
      const oldParent = entity.parent;
      if (newData.parent !== void 0 && oldParent !== newData.parent) {
        const oldParentEntity = this.service.getEntity(oldParent);
        if (oldParentEntity) {
          const idx = oldParentEntity.children.indexOf(entity.id);
          oldParentEntity.children.splice(idx, 1);
        }

        entity.parent = newData.parent;
        const newParentEntity = this.service.getEntity(newData.parent);
        if (newParentEntity) {
          newParentEntity.children.splice(entity.components.byId('index').index as number, 0, entity.id);
        }
        hasChanges = true;
        resort = true;
      }
    });
    if (!hasChanges) return;
    if (resort) {
      const entities = state.entities;
      this.sortByIndex(entities);
      ctx.patchState({ entities });
    }
    if (!action.persist) return;
    const select = this.store.snapshot().select;
    if (select.entities && select.entities.length > 0 && !dataBefore.find(it => it.id === 'select')) {
      dataBefore.unshift({ id: 'select', components: cloneDeep(select.components) });
    }
    this.store.dispatch(
      new PushHistory(
        [
          new UpdateEntity(dataBefore, 'Reverse update', false),
          // new Unselect([], [], false),
          new Select(
            dataBefore.map(it => it.id).filter(id => id !== 'select'),
            dataBefore.find(it => it.id === 'select').components,
            false,
            true
          ),
        ],
        [
          new UpdateEntity(cloneDeep(data), action.message, false),
          // new Unselect([], [], false),
          new Select(
            data.map(it => it.id).filter(id => id !== 'select'),
            cloneDeep((data.find(it => it.id === 'select') || { components: [] }).components),
            false,
            true
          ),
        ]
      )
    );
  }

  /**
   * Clones a entities based on the given action.
   *
   * @param ctx
   * @param action
   */
  @Action(CloneEntity)
  cloneEntity(ctx: StateContext<ISceneState>, action: CloneEntity) {
    const entitiesToClone = Array.isArray(action.data) ? action.data : [action.data];
    const entitiesToCreate = this.getCloneEntities(entitiesToClone);

    return ctx.dispatch(new CreateEntity(entitiesToCreate)).subscribe(() => {
      const data = entitiesToCreate.map((it) => {
        const old = it.components.byId('index').index as number;
        it.components.byId('index').index = -1;
        return { id: it.id, index: old, parent: it.parent };
      });
      this.sortEntity(ctx, new SortEntity(data, false));
    });
  }

  /**
   * Sorts the entities in the scene based on the given action.
   *
   * @param ctx
   * @param action
   */
  @Action(SortEntity)
  sortEntity(ctx: StateContext<ISceneState>, action: SortEntity) {
    const actionData = Array.isArray(action.data) ? action.data : [action.data];
    const oldData = actionData.map((it) => {
      const entity = this.service.getEntity(it.id);
      if (!entity) return it;
      return {
        id: entity.id,
        index: entity.components.byId('index').index as number,
        parent: entity.parent,
        oldParent: it.parent,
      };
    });
    const data = flatten(actionData.map((it) => this.updateIndices(it.id, it.index, it.parent)));
    if (action.persist)
      this.store.dispatch(
        new PushHistory(
          [new SortEntity(oldData, false)],
          [
            new SortEntity(
              actionData.map((it) => cloneDeep(it)),
              false
            ),
          ]
        )
      );
    return ctx.dispatch(new UpdateEntity(data, `Sorted entities`, false));
  }

  /**
   * Sorts the given entities by their index component.
   *
   * @param entities The entities to sort.
   * @return The sorted entities.
   */
  sortByIndex(entities: SceneEntity[] | Collection<SceneEntity>): SceneEntity[] | Collection<SceneEntity> {
    return entities.sort((a, b) => {
      return Math.sign((a.components.byId('index').index as number) - (b.components.byId('index').index as number));
    });
  }
}
