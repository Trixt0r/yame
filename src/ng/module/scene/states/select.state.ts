import * as _ from 'lodash';
import { State, StateContext, Action, Store, Actions } from '@ngxs/store';
import { Select, Unselect, UpdateComponents, Isolate } from './actions/select.action';
import { SceneComponent, SceneEntity } from 'common/scene';
import { ISceneState } from './scene.state';

export interface ISelectState {
  entities: string[];
  components: readonly SceneComponent[];
  isolated: SceneEntity;
}

@State<ISelectState>({
  name: 'select',
  defaults: {
    entities: [],
    components: [],
    isolated: null,
  },
})
export class SelectState {

  constructor(private store: Store) { }

  @Action(Select)
  select(ctx: StateContext<ISelectState>, action: Select) {
    const sceneEntities = (this.store.snapshot().scene as ISceneState).entities;
    const entities: string[] = ctx.getState().entities.slice();
    const components: SceneComponent[] = action.components;
    action.entities.forEach(id => {
      const entity = sceneEntities.find(it => it.id === id);
      if (!entity) return console.warn('[SelectState] Could not find an entity for id', id);
      if (entities.indexOf(id) < 0) entities.push(id);
    });
    ctx.patchState({ entities, components });
  }

  @Action(UpdateComponents)
  update(ctx: StateContext<ISelectState>, action: UpdateComponents) {
    if (!action.patch) return;
    ctx.patchState({ components: action.components });
  }

  @Action(Unselect)
  unselect(ctx: StateContext<ISelectState>, action: Unselect) {
    if (!action.entities || action.entities.length === 0) return ctx.patchState({ entities: [], components: [] });
    const entities: string[] = ctx.getState().entities.slice();
    const components: SceneComponent[] = action.components || ctx.getState().components.slice() || [];
    action.entities.forEach(id => {
      const idx = entities.indexOf(id);
      if (idx >= 0) entities.splice(idx, 1);
    });
    ctx.patchState({ entities, components });
  }

  @Action(Isolate)
  isolate(ctx: StateContext<ISelectState>, action: Isolate) {
    ctx.patchState({ isolated: action.entity });
  }
}
