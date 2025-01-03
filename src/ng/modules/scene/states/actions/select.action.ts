import { SceneComponent, SceneEntity } from 'common/scene';

export class Select {
  static readonly type = '[Selection] Select';
  constructor(
    public entities: string[],
    public components: SceneComponent[] = [],
    public persist: boolean = true,
    public unselectCurrent: boolean = false
  ) {}
}

export class UpdateComponents {
  static readonly type = '[Selection] UpdateComponents';
  constructor(public components: SceneComponent[] = [], public patch = false) {}
}

export class Unselect {
  static readonly type = '[Selection] Unselect';
  constructor(public entities?: string[], public components: SceneComponent[] = [], public persist: boolean = true) {}
}

export class Isolate {
  static readonly type = '[Selection] Isolate';
  constructor(public entity: SceneEntity | null, public persist: boolean = true) {}
}

export class Input {
  static readonly type = '[Selection] Input';
  constructor(public actions: {}[], public source?: unknown) {}
}

export type SelectActions = Select | Unselect | UpdateComponents | Isolate | Input;
