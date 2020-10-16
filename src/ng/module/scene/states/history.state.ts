import { EntityAction } from './actions/entity.action';
import { State, StateContext, Action, Store } from '@ngxs/store';
import { UndoHistory, PushHistory, RedoHistory } from './actions';

interface Difference {
  last: EntityAction[];
  actions: EntityAction[];
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
    next.push({ actions: difference.last, last: difference.actions, date: new Date() });
    ctx.patchState({ previous, next });
    this.store.dispatch.apply(this.store, difference.actions);
  }

  @Action(RedoHistory)
  redo(ctx: StateContext<IHistoryState>, action: RedoHistory) {
    const state = ctx.getState();
    if (state.next.length === 0) return;
    const previous = state.previous.slice();
    const next = state.next.slice();
    const difference = next.pop();
    previous.push({ actions: difference.last, last: difference.actions, date: new Date() });
    ctx.patchState({ previous, next });
    this.store.dispatch.apply(this.store, difference.actions);
  }

}
