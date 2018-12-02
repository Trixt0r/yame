
interface IPoint {
  x: number;
  y: number;
}

export class Select {
  static readonly type = '[SelectionTool] Select';
  constructor(public entities: string[], public postion: IPoint, public rotation: number, public size?: IPoint) { }
}

export class Unselect {
  static readonly type = '[SelectionTool] Unselect';
}

export class Translate {
  static readonly type = '[SelectionTool] Translate';
  constructor(public position: IPoint) { }
}

export class Rotate {
  static readonly type = '[SelectionTool] Rotate';
  constructor(public rotation: number) { }
}

export class Resize {
  static readonly type = '[SelectionTool] Resize';
  constructor(public size: IPoint) { }
}

export type Actions = Select | Unselect | Translate | Rotate | Resize;
