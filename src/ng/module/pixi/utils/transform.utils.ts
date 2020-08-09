import { DisplayObject, Matrix, Point } from 'pixi.js';

const tmpPivot = new Point();
const invertedParentTransform = new Matrix();

/**
 * Transforms the given object with its world transform
 * to the coordinate space of the given parent object.
 *
 * @param object The object to transform.
 * @param parent The parent object into which to transform the values.
 */
export function transformTo(object: DisplayObject, parent: DisplayObject): void {
  tmpPivot.copyFrom(object.pivot);
  object.pivot.set(0, 0);
  const mat = invertedParentTransform.copyFrom(parent.worldTransform).invert().append(object.worldTransform);
  object.transform.setFromMatrix(mat);
  // Correct the position, since pivots are not respected when decomposing the transformation matrix
  parent.toLocal(tmpPivot, object, object.position);
  object.transform.updateLocalTransform();
  object.pivot.copyFrom(tmpPivot);
}
