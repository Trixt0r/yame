import { EntityAction } from './entity.action';

export class PushHistory {
  static readonly type = '[History] Push';
  constructor(public readonly actions: (EntityAction)[]) { }
}

export class PopHistory {
  static readonly type = '[History] Pop';
  constructor(public readonly actions: (EntityAction)[]) { }
}

export type HistoryActions = PushHistory | PopHistory;
