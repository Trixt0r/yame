import { SceneComponent } from 'common/scene';

export class Select {
  static readonly type = '[Selection] Select';
  constructor(public entities: string[], public components: SceneComponent[] = []) {}
}

export class UpdateComponents {
  static readonly type = '[Selection] UpdateComponents';
  constructor(public components: SceneComponent[] = []) {}
}

export class Unselect {
  static readonly type = '[Selection] Unselect';
  constructor(public entities?: string[], public components: SceneComponent[] = []) {}
}

export type SelectActions = Select | Unselect;
