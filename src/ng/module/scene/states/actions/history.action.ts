export class PushHistory {
  static readonly type = '[History] Push';
  constructor(public readonly actions: unknown[], public readonly last: unknown[]) { }
}

export class UndoHistory {
  static readonly type = '[History] Undo';
  constructor() { }
}

export class RedoHistory {
  static readonly type = '[History] Redo';
  constructor() { }
}

export type HistoryActions = PushHistory | UndoHistory | RedoHistory;
