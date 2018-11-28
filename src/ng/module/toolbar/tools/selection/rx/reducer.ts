import { SelectionToolActions, SelectionToolAction } from './actions';
import { ISelectionState } from './state';

export const initialState: ISelectionState = {
  entities: [],
  position: { x: 0, y: 0 },
  size: { x: 1, y: 1 },
  rotation: 0
};

export function selectionReducer(state: ISelectionState = initialState, action: SelectionToolAction) {
  switch (action.type) {
    case SelectionToolActions.Select:
      return { ...state, entities: action.entities };
    case SelectionToolActions.Unselect:
      return { ...state, entities: [] };
    case SelectionToolActions.Resize:
      return { ...state, size: action.size };
    case SelectionToolActions.Rotate:
      return { ...state, rotation: action.rotation };
    case SelectionToolActions.Translate:
      return { ...state, position: action.position };
    default:
      return state;
  }
}
