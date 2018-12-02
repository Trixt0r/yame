import { State, StateContext, Action } from '@ngxs/store';
import { Translate, Rotate, Resize, Select, Unselect } from './actions';

interface IPoint {
  x: number;
  y: number;
}

export interface ISelectionState {
  entities: string[];
  position: IPoint;
  size: IPoint;
  rotation: number;
};

@State<ISelectionState>({
  name: 'selection',
  defaults: {
    entities: [],
    position: { x: 0, y: 0 },
    size: { x: 1, y: 1 },
    rotation: 0,
  }
})
export class SelectionState {

  @Action(Select)
  select(ctx: StateContext<ISelectionState>, action: Select) {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      entities: action.entities,
      position: action.postion,
      rotation: action.rotation,
      size: action.size ? action.size : { x: 1, y: 1 },
    });
  }

  @Action(Unselect)
  unselect(ctx: StateContext<ISelectionState>, action: Unselect) {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      entities: []
    });
  }

  @Action(Translate)
  translate(ctx: StateContext<ISelectionState>, action: Translate) {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      position: action.position
    });
  }

  @Action(Rotate)
  rotate(ctx: StateContext<ISelectionState>, action: Rotate) {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      rotation: action.rotation
    });
  }

  @Action(Resize)
  resize(ctx: StateContext<ISelectionState>, action: Resize) {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      size: action.size
    });
  }

}
