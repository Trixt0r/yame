import { SceneEntityData, SceneEntity } from 'common/scene';

/**
 * Creates a new entity or a list of new entities in the store.
 */
export class CreateEntity {
  static readonly type = '[Scene] Create entity';
  constructor(public data: SceneEntity | SceneEntity[], public created: SceneEntity[] = [], public persist = true) {}
}

interface CloneData {
  id: string;
  index: number,
  parent?: string | null;
}

/**
 * Clones an existing entity.
 */
export class CloneEntity {
  static readonly type = '[Scene] Clone entity';
  constructor(public data: CloneData | CloneData[], public persist = true) {}
}

interface SortData extends CloneData {
  oldParent?: string | null;
}

/**
 * Updates the data of a single entity or a list of entities.
 */
export class UpdateEntity {
  static readonly type = '[Scene] Update entity';
  constructor(public data: Partial<SceneEntityData> | Partial<SceneEntityData>[], public message: string, public persist = true) {}
}
/**
 * Sorts the given entity and updates the hierarchy accordingly.
 */
export class SortEntity {
  static readonly type = '[Scene] Sort entity';
  constructor(public data: SortData | SortData[], public persist = true) {}
}

/**
 * Deletes a single entity or a list of entities, if they exist in the store.
 */
export class DeleteEntity {
  static readonly type = '[Scene] Remove entity';
  constructor(public id: string | string[], public deleted: SceneEntity[] = [], public persist = true) {}
}

export type EntityAction = CreateEntity | UpdateEntity | CloneEntity | SortEntity | DeleteEntity;
