import { CreateEntity, UpdateEntity, DeleteEntity } from './entity.action';

export class PushHistory {
  static readonly type = '[History] Push';
  constructor(public readonly actions: (CreateEntity | UpdateEntity | DeleteEntity)[]) { }
}

export class PopHistory {
  static readonly type = '[History] Pop';
  constructor(public readonly actions: (CreateEntity | UpdateEntity | DeleteEntity)[]) { }
}

export type HistoryActions = PushHistory | PopHistory;
