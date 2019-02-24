import { State, StateContext, Action } from '@ngxs/store';
import { Select, Unselect, UpdateSelection } from './actions';
import { PropertyOptionsExt } from 'ng/module/pixi/scene/entity';

export interface ISelectionState {
  entities: string[];
  properties: PropertyOptionsExt[];
}

@State<ISelectionState>({
  name: 'selection',
  defaults: {
    entities: [],
    properties: [],
  },
})
export class SelectionState {
  @Action(Select)
  select(ctx: StateContext<ISelectionState>, action: Select) {
    ctx.patchState({
      entities: action.entities,
    });
  }

  @Action(Unselect)
  unselect(ctx: StateContext<ISelectionState>, action: Unselect) {
    ctx.patchState({
      entities: [],
      properties: [],
    });
  }

  @Action(UpdateSelection)
  update(ctx: StateContext<ISelectionState>, action: UpdateSelection) {
    ctx.patchState({
      properties: action.properties,
    });
  }
}
