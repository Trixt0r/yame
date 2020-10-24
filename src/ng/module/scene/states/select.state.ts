import * as _ from 'lodash';
import { State, StateContext, Action, Store, Actions } from '@ngxs/store';
import { Select, Unselect, UpdateComponents, Isolate } from './actions/select.action';
import { SceneComponent, SceneEntity } from 'common/scene';
import { ISceneState } from './scene.state';
import { PushHistory } from './actions';
import { cloneDeep } from 'lodash';

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
    const comps = cloneDeep(ctx.getState().components.slice());
    const components: SceneComponent[] = action.components;
    const added = [];
    action.entities.forEach(id => {
      const entity = sceneEntities.find(it => it.id === id);
      if (!entity) return console.warn('[SelectState] Could not find an entity for id', id);
      if (entities.indexOf(id) < 0) {
        entities.push(id);
        added.push(id);
      }
    });
    ctx.patchState({ entities, components });
    if (action.persist)
      this.store.dispatch(
        new PushHistory(
          [ new Unselect(added, comps, false) ],
          [ new Select(action.entities, cloneDeep(components), false) ]
        )
      );
  }

  @Action(UpdateComponents)
  update(ctx: StateContext<ISelectState>, action: UpdateComponents) {
    if (!action.patch) return;
    ctx.patchState({ components: action.components });
  }

  @Action(Unselect)
  unselect(ctx: StateContext<ISelectState>, action: Unselect) {
    const comps = cloneDeep(ctx.getState().components.slice());
    const removed = ctx.getState().entities.slice();
    if (!action.entities || action.entities.length === 0) {
      ctx.patchState({ entities: [], components: [] });
      if (action.persist) {
        this.store.dispatch(
          new PushHistory(
            [ new Select(removed, comps, false) ],
            [ new Unselect([], [], false) ]
          )
        );
      }
      return;
    }
    const entities: string[] = ctx.getState().entities.slice();
    const components: SceneComponent[] = action.components || ctx.getState().components.slice() || [];
    action.entities.forEach(id => {
      const idx = entities.indexOf(id);
      if (idx >= 0) entities.splice(idx, 1);
    });
    ctx.patchState({ entities, components });
    if (action.persist) {
      this.store.dispatch(
        new PushHistory(
          [ new Select(removed, comps, false) ],
          [ new Unselect(action.entities, cloneDeep(action.components), false) ]
        )
      );
    }
  }

  @Action(Isolate)
  isolate(ctx: StateContext<ISelectState>, action: Isolate) {
    if (ctx.getState().isolated === action.entity) return;
    const previous = ctx.getState().isolated;
    ctx.patchState({ isolated: action.entity });
    if (action.persist) {
      this.store.dispatch(
        new PushHistory(
          [ new Isolate(previous, false) ],
          [ new Isolate(action.entity, false) ]
        )
      );
    }
  }
}
