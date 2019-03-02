import * as _ from 'lodash';
import { Entity, EntityData, EntityType } from './entity';
import { GroupException } from '../exception/entity/group';

export interface GroupData extends EntityData {
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

  /** @type {T[]} Flat list of all entities in this group, i.e. direct and indirect child entities. */
  readonly flatEntities: T[] = [];

  /** @type {T[]} Internal list of all added entities. */
  protected internalEntities: T[] = [];

  /** @type {T[]} A shallow copy of the current __direct__ entities. */
  get entities(): T[] {
    return this.internalEntities.slice();
  }

  /** @type {number} The amount of direct entities, this group has. */
  get length(): number {
    return this.internalEntities.length;
  }

  /** @inheritdoc */
  export(target?: string): Promise<GroupData> {
    const entities = this.internalEntities.map(entity => entity.export(target));
    return Promise.all(entities).then(result => {
      this.exportData.entities = result;
      return super.export(target) as Promise<GroupData>;
    });
  }

  /** @inheritdoc */
  parse(data: GroupData, from: string): Promise<Group<T>> {
    const entities = data.entities || [];
    if (!Array.isArray(entities)) return Promise.reject(new GroupException('No valid entities provided'));
    const prevEntities = this.entities;
    return this.clear()
      .then(() => this.addEntities(entities, from))
      .then(() => super.parse(data, from))
      .catch(e => this.addEntities(prevEntities).then(() => Promise.reject(e))) as Promise<Group<T>>;
  }

  /** @inheritdoc */
  clone(): Promise<Group<T>> {
    const newGroup = new Group('Copy of ' + this.name);
    const clones = this.internalEntities.map(entity => entity.clone());
    return Promise.all(clones).then(entities => {
      entities.forEach(entity => newGroup.addChild(entity));
      return newGroup;
    }) as Promise<Group<T>>;
  }

  /**
   * Adds the given entity to the flat entity list.
   *
   * Makes sure, that the flat hierarchy is maintained if entities get added or removed in sub groups.
   * Should be called if you add entites to the `internalEntities` array by your own,
   * to guarantee that the flat entity list is in synch with the hierarchy in this group.
   *
   * @param {T} entity The entity to add.
   * @returns {void}
   */
  protected addFlatEntity(entity: T): void {
    const found = this.flatIndexOf(entity);
    if (found >= 0) return console.warn(`[Group] Entity ${entity.id} is already in flat list!`);
    this.flatEntities.push(entity);
    this.emit('added:flat:entity', entity);
    if (entity instanceof Group) entity.flatEntities.forEach(e => this.addFlatEntity(e));
    entity.on('added:entity', e => this.addFlatEntity(e), this);
    entity.on(
      'removed:entity',
      e => {
        const idx = this.flatIndexOf(e);
        if (idx >= 0) this.removeFlatEntity(e);
      },
      this
    );
  }

  /**
   * Removes the given entity from the flat entity list and all its entities.
   *
   * Should be called if you add entites to the `internalEntities` array by your own,
   * to guarantee that the flat entity list is in synch with the hierarchy in this group.
   *
   * @param {T} entity
   * @returns {void}
   */
  protected removeFlatEntity(entity: T): void {
    const idx = this.flatIndexOf(entity);
    if (idx < 0) return console.warn(`[Group] Entity ${entity.id} is not in flat list!`);
    if (entity instanceof Group) entity.flatEntities.forEach(e => this.removeFlatEntity(e));
    this.flatEntities.splice(idx, 1);
    this.emit('removed:flat:entity', entity);
    entity.removeListener(<any>'added:entity', null, this);
    entity.removeListener(<any>'removed:entity', null, this);
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
      if (typeof from !== 'string') throw new GroupException(`The 'from' value has to be a string`);
      const clazz = Entity.getEntityType(entityOrData.type);
      const instance = new clazz();
      promise = instance.parse(entityOrData, from) as Promise<T>;
    }
    return promise.then(entity => {
      const found = this.indexOf(entity);
      if (found >= 0) throw new GroupException(`Duplicate entity id ${entity.id} within group not allowed!`);
      this.internalEntities.push(entity);
      this.addChild(entity);
      entity.parentEntity = this;
      this.addFlatEntity(entity);
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
    const promises = entitiesOrData.map(val => this.addEntity(val, from));
    return Promise.all(promises).then(entities => {
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
    const idx = this.indexOf(entityOrId);
    if (idx < 0) {
      const entityId = entityOrId instanceof Entity ? entityOrId.id : entityOrId;
      return Promise.reject(new GroupException(`Entity for id ${entityId} not found.`));
    }
    const entity = this.internalEntities[idx];
    this.removeChild(entity);
    this.internalEntities.splice(idx, 1);
    this.removeFlatEntity(entity);
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
  removeEntities(entitiesOrIds: (T | string)[]): Promise<T[]> {
    const promises = entitiesOrIds.map(val => this.removeEntity(val));
    return Promise.all(promises).then(entities => {
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
    return this.removeEntities(this.internalEntities.slice()).then(entities => {
      this.emit('cleared', entities);
      return entities;
    });
  }

  /**
   * Returns the index of the given entity or id.
   *
   * @param {(T | string)} entityOrId The actual entity or id of the entity.
   * @returns {number} The index of the given entitiy or id.
   */
  indexOf(entityOrId: T | string): number {
    if (entityOrId instanceof Entity) return this.internalEntities.indexOf(entityOrId);
    else return this.internalEntities.findIndex(entity => entity.id === entityOrId);
  }

  /**
   * Returns the flat index of the given entity or id.
   *
   * @param {(T | string)} entityOrId The actual entity or id of the entity.
   * @returns {number} The flat index of the given entitiy or id.
   */
  flatIndexOf(entityOrId: T | string): number {
    if (entityOrId instanceof Entity) return this.flatEntities.indexOf(entityOrId);
    else return this.flatEntities.findIndex(entity => entity.id === entityOrId);
  }

  /**
   * Determines whether this group includes a certain entity, returning true or false as appropriate.
   *
   * @param {T} entity The element to search for.
   * @param {number} fromIndex The position in this array at which to begin searching for searchElement.
   * @param {boolean} [deep=false] Whether to search all sub groups, if any are present.
   * @returns {boolean}
   */
  includes(entity: T, fromIndex: number, deep: boolean = false): boolean {
    return (deep ? this.flatEntities : this.internalEntities).includes(entity, fromIndex);
  }

  /**
   * Performs the specified action for each element in an array.
   *
   * @param {(entity: T, index: number, array: T[]) => any} callbackFn
   *        A function that accepts up to three arguments.
   *        forEach calls the callbackfn function one time for each element in the array.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   *                        If thisArg is omitted, undefined is used as the this value.
   * @param {boolean} [deep=false] Whether to iterate over all sub groups and entities, if those exist.
   */
  forEach(callbackFn: (entity: T, index: number, array: T[]) => any, thisArg?: any, deep: boolean = false): void {
    (deep ? this.flatEntities : this.internalEntities).forEach(callbackFn, thisArg);
  }

  /**
   * Returns the value of the first element in the array where predicate is true, and undefined
   * otherwise.
   *
   * @param {(entity: T, index: number, array: T[]) => any} predicate
   *        Find calls predicate once for each element of the array, in ascending order,
   *        until it finds one where predicate returns true. If such an element is found, find
   *        immediately returns that element value. Otherwise, find returns undefined.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   *                        If thisArg is omitted, undefined is used as the this value.
   * @param {boolean} [deep=false] Whether to search all sub groups, if any are present.
   * @returns {T}
   */
  find(predicate: (entity: T, index: number, array: T[]) => any, thisArg?: any, deep: boolean = false): T {
    return (deep ? this.flatEntities : this.internalEntities).find(predicate, thisArg);
  }

  /**
   * Returns the index of the first element in the array where predicate is true, and -1
   * otherwise.
   *
   * @param {(entity: T, index: number, array: T[]) => any} predicate
   *        Find calls predicate once for each element of the array, in ascending order,
   *        until it finds one where predicate returns true. If such an element is found,
   *        findIndex immediately returns that element index. Otherwise, findIndex returns -1.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   *                        If thisArg is omitted, undefined is used as the this value.
   * @param {boolena} [deep=false] Whether to search all sub groups, if any are present.
   * @returns {number}
   */
  findIndex(predicate: (entity: T, index: number, array: T[]) => any, thisArg?: any, deep: boolean = false): number {
    return (deep ? this.flatEntities : this.internalEntities).findIndex(predicate, thisArg);
  }

  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   *
   * @param {(entity: T, index: number, array: T[]) => any} callbackFn
   *        A function that accepts up to three arguments.
   *        The filter method calls the callbackfn function one time for each element in the array.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   *                        If thisArg is omitted, undefined is used as the this value.
   * @param {boolean} [deep=false] Whether to search all sub groups, if any are present.
   * @returns {T[]}
   */
  filter(callbackFn: (entity: T, index: number, array: T[]) => any, thisArg?: any, deep: boolean = false): T[] {
    return (deep ? this.flatEntities : this.internalEntities).filter(callbackFn, thisArg);
  }

  /**
   * Calls a defined callback function on each element of an array, and returns an array that contains the results.
   *
   * @param {(entity: T, index: number, array: T[]) => any} callbackFn
   *        A function that accepts up to three arguments.
   *        The map method calls the callbackfn function one time for each element in the array.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   *                        If thisArg is omitted, undefined is used as the this value.
   * @param {boolean} [deep=false] Whether to search all sub groups, if any are present.
   * @returns {any[]}
   */
  map(callbackFn: (entity: T, index: number, array: T[]) => any, thisArg?: any, deep: boolean = false): any[] {
    return (deep ? this.flatEntities : this.internalEntities).map(callbackFn, thisArg);
  }

  /**
   *
   * Determines whether all the members of an array satisfy the specified test.
   *
   * @param {(entity: T, index: number, array: T[]) => any} callbackFn
   *        A function that accepts up to three arguments.
   *        The every method calls the callbackfn function for each element in array1 until the callbackfn
   *        returns false, or until the end of the array.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   *                        If thisArg is omitted, undefined is used as the this value.
   * @param {boolean} [deep=false] Whether to search all sub groups, if any are present.
   * @returns {boolean}
   */
  every(callbackFn: (entity: T, index: number, array: T[]) => any, thisArg?: any, deep: boolean = false): boolean {
    return (deep ? this.flatEntities : this.internalEntities).every(callbackFn, thisArg);
  }

  /**
   * Determines whether the specified callback function returns true for any element of an array.
   *
   * @param {(entity: T, index: number, array: T[]) => any} callbackFn
   *        A function that accepts up to three arguments.
   *        The some method calls the callbackfn function for each element in array1 until the callbackfn returns true,
   *        or until the end of the array.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   *                        If thisArg is omitted, undefined is used as the this value.
   * @param {boolean} [deep=false] Whether to search all sub groups, if any are present.
   * @returns {boolean}
   */
  some(callbackFn: (entity: T, index: number, array: T[]) => any, thisArg?: any, deep: boolean = false): boolean {
    return (deep ? this.flatEntities : this.internalEntities).some(callbackFn, thisArg);
  }

  /**
   * Calls the specified callback function for all the elements in an array.
   * The return value of the callback function is the accumulated result,
   * and is provided as an argument in the next call to the callback function.
   *
   * @param {(previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U} callbackFn
   *        A function that accepts up to four arguments.
   *        The reduce method calls the callbackfn function one time for each element in the array.
   * @param {U} initialValue If initialValue is specified, it is used as the initial value to start the accumulation.
   *                         The first call to the callbackfn function provides this value as an argument instead of
   *                         an array value.
   * @param {boolean} [deep=false] Whether to search all sub groups, if any are present.
   * @returns {U}
   */
  reduce<U>(
    callbackFn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
    initialValue: U,
    deep: boolean = false
  ): U {
    return (deep ? this.flatEntities : this.internalEntities).reduce(callbackFn, initialValue);
  }

  /**
   * Calls the specified callback function for all the elements in an array, in descending order.
   * The return value of the callback function is the accumulated result,
   * and is provided as an argument in the next call to the callback function.
   *
   * @param {(previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U} callbackFn
   * @param {U} initialValue If initialValue is specified, it is used as the initial value to start the accumulation.
   *                         The first call to the callbackfn function provides this value as an argument instead of
   *                         an array value.
   * @param {boolean} [deep=false] Whether to search all sub groups, if any are present.
   * @returns {U}
   */
  reduceRight<U>(
    callbackFn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
    initialValue: U,
    deep: boolean = false
  ): U {
    return (deep ? this.flatEntities : this.internalEntities).reduceRight(callbackFn, initialValue);
  }
}
