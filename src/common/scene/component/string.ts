import { SceneComponent } from '../component';

/**
 * The string component can hold any string.
 */
export interface StringSceneComponent extends SceneComponent {

  /**
   * The string value.
   */
  string: string;
}

/**
 * Creates a number component with the given parameters.
 *
 * @param id
 * @param number
 * @param group
 */
export function createStringComponent(id: string, string: string, group?: string): StringSceneComponent {
  return {
    id,
    type: 'string',
    string,
    group,
  }
}
