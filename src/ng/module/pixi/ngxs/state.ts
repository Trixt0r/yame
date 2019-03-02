import { State, Action, StateContext } from '@ngxs/store';
import { EntityData } from '../scene/entity';
import { GroupData } from '../scene/group';
import { CreateEntity, DeleteEntity, UpdateEntity } from './actions';

export interface ISceneState {
  entities: (EntityData | GroupData)[];
  settings: any;
}

@State<ISceneState>({
  name: 'scene',
  defaults: {
    entities: [],
    settings: {},
  },
})
export class SceneState {
  @Action(CreateEntity)
  addEntity(ctx: StateContext<ISceneState>, action: CreateEntity) {
    return action.entity.export('.').then(data => {
      const state = ctx.getState();
      ctx.patchState({ entities: [ ...state.entities, data ] });
    });
  }

  @Action(DeleteEntity)
  removeEntity(ctx: StateContext<ISceneState>, action: DeleteEntity) {
    const state = ctx.getState();
    const idx = state.entities.findIndex(entity => entity.id === action.id);
    if (idx < 0) return console.warn(`[SceneState] No entity found for id ${action.id}`);
    const entities = state.entities.slice();
    entities.splice(idx, 1);
    ctx.patchState({ entities: entities });
  }

  @Action(UpdateEntity)
  updateEntity(ctx: StateContext<ISceneState>, action: UpdateEntity) {
    const state = ctx.getState();
    const data = Array.isArray(action.data) ? action.data : [action.data];
    const entities = state.entities.slice();
    const hasChanges = data.reduce((mem, newData) => {
      const idx = entities.findIndex(entity => entity.id === newData.id);
      if (idx < 0) return console.warn(`[SceneState] No entity found for id ${newData.id}`);
      const newEntityData = Object.assign({ }, entities[idx], newData);
      const snapshot = JSON.stringify(entities[idx]);
      const newSnap = JSON.stringify(newEntityData);
      if (snapshot !== newSnap) {
        entities[idx] = newEntityData;
        return mem;
      } else {
        return false;
      }
    }, true);
    if (hasChanges)
      ctx.patchState({ entities: entities });
  }
}
