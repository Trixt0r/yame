import { EntityData, Entity } from '../scene/entity';

export class CreateEntity {
  static readonly type = '[Scene] Create entity';
  constructor(public entity: Entity) {}
}

export class UpdateEntity {
  static readonly type = '[Scene] Update entity';
  constructor(public data: Partial<EntityData> | Partial<EntityData>[], public message: string) {}
}

export class UpdateEntityProperty {
  static readonly type = '[Scene] Update entity property';
  constructor(public id: string, public data: Object) {}
}

export class DeleteEntity {
  static readonly type = '[Scene] Remove entity';
  constructor(public id: string) {}
}

export type EntityAction = CreateEntity | UpdateEntity | DeleteEntity | UpdateEntityProperty;