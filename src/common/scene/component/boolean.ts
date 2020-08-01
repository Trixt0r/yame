import { SceneComponent } from '../component';

/**
 * The boolean component can hold either `true` or `false` as a value.
 */
export interface BooleanSceneComponent extends SceneComponent {

  /**
   * The boolean value.
   */
  bool: boolean;
}

/**
 * Creates a boolean component with the given parameters.
 *
 * @param id
 * @param bool
 * @param group
 */
export function createBooleanComponent(id: string, bool: boolean, group?: string): BooleanSceneComponent {
  return {
    id,
    type: 'boolean',
    bool,
    group,
  }
}
