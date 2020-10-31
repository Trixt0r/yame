import { State, StateContext, Action, Store } from '@ngxs/store';
import { UndoHistory, PushHistory, RedoHistory } from './actions';
import { cloneDeep } from 'lodash';

export interface IHistorySnapshot<T> {
  last: T[];
  actions: T[];
  date: Date;
}


export interface IHistoryState {
  previous: IHistorySnapshot<unknown>[];
  next: IHistorySnapshot<unknown>[];
}


@State<IHistoryState>({
  name: 'history',
  defaults: {
    previous: [],
    next: [],
  },
})
export class HistoryState {

  constructor(protected store: Store) {
    (window as any).UndoHistory = UndoHistory;
    (window as any).RedoHistory = RedoHistory;
    (window as any).store = store;
  }

  @Action(PushHistory)
  push(ctx: StateContext<IHistoryState>, action: PushHistory) {
    const previous = ctx.getState().previous.slice();
    const date = new Date();
    if (previous.length > 0 && action.override)
      previous[previous.length - 1] = { actions: action.actions, last: action.last, date };
    else
      previous.push({ actions: action.actions, last: action.last, date });
    ctx.patchState({ previous, next: [] });
  }

  @Action(UndoHistory)
  undo(ctx: StateContext<IHistoryState>, action: UndoHistory) {
    const state = ctx.getState();
    if (state.previous.length === 0) return;
    const previous = state.previous.slice();
    const next = state.next.slice();
    const difference = previous.pop();
    next.push({ actions: cloneDeep(difference.last), last: cloneDeep(difference.actions), date: new Date() });
    ctx.patchState({ previous, next });
    this.store.dispatch(difference.actions);
  }

  @Action(RedoHistory)
  redo(ctx: StateContext<IHistoryState>, action: RedoHistory) {
    const state = ctx.getState();
    if (state.next.length === 0) return;
    const previous = state.previous.slice();
    const next = state.next.slice();
    const difference = next.pop();
    previous.push({ actions: cloneDeep(difference.last), last: cloneDeep(difference.actions), date: new Date() });
    ctx.patchState({ previous, next });
    this.store.dispatch(difference.actions);
  }

}
