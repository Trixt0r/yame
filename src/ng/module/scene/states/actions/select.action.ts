import { SceneComponent, SceneEntity } from 'common/scene';

export class Select {
  static readonly type = '[Selection] Select';
  constructor(public entities: string[], public components: SceneComponent[] = []) {}
}

export class UpdateComponents {
  static readonly type = '[Selection] UpdateComponents';
  constructor(public components: SceneComponent[] = [], public patch = false) {}
}

export class Unselect {
  static readonly type = '[Selection] Unselect';
  constructor(public entities?: string[], public components: SceneComponent[] = []) {}
}

export class Isolate {
  static readonly type = '[Selection] Isolate';
  constructor(public entity: SceneEntity | null) { }
}

export type SelectActions = Select | Unselect | UpdateComponents | Isolate;
