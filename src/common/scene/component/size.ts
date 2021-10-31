import { SceneComponent } from '../component';

/**
 * The size component can hold a with and a height value.
 */
export interface SizeSceneComponent extends SceneComponent {

  /**
   * The width value.
   */
  width: number;

  /**
   * The height value.
   */
  height: number;

  /**
   * The local (internal) width.
   */
  localWidth: number;

  /**
   * The local (internal) height.
   */
  localHeight: number;
}

/**
 * Creates a size component with the given parameters.
 *
 * @param id
 * @param x
 * @param y
 * @param group
 */
export function createSizeComponent(id: string, width = 50, height = 50, group?: string): SizeSceneComponent {
  return {
    id,
    type: 'size',
    width,
    height,
    localWidth: width,
    localHeight: height,
    group
  };
}
