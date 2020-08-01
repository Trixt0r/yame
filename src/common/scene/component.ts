import * as _ from 'lodash';
import { Component } from '@trixt0r/ecs';
// import { Type } from 'common/type';
// import { SceneComponentException } from 'common/exception/scene/component';
// import { SceneEntityData } from './entity';

// /**
//  * A listener which listens for changes on a component.
//  *
//  * @export
//  * @interface SceneComponentListener
//  */
// export interface SceneComponentListener {

//   /**
//    * Called as soon as the value of the component changed.
//    *
//    * @param newValue The new value.
//    * @param oldValue The old value.
//    */
//   onChange(newValue: unknown, oldValue: unknown): void;
// }

export interface SceneComponentTransform<V, R> {

  /**
   * Applies the transformation to the given value and returns the new one.
   *
   * @param {V} value The value to transform.
   * @returns {R}
   */
  apply(value: V): R;

  /**
   * Applies the reverse transformation and returns the new value.
   *
   * @param value The value to reverse.
   */
  reverse(value: R): V;
}

// /**
//  * The meta data interface.
//  *
//  * @export
//  * @interface SceneComponentMetaData
//  */
// export interface SceneComponentMetaData {
//   /**
//    * Transformation reference.
//    * Useful if you want to display internal values differently in the GUI.
//    */
//   transform?: SceneComponentTransform<unknown, unknown>;

//   [key: string]: unknown;
// }

// /**
//  * The component data which can be exported and imported.
//  *
//  * @export
//  * @interface SceneComponentData
//  * @template T
//  */
// export interface SceneComponentData<T = unknown, M extends SceneComponentMetaData = SceneComponentMetaData> {

//   /**
//    * The unique id for the component.
//    */
//   id?: string;

//   /**
//    * The value of the component.
//    */
//   value: T;

//   /**
//    * Meta information about the component data.
//    */
//   meta?: M;

//   /**
//    * The component type.
//    */
//   type: string;
// }

// /**
//  * Scene component type mapping.
//  *
//  * @export
//  * @interface SceneComponentTypes
//  * @template T
//  */
// export interface SceneComponentTypes<T> {
//   [key: string]: T;
// }

// /**
//  * The scene component holds a certain value and can notify listeners about changes to that value.
//  *
//  * @export
//  * @class SceneComponent
//  * @extends Dispatcher<L>
//  * @template T The value type of the component.
//  * @template L The listener type of the listener.
//  */
// SceneComponentType()
// export class SceneComponent<T = unknown,
//                             L extends SceneComponentListener = SceneComponentListener,
//                             M extends SceneComponentMetaData = SceneComponentMetaData>
//                             extends Dispatcher<L>
//                             implements Component {

//   /**
//    * The unique id of this component type.
//    */
//   static readonly type: string = 'default';

//   /**
//    * The component type map for being able to import and identify components by ids.
//    */
//   static readonly registeredTypes: SceneComponentTypes<typeof SceneComponent> = { };

//   /**
//    * The type of the component.
//    * Automatically resolved on initialization.
//    */
//   protected _type: string;

//   /**
//    * The internal value of this component.
//    */
//   protected _value: T;

//   /**
//    * A unique id for the component.
//    */
//   public readonly id?: string;

//   /**
//    * Additional meta information about the component.
//    */
//   public meta: M;

//   /**
//    * Optional parent component reference.
//    */
//   public parent: SceneComponent = null;

//   /**
//    * Registers the given component type under the given id.
//    *
//    * @static
//    * @template C
//    * @param type The component class.
//    * @param name The component id. Has to be unique across the whole app.
//    */
//   static registerType<C extends typeof SceneComponent>(type: C, name?: string): void {
//     if (typeof name !== 'string') name = type.type ? type.type : type.name;
//     const types = SceneComponent.registeredTypes;
//     if (types[name]) {
//       // TODO: log via logger service!
//       console.warn(
//         `The component type '${name}' was already registered as '${types[name].constructor.name}'.`,
//         `The type gets now overridden by '${type.constructor.name}'.`,
//         `Note that this may harm the functionality of the app!`
//       );
//     }
//     types[name] = type;
//   }

//   /**
//    * Gets the component type for the given identifier.
//    *
//    * @param {string} type
//    * @returns The component class.
//    */
//   static getType(type: string): Type<SceneComponent> {
//     return SceneComponent.registeredTypes[type];
//   }

//   /**
//    * Imports the given data and returns an instance with the data.
//    *
//    * @param data
//    */
//   static async import(data: SceneComponentData): Promise<SceneComponent> {
//     const type = SceneComponent.getType(data.type);
//     if (!type) throw new SceneComponentException(`No component type found for "${type}"`);
//     try {
//       const re = await (type as typeof SceneComponent).internalImport(data);
//       if (data.meta) re.meta = data.meta;
//       return re;
//     } catch (e) {
//       throw new SceneComponentException(e.message);
//     }
//   }

//   /**
//    * Returns the scene component data objects on the given entity with the given type.
//    *
//    * @param entity The entity to search in.
//    * @param type The type to search for.
//    */
//   static byType(entity: SceneEntityData, type: string): SceneComponentData[] {
//     return entity.components.filter(comp => comp.type === type);
//   }

//   /**
//    * Returns the scene component data object on the given entity with the given id.
//    *
//    * @param entity The entity.
//    * @param id The id to search for.
//    */
//   static byId(entity: SceneEntityData, id: string): SceneComponentData {
//     return entity.components.find(comp => comp.id === id);
//   }

//   /**
//    * Imports the given data and returns an instance with the data.
//    * Note, that if the implementation of the component has to perform a more complex import, override this method.
//    * The correct implementation will be called during the import process.
//    *
//    * @param data
//    */
//   protected static async internalImport(data: SceneComponentData): Promise<SceneComponent> {
//     return new SceneComponent(data.value, data.id, data.type);
//   }

//   constructor(initialValue?: T, id?: string, type?: string, meta?: M) {
//     super();
//     this._value = initialValue;
//     this.id = id;
//     this._type = type || Object.getPrototypeOf(this).constructor.type || SceneComponent.type;
//     this.meta = _.isNil(meta) ? <M>{ } : meta;
//   }

//   /**
//    * The type of the component.
//    */
//   get type(): string {
//     return this._type;
//   }

//   /**
//    * The value of this component.
//    */
//   get value(): T {
//     return this._value;
//   }

//   set value(value: T) {
//     if (value === this._value) return;
//     const old = this._value;
//     this._value = value;
//     (this as Dispatcher<SceneComponentListener>).dispatch.apply(this, ['onChange', value, old]);
//   }

//   /**
//    * Clones this components with all its properties and returns the new instance.
//    */
//   async clone(): Promise<SceneComponent> {
//     return new SceneComponent(this._value, this.id, this._type, _.cloneDeep(this.meta));
//   }

//   /**
//    * Exports the data of this component as a plain object und returns it.
//    */
//   async export(): Promise<SceneComponentData<T, M>> {
//     const re: SceneComponentData<T, M> = {
//       value: this._value,
//       type: this.type
//     };
//     if (this.id) {
//       re.id = this.id;
//     }
//     if (this.meta && Object.keys(this.meta).length > 0) {
//       re.meta = this.meta;
//     }
//     return re;
//   }

// }

// /**
//  * Registers a scene component type.
//  * You should use the method to register your entity class, so resolving entity types will works as expected.
//  *
//  * @param constructor The class constructor.
//  */
// export function SceneComponentType<T extends Type<SceneComponent>>(name?: string) {
//   return (constructor: T) => {
//     SceneComponent.registerType(constructor as unknown as typeof SceneComponent, name);
//   };
// }

export interface SceneComponent extends Component {

  /**
   * The id of the component.
   */
  id: string;

  /**
   * The type of the component.
   */
  type: string;

  /**
   * Whether this component is enabled or not.
   */
  enabled?: boolean;

  /**
   * Whether this component can be removed or not.
   */
  removable?: boolean;

  /**
   * Whether this component can be edited.
   */
  editable?: boolean;

  /**
   * The group this component belongs to.
   */
  group?: string;

  /**
   * A label to display in the gui.
   */
  label?: string;

  /**
   * Transformation reference.
   * Useful if you want to display internal values differently in the GUI.
   */
  transform?: SceneComponentTransform<unknown, unknown>;

  /**
   * Whether this component is marked for deletion.
   */
  markedForDelete?: boolean;

  [key: string]: unknown;
}

/**
 * Creates a component with the given parameters.
 *
 * @param id The id of the component.
 * @param type The type of the component.
 * @param group The group, the component belongs to.
 */
export function createComponent(id: string, type: string, group?: string): SceneComponent {
  return {
    id,
    type,
    group
  };
}

/**
 * Clones the given component and returns it.
 * Note, that the clone won't have any id.
 *
 * @param comp The component to clone.
 */
export function cloneComponent(comp: SceneComponent): SceneComponent {
  const re = _.cloneDeep(comp);
  delete re.id;
  return re;
}
