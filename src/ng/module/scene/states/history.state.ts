import { CreateEntity, UpdateEntity, DeleteEntity } from './actions/entity.action';
import { State, StateContext, Action, Store } from '@ngxs/store';
import { PopHistory, PushHistory } from './actions';

interface Difference {
  actions: (CreateEntity | UpdateEntity | DeleteEntity)[];
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

  private timeout = null;

  constructor(protected store: Store) {
    (window as any).PopHistory = PopHistory;
    (window as any).store = store;
  }

  @Action(PushHistory)
  push(ctx: StateContext<IHistoryState>, action: PushHistory) {
    const date = new Date();
    const push = () => {
      this.timeout = null;
      const previous = ctx.getState().previous.slice();
      previous.push({ actions: action.actions, date });
      ctx.patchState({ previous, next: [] });
      console.log(ctx.getState());
    };
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(push, 250);
  }

  @Action(PopHistory)
  pop(ctx: StateContext<IHistoryState>, action: PopHistory) {
    const state = ctx.getState();
    if (state.previous.length === 0) return;
    const previous = state.previous.slice();
    const next = state.next.slice();
    const difference = previous.pop();
    next.push(difference);
    ctx.patchState({ previous, next });
    this.store.dispatch.apply(this.store, difference.actions);
    console.log(ctx.getState());
  }

}
