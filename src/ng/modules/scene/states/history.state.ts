import { State, StateContext, Action, Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { UndoHistory, PushHistory, RedoHistory, ResetHistory } from './actions/history.action';
import { cloneDeep } from 'lodash';
import { Keydown } from 'ng/states/hotkey.state';
import { Injectable } from '@angular/core';

export interface IHistorySnapshot<T extends {}> {
  last: T[];
  actions: T[];
  date: Date;
}

export interface IHistoryState {
  previous: IHistorySnapshot<{}>[];
  next: IHistorySnapshot<{}>[];
}

@State<IHistoryState>({
  name: 'history',
  defaults: {
    previous: [],
    next: [],
  },
})
@Injectable()
export class HistoryState {

  constructor(protected store: Store, actions: Actions) {
    actions.pipe(ofActionSuccessful(Keydown))
            .subscribe((action: Keydown) => {
              switch (action.shortcut.id) {
                case 'undo': store.dispatch(new UndoHistory()); break;
                case 'redo': store.dispatch(new RedoHistory()); break;
              }
            });
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
    if (!difference) return;
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
    if (!difference) return;
    previous.push({ actions: cloneDeep(difference.last), last: cloneDeep(difference.actions), date: new Date() });
    ctx.patchState({ previous, next });
    this.store.dispatch(difference.actions);
  }

  @Action(ResetHistory)
  reset(ctx: StateContext<IHistoryState>, action: ResetHistory) {
    ctx.setState({ previous: [], next: [] });
  }

}
