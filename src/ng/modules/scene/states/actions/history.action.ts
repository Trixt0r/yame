export class PushHistory {
  static readonly type = '[History] Push';
  constructor(public readonly actions: {}[], public readonly last: {}[], public readonly override: boolean = false) { }
}

export class UndoHistory {
  static readonly type = '[History] Undo';
  constructor() { }
}

export class RedoHistory {
  static readonly type = '[History] Redo';
  constructor() { }
}

export class ResetHistory {
  static readonly type = '[History] Reset';
  constructor() { }
}

export type HistoryActions = PushHistory | UndoHistory | RedoHistory | ResetHistory;
