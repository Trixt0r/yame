import { EntityData, Entity } from '../scene/entity';
import { Asset } from 'common/asset';
import { PointLike } from 'pixi.js';

export class CreateEntity {
  static readonly type = '[Scene] Create entity';
  constructor(public entity: Entity) {}
}

export class UpdateEntity {
  static readonly type = '[Scene] Update entity';
  constructor(public data: EntityData, public message: string) {}
}

export class DeleteEntity {
  static readonly type = '[Scene] Remove entity';
  constructor(public id: string) {}
}
