import { PropertyOptionsExt } from 'ng/module/pixi/scene/entity';

export class Select {
  static readonly type = '[SelectionTool] Select';
  constructor(public entities: string[]) {}
}

export class Unselect {
  static readonly type = '[SelectionTool] Unselect';
  constructor(public entities?: string[]) {}
}

export class UpdateSelection {
  static readonly type = '[SelectionTool] Update';
  constructor(public properties: PropertyOptionsExt[], public attributes?: string[]) {}
}

export type SelectionActions = Select | Unselect | UpdateSelection;
