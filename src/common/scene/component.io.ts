import * as _ from 'lodash';
import { cloneDeep, merge, omit } from 'lodash';
import { ISerializeContext } from 'common/interfaces/serialize-context.interface';
import { SceneComponent } from './component';
import { SceneEntity } from './entity';

/**
 * An io processor is responsible for serializing and deserializing component data for certain component ids or types.
 *
 * Note, that an io processor can process multiple component data.
 */
export interface IOProcessor {

  /**
   * The component id(s) to be matched.
   */
  id?: string | string[];

  /**
   * The component type(s) to be matched.
   */
  type?: string | string[];

  /**
   * Serializes the given component for saving it to a resource.
   *
   * @param comp The component to be serialized.
   * @param entity The scene entity the component belongs to.
   * @param context Any context.
   * @return Resolves a plain object for being written to a resource.
   */
  serialize<T>(component: SceneComponent, entity: SceneEntity, context: ISerializeContext): Promise<T | null>;

  /**
   * Deserializes the given component data into an actual component.
   *
   * @param data The parsed component data to be deserialized.
   * @param entity The scene entity the component belongs to.
   * @param context Any context.
   * @return Resolves a component for being used by the entity component system.
   */
  deserialize<I extends Partial<SceneComponent>>(
    data: I,
    entity: SceneEntity,
    ctx: ISerializeContext
  ): Promise<Partial<SceneComponent> | null>;
}

const inputOutput: IOProcessor[] = [];

/**
 * Generates an io processor filter for finding relevant processors on the given component.
 *
 * @param comp The partial component data to be matched by an io processor.
 */
function ioFilter(comp: Partial<SceneComponent>) {
  return (io: IOProcessor) => {
    if (Array.isArray(io.id) && io.id.indexOf(comp.id!) >= 0) return true;
    if (
      Array.isArray(io.type) &&
      (io.type.indexOf(comp.type!) >= 0 || (comp.extends && io.type.indexOf(comp.extends) >= 0))
    )
      return true;
    return io.id === comp.id || io.type === comp.type || (comp.extends && io.type === comp.extends);
  };
}

/**
 * Omits attributes from the given component, which are useless for serialization.
 *
 * @param component The component to omit attributes from.
 * @return An object containing only necessary information for serialization.
 */
export function omitForSerialization(component: SceneComponent) {
  return omit(
    component,
    'extends',
    'hidden',
    'enabled',
    'mixed',
    'transform',
    'removable',
    'editable',
    'label',
    'placeholder',
    'members',
    'allowedMemberTypes',
    'allowedMemberItems',
    'allowedTypes',
    'expanded'
  );
}

/**
 * Serializes the given component for saving it to a resource.
 *
 * @param comp The component to be serialized.
 * @param entity The scene entity the component belongs to.
 * @param context Any context.
 * @return Resolves a plain object for being written to a resource.
 */
export async function serialize<T extends SceneComponent>(
  comp: T,
  entity: SceneEntity,
  context: ISerializeContext
): Promise<Partial<T> | null> {
  if (comp.markedForDelete) return null;
  let re = (omitForSerialization(comp) as unknown) as T;
  const inputOutputs = inputOutput.filter(ioFilter(comp));
  const processed = await Promise.all(inputOutputs.map((it) => it.serialize(comp, entity, context)));
  return merge.apply(_, [re, ...processed]);
}

/**
 * Deserializes the given component data into an actual component.
 *
 * @param data The parsed component data to be deserialized.
 * @param entity The scene entity the component belongs to.
 * @param context Any context.
 * @return Resolves a component for being used by the entity component system.
 */
export async function deserialize<I extends Partial<SceneComponent>, T extends SceneComponent>(
  data: I,
  entity: SceneEntity,
  context: ISerializeContext
): Promise<T> {
  let comp = cloneDeep(data);
  const inputOutputs = inputOutput.filter(ioFilter(data));
  const processed = await Promise.all(inputOutputs.map((it) => it.deserialize(comp, entity, context)));
  return merge.apply(_, [comp, ...processed]);
}

/**
 * Registers an io component processor.
 *
 * @param io The processor
 */
export function registerIO(io: IOProcessor): void { inputOutput.push(io); }
