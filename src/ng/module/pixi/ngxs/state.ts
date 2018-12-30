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
      ctx.setState({
        ...state,
        entities: [ ...state.entities, data ]
      });
    });
  }

  @Action(DeleteEntity)
  removeEntity(ctx: StateContext<ISceneState>, action: DeleteEntity) {
    const state = ctx.getState();
    const idx = state.entities.findIndex(entity => entity.id === action.id);
    if (idx < 0) return console.warn(`[SceneState] No entity found for id ${action.id}`);
    const entities = state.entities.slice();
    entities.splice(idx, 1);
    ctx.setState({
      ...state,
      entities: entities,
    });
  }

  @Action(UpdateEntity)
  updateEntity(ctx: StateContext<ISceneState>, action: UpdateEntity) {
    const state = ctx.getState();
    const idx = state.entities.findIndex(entity => entity.id === action.data.id);
    if (idx < 0) return console.warn(`[SceneState] No entity found for id ${action.data.id}`);
    const entities = state.entities.slice();
    entities[idx] = Object.assign({}, entities[idx], action.data);
    ctx.setState({
      ...state,
      entities: entities,
    });
  }
}
