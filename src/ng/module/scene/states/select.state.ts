import * as _ from 'lodash';
import { State, StateContext, Action, Store, Actions } from '@ngxs/store';
import { Select, Unselect, UpdateComponents } from './actions/select.action';
import { SceneComponent } from 'common/scene';
import { ISceneState } from './scene.state';

export interface ISelectState {
  entities: string[];
  components: readonly SceneComponent[];
}

@State<ISelectState>({
  name: 'select',
  defaults: {
    entities: [],
    components: [],
  },
})
export class SelectState {

  constructor(private store: Store) { }

  @Action(Select)
  select(ctx: StateContext<ISelectState>, action: Select) {
    const sceneEntities = (this.store.snapshot().scene as ISceneState).entities;
    const entities: string[] = [];
    const components: SceneComponent[] = action.components;
    action.entities.forEach(id => {
      const entity = sceneEntities.find(it => it.id === id);
      if (!entity) return console.warn('[SelectState] Could not find an entity for id', id);
      entities.push(entity.id);
    });
    ctx.setState({ entities, components });
  }

  @Action(UpdateComponents)
  update(ctx: StateContext<ISelectState>, action: UpdateComponents) {
    if (!action.patch) return;
    ctx.patchState({ components: action.components });
  }

  @Action(Unselect)
  unselect(ctx: StateContext<ISelectState>) {
    ctx.setState({ entities: [], components: [] });
  }
}
