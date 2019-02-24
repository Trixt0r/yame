import { State, StateContext, Action } from '@ngxs/store';
import { Select, Unselect, UpdateSelection } from './actions';
import { PropertyOptionsExt } from 'ng/module/pixi/scene/entity';

export interface ISelectionState {
  entities: string[];
  properties: PropertyOptionsExt[];
  // position: IPoint;
  // size: IPoint;
  // rotation: number;
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
    const state = ctx.getState();
    ctx.setState({
      ...state,
      entities: action.entities,
    });
  }

  @Action(Unselect)
  unselect(ctx: StateContext<ISelectionState>, action: Unselect) {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      entities: [],
      properties: [],
    });
  }

  @Action(UpdateSelection)
  update(ctx: StateContext<ISelectionState>, action: UpdateSelection) {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      properties: action.properties,
    });
  }
}
