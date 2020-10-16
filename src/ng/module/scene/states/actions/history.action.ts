import { EntityAction } from './entity.action';

export class PushHistory {
  static readonly type = '[History] Push';
  constructor(public readonly actions: EntityAction[], public readonly last: EntityAction[]) { }
}

export class UndoHistory {
  static readonly type = '[History] Undo';
  constructor(public readonly actions: EntityAction[]) { }
}

export class RedoHistory {
  static readonly type = '[History] Redo';
  constructor(public readonly actions: EntityAction[]) { }
}

export type HistoryActions = PushHistory | UndoHistory | RedoHistory;
