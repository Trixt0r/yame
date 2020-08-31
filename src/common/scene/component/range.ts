import { SceneComponent } from '../component';

/**
 * The range component can hold any number in the configured range.
 */
export interface RangeSceneComponent extends SceneComponent {

  /**
   * The current value.
   */
  value: number;

  /**
   * The minimal possible value.
   */
  min?: number;

  /**
   * The maximum possible value.
   */
  max?: number;

  /**
   * The value for making a step towards the max. or min. value.
   */
  step?: number;

  /**
   * Ticks to display in the gui.
   */
  ticks?: number;
}

export function createRangeComponent(id: string, value: number, group?: string): RangeSceneComponent {
  return {
    id,
    value,
    type: 'range',
    group,
  };
}
