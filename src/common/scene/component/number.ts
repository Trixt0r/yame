import { SceneComponent } from '../component';

/**
 * The number component can hold any number the platform can hold.
 */
export interface NumberSceneComponent extends SceneComponent {

  /**
   * The number value of the component.
   */
  number: number;
}

/**
 * Creates a number component with the given parameters.
 *
 * @param id
 * @param number
 * @param group
 */
export function createNumberComponent(id: string, number: number, group?: string): NumberSceneComponent {
  return {
    id,
    type: 'number',
    number,
    group,
  }
}
