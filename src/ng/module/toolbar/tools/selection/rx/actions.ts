import { Action } from '@ngrx/store';
import { Entity } from 'ng/module/pixi/idx';

interface IPoint {
  x: number;
  y: number;
}

export enum SelectionToolActions {
  Select = '[Selection] Select',
  Unselect = '[Selection] Unselect',
  Resize = '[Selection] Resize',
  Rotate = '[Selection] Rotate',
  Translate = '[Selection] Translate',
}

export class SelectionToolSelectAction implements Action {
  readonly type = SelectionToolActions.Select;
  constructor(public entities: string[]) { }
}

export class SelectionToolUnselectAction implements Action {
  readonly type = SelectionToolActions.Unselect;
}

export class SelectionToolTranslateAction implements Action {
  readonly type = SelectionToolActions.Translate;
  constructor(public position: IPoint) { }
}

export class SelectionToolRotateAction implements Action {
  readonly type = SelectionToolActions.Rotate;
  constructor(public rotation: number) { }
}

export class SelectionToolResizeAction implements Action {
  readonly type = SelectionToolActions.Resize;
  constructor(public size: IPoint) { }
}

export type SelectionToolAction = SelectionToolSelectAction | SelectionToolUnselectAction | SelectionToolResizeAction |
                                  SelectionToolRotateAction | SelectionToolTranslateAction
