import * as _ from 'lodash';
import { Entity, EntityData } from "./entity";

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
export class Group<T extends Entity> extends Entity {

  exportData: GroupData; // Override the type of the export data.

  /** @type {T[]} Internal list of all added entities. */
  protected internalEntities: T[] = [];

  /** @type {T[]} A shallow copy of the current entities. */
  get entities() : T[] {
    return this.internalEntities.slice();
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
    if (!Array.isArray(entities)) return Promise.reject(new Error('No valid entities provided'));
    // Create an instance for each entity and parse it
    let parsers = entities.map(entityData => {
      let clazz = Entity.getEntityType(entityData.type);
      let instance = new clazz();
      return instance.parse(entityData, from);
    });
    let prevEntities = this.internalEntities.slice();
    return this.clear()
            .then(() => this.addEntities(entities))
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
   * @returns {Promise<T>} Resolves the added entity.
   */
  addEntity(entityOrData: T | EntityData): Promise<T> {
    let promise: Promise<T>;
    if (entityOrData instanceof Entity) {
      promise = Promise.resolve(entityOrData);
    } else {
      let clazz = Entity.getEntityType(entityOrData.type);
      let instance = new clazz();
      promise = instance.parse(entityOrData, '') as Promise<T>;
    }
    return promise.then(entity => {
      let found = this.internalEntities.findIndex(ent => entity.id === ent.id);
      if (found) throw new Error(`Duplicate entity id ${entity.id} within group not allowed!`);
      this.internalEntities.push(entity);
      this.addChild(entity);
      entity.parentEntity = this;
      this.emit('entity:added', entity);
      return entity;
    });
  }

  /**
   * Adds the given entities or entity datas to this group.
   * Emits the `entities:added` event with the added entities as a parameter.
   *
   * @param {((T | EntityData)[])} entitiesOrData
   * @returns {Promise<T[]>} Resolves the added entities.
   */
  addEntities(entitiesOrData: (T | EntityData)[]): Promise<T[]> {
    let promises = entitiesOrData.map(val => this.addEntity(val));
    return Promise.all(promises)
            .then(entities => {
              this.emit('entities:added', entities);
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
    let entityId = entityOrId instanceof Entity ? entityOrId.id : entityOrId;
    let idx = this.internalEntities.findIndex(entity => entity.id === entityId);
    if (idx < 0)
      return Promise.reject(new Error(`Entity for id ${entityId} not found.`));
    let entity = this.internalEntities[idx];
    this.removeChild(entity);
    this.internalEntities.splice(idx, 1);
    entity.parentEntity = null;
    this.emit('entity:removed', entity);
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
              this.emit('entities:removed', entities);
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

}

// Make sure the group type gets registered
Entity.registerEntityType(Group);
