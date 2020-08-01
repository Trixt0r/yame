import { SceneComponent } from '../component';

/**
 * The color component can hold rgb values and an alpha value.
 */
export interface ColorSceneComponent extends SceneComponent {

  /**
   * The red value, between 0 and 255.
   */
  red: number;

  /**
   * The green value, between 0 and 255.
   */
  green: number;

  /**
   * The blue value, between 0 and 255.
   */
  blue: number;

  /**
   * The alpha value, between 0 and 1.
   */
  alpha?: number;
}


/**
 * Creates a new black non-transparent color component with the given parameters.
 *
 * @param id
 * @param group
 */
export function createColorComponent(id: string, group?: string): ColorSceneComponent {
  return {
    id,
    type: 'color',
    red: 0,
    green: 0,
    blue: 0,
    alpha: 1,
    group,
  };
}
