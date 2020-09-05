import * as uuid from 'uuid/v4';
import * as _ from 'lodash';
import { SceneEntityException } from '../exception/scene/entity';
import { AbstractEntity } from '@trixt0r/ecs';
import { SceneComponent, cloneComponent } from './component';
import { SceneComponentCollection } from './component.collection';
import { cloneDeep } from 'lodash';

/**
 * Data which has to be exported for an entity.
 *
 * @interface SceneEntityData
 */
export interface SceneEntityData {

  /**
   *The id of the entity.
   */
  id: string;

  /**
   * The component data of the entity.
   */
  components: SceneComponent[];

  /**
   * The parent entity id.
   */
  parent: string;

  /**
   * The type of the entity.
   */
  type: SceneEntityType;
}

export enum SceneEntityType {

  /**
   * Defines a scene entity as a plain object.
   * A plain object can not be referenced as a parent,
   * but reference a group or layer as a parent.
   */
  Object = 'object',

  /**
   * Defines a scene entity as a group,
   * i.e. an entity which can be referenced as a parent
   * and therefore hold a list of other scene entities.
   * A group can reference another group or layer as a parent.
   */
  Group = 'group',

  /**
   * Defines a scene entity as a layer,
   * A layer can be referenced as a parent, but never references a parent.
   */
  Layer = 'layer',

}

/**
 * An entity represents any object which can be rendered in a scene.
 * The scene holds a collection/list of entities.
 *
 * @export
 * @class Entity
 * @extends {AbstractEntity}
 */
export class SceneEntity extends AbstractEntity<SceneComponent> {

  /**
   * Creates a new entity from the given scene entity data.
   *
   * Override this to your needs, but make sure to call this implementation at the end, so the `parsed` event gets
   * emitted right before resolving.
   *
   * @param data The data to create the entity from.
   * @returns The entity on success.
   */
  static async import(data: SceneEntityData): Promise<SceneEntity> {
    if (!data.id) return Promise.reject(new SceneEntityException('No id provided!'));

    const entity = new SceneEntity(data.id);
    entity.parent = data.parent;
    entity.type = data.type;
    if (Array.isArray(data.components)) {
      entity.components.set.apply(entity.components, data.components);
    } else {
      console.warn(`[SceneEntity] Note: No components defined for importing entity ${entity.id}`);
    }

    return entity;
  }

  /**
   * The type of this entity.
   */
  type = SceneEntityType.Object;

  /**
   * The parent of this entity, if any.
   */
  parent: string = null;

  /**
   * The child entity ids.
   */
  children: string[]= [];

  /**
   * @inheritdoc
   */
  _components: SceneComponentCollection<SceneComponent>;

  /**
   * @inheritdoc
   */
  readonly components: SceneComponentCollection<SceneComponent>;


  /**
   * Creates a new scene entity.
   *
   * @param [id = uuid()] The id for this entity.
   */
  constructor(public id: string = uuid()) {
    super(id);
    this._components = new SceneComponentCollection();
    this._components.addListener(this, true);
  }

  /**
   * Exports the current data of this entity.
   *
   * @returns The exported data on success.
   */
  async export(): Promise<SceneEntityData> {
    const data: SceneEntityData = {
      id: <string>this.id,
      components: this.components.map(comp => cloneDeep(comp)),
      parent: this.parent,
      type: this.type,
    };
    return data;
  }
}
