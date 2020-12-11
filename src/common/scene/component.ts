import { Component } from '@trixt0r/ecs';
import { cloneDeep } from 'lodash';

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
   * The component type, this component extends.
   */
  extends?: string;

  /**
   * Whether this component is hidden in the gui or not.
   */
  hidden?: boolean;

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
   * Whether this component has mixed values. Used for gui.
   */
  mixed?: boolean;

  /**
   * The group this component belongs to.
   */
  group?: string;

  /**
   * A label to display in the gui.
   */
  label?: string;

  /**
   * A placeholder for the gui.
   */
  placeholder?: unknown;

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
  const re = cloneDeep(comp);
  delete (re as any).id;
  return re;
}
