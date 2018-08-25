import * as _ from 'lodash';
import { Entity, EntityData, EntityType } from "./entity";
import { GroupException } from '../exception/entity/group';

interface GroupData extends EntityData {
  entities: EntityData[];
}

/**
 * A group contains a collection of entites.
 * It can be used to put a bunch of entities into one container.
 * It makes sure, that exporting, parsing and cloning works as expected, i.e. deep.
 * A group provides methods for adding, removing and querying entities.
 *
 * @class Group
 * @extends {Entity}
 */
@EntityType()
export class Group<T extends Entity> extends Entity {

  exportData: GroupData; // Override the type of the export data.

  /** @type {T[]} Internal list of all added entities. */
  protected internalEntities: T[] = [];

  /** @type {T[]} A shallow copy of the current entities. */
  get entities() : T[] {
    return this.internalEntities.slice();
  }

  /** @type {number} The amount of direct entities, this group has. */
  get length(): number {
    return this.internalEntities.length;
  }

  /** @inheritdoc */
  export(target: string): Promise<GroupData> {
    let entities = this.internalEntities.map(entity => entity.export(target));
    return Promise.all(entities)
          .then(result => {
            this.exportData.entities = result;
            return super.export(target) as Promise<GroupData>;
          });
  }

  /** @inheritdoc */
  parse(data: GroupData, from: string): Promise<Group<T>> {
    let entities = data.entities || [];
    if (!Array.isArray(entities)) return Promise.reject(new GroupException('No valid entities provided'));
    let prevEntities = this.entities;
    return this.clear()
            .then(() => this.addEntities(entities, from))
            .then(entities => super.parse(data, from))
            .catch(e => this.addEntities(prevEntities)
                        .then(() => Promise.reject(e)) ) as Promise<Group<T>>;
  }

  /** @inheritdoc */
  clone(): Promise<Group<T>> {
    let newGroup = new Group('Copy of ' + this.name);
    let clones = this.internalEntities.map(entity => entity.clone());
    return Promise.all(clones)
      .then(entities => {
        entities.forEach(entity => newGroup.addChild(entity));
        return newGroup;
      }) as Promise<Group<T>>;
  }

  /**
   * Adds the given entity or entity data to this group.
   * Emits the `entity:added` event with the added entity as a parameter.
   *
   * @param {(T | EntityData)} entityOrData The entity or entity data to add to this group.
   * @param {string} [from=''] Has to be provided, if you add raw data instead of an entity instance.
   * @returns {Promise<T>} Resolves the added entity.
   */
  addEntity(entityOrData: T | EntityData, from = ''): Promise<T> {
    let promise: Promise<T>;
    if (entityOrData instanceof Entity) {
      promise = Promise.resolve(entityOrData);
    } else {
      if (typeof from !== 'string')
        throw new GroupException(`The 'from' value has to be a string`);
      let clazz = Entity.getEntityType(entityOrData.type);
      let instance = new clazz();
      promise = instance.parse(entityOrData, from) as Promise<T>;
    }
    return promise.then(entity => {
      let found = this.indexOf(entity);
      if (found >= 0) throw new GroupException(`Duplicate entity id ${entity.id} within group not allowed!`);
      this.internalEntities.push(entity);
      this.addChild(entity);
      entity.parentEntity = this;
      this.emit('added:entity', entity);
      return entity;
    });
  }

  /**
   * Adds the given entities or entity datas to this group.
   * Emits the `entities:added` event with the added entities as a parameter.
   *
   * @param {((T | EntityData)[])} entitiesOrData
   * @param {string} [from=''] Has to be provided, if you add raw data instead of an entity instance.
   * @returns {Promise<T[]>} Resolves the added entities.
   */
  addEntities(entitiesOrData: (T | EntityData)[], from = ''): Promise<T[]> {
    let promises = entitiesOrData.map(val => this.addEntity(val, from));
    return Promise.all(promises)
            .then(entities => {
              this.emit('added:entities', entities);
              return entities;
            });
  }

  /**
   * Removes the given entity or entity with the given id from this group.
   * Emits the `entity:removed` event with the removed entity as a parameter.
   *
   * @param {(T | string)} entityOrId The entity or entity id to remove.
   * @returns {Promise<T>} Resolves the deleted entity.
   */
  removeEntity(entityOrId: T | string): Promise<T> {
    let idx = this.indexOf(entityOrId);
    if (idx < 0) {
      let entityId = entityOrId instanceof Entity ? entityOrId.id : entityOrId;
      return Promise.reject(new GroupException(`Entity for id ${entityId} not found.`));
    }
    let entity = this.internalEntities[idx];
    this.removeChild(entity);
    this.internalEntities.splice(idx, 1);
    entity.parentEntity = null;
    this.emit('removed:entity', entity);
    return Promise.resolve(entity);
  }

  /**
   * Removes the given entities or entity ids from this group.
   * Emits the `entities:removed` event with the removed entities as a parameter.
   *
   * @todo Check if this implementation is good for performance.
   * @param {((T | string)[])} entitiesOrIds The entities or entity ids to remove.
   * @returns {Promise<T[]>} Resolves the removed entities.
   */
  removeEntities(entitiesOrIds: (T | string)[] ): Promise<T[]> {
    let promises = entitiesOrIds.map(val => this.removeEntity(val));
    return Promise.all(promises)
            .then(entities => {
              this.emit('removed:entities', entities);
              return entities;
            }) as Promise<T[]>;
  }

  /**
   * Clears this group, i.e. removes all entities which are attached to this group.
   * Emits the `cleared` event with the removed entities as a parameter.
   *
   * @returns {Promise<T[]>} All removed entities.
   */
  clear(): Promise<T[]> {
    return this.removeEntities(this.internalEntities.slice())
            .then(entities => {
              this.emit('cleared', entities);
              return entities;
            });
  }

  /**
   * Searches for the given entity.
   *
   * @param {(T | string)} entityOrId
   * @returns {number} The index of the given entitiy or id.
   */
  indexOf(entityOrId: T | string): number {
    if (entityOrId instanceof Entity)
      return this.internalEntities.indexOf(entityOrId);
    else
      return this.internalEntities.findIndex(entity => entity.id === entityOrId);
  }

}
