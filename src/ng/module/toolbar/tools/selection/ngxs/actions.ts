import { PropertyOptionsExt } from 'ng/module/pixi/scene/entity';

export class Select {
  static readonly type = '[SelectionTool] Select';
  constructor(public entities: string[] /*, public postion: IPoint, public rotation: number, public size?: IPoint*/) {}
}

export class Unselect {
  static readonly type = '[SelectionTool] Unselect';
  constructor(public entities?: string[]) {}
}

export class UpdateSelection {
  static readonly type = '[SelectionTool] Update';
  constructor(public properties: PropertyOptionsExt[], public attributes?: string[]) {}
}

export type Actions = Select | Unselect | UpdateSelection;
