import { SceneComponent } from '../component';

/**
 * The point component can hold an x and y value.
 */
export interface PointSceneComponent extends SceneComponent {

  /**
   * The x-coordinate.
   */
  x: number;

  /**
   * The y-coordinate.
   */
  y: number;
}

/**
 * Creates a position component with the given parameters.
 *
 * @param id
 * @param x
 * @param y
 * @param group
 */
export function createPointComponent(id: string, x = 0, y = 0, group?: string): PointSceneComponent {
  return {
    id,
    type: 'point',
    x,
    y,
    group
  };
}
