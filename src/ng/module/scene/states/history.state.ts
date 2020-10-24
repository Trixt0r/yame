import { State, StateContext, Action, Store } from '@ngxs/store';
import { UndoHistory, PushHistory, RedoHistory } from './actions';
import { cloneDeep } from 'lodash';

interface Difference {
  last: unknown[];
  actions: unknown[];
  date: Date;
}


export interface IHistoryState {
  previous: Difference[];
  next: Difference[];
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
    previous.push({ actions: action.actions, last: action.last, date: new Date() });
    ctx.patchState({ previous, next: [] });
    console.log(ctx.getState());
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
    // this.store.dispatch.apply(this.store, difference.actions);
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
