import { SceneComponent } from '../component';

// export interface PointComponentListener extends SceneComponentListener {

//   /**
//    * Called as soon as the x value changed.
//    *
//    * @param newX The new x-coordinate.
//    * @param oldX The old x-coordinate.
//    * @returns {void}
//    */
//   onChangeX(newX: number, oldX: number): void;

//   /**
//    * Called as soon as the y value changed.
//    *
//    * @param newY The new y-coordinate.
//    * @param oldY The old y-coordinate.
//    * @returns {void}
//    */
//   onChangeY(newY: number, oldY: number): void;

// }

/**
 * The point component can hold an x and y value.
 *
 * @export
 * @class StringSceneComponent
 * @extends {SceneComponent<String>}
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

  // static readonly type: string = 'point';

  // constructor(x: number = 0, y: number = 0) {
  //   super([x, y]);
  //   this.addListener({
  //     onChange: newValue => {
  //       this.x = newValue[0];
  //       this.y = newValue[1];
  //     }
  //   });
  // }

  // /**
  //  * The x-coordinate.
  //  */
  // get x(): number {
  //   return this._value[0];
  // }

  // set x(value: number) {
  //   if (value === this.x) return;
  //   const old = this.x;
  //   this._value[0] = value;
  //   this.dispatch('onChangeX', value, old);
  // }

  // /**
  //  * The y-coordinate.
  //  */
  // get y(): number {
  //   return this._value[1];
  // }

  // set y(value: number) {
  //   if (value === this.y) return;
  //   const old = this.y;
  //   this._value[1] = value;
  //   this.dispatch('onChangeY', value, old);
  // }
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
