import { createGroupComponent } from './group';
import { createRangeComponent, RangeSceneComponent } from './range';
import { createPointComponent, PointSceneComponent } from './point';
import { SceneComponent, SceneComponentTransform } from '..';
import { IPoint } from 'common/interface/point';
const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;
const PI2 = Math.PI * 2;

export function getRadiansTransform(): SceneComponentTransform<number, number> {
  return {
    apply(val: number) {
      return (360 + Math.round(val * RAD2DEG)) % 360;
    },
    reverse(val: number) {
      return (val * DEG2RAD) % PI2;
    },
  };
}

export function getScaleTransform(): SceneComponentTransform<number, number> {
  return {
    apply(val: number) {
      return val * 100
    },
    reverse(val: number) {
      return val / 100;
    },
  };
}

export function getPointTransform(transform: SceneComponentTransform<number, number>): SceneComponentTransform<IPoint, IPoint> {
  const transformed = { x: 0, y: 0 };
  const reversed = { x: 0, y: 0 };
  return {
    apply(value: IPoint) {
      transformed.x = transform.apply(value.x);
      transformed.y = transform.apply(value.y);
      return transformed;
    },
    reverse(value: IPoint) {
      reversed.x = transform.reverse(value.x);
      reversed.y = transform.reverse(value.y);
      return reversed;
    },
  };
}

/**
 * Creates a rotation component.
 *
 * @param id
 * @param value
 * @param group
 */
export function createRotationComponent(
  id = 'transformation.rotation',
  value = 0,
  group = 'transformation'
): RangeSceneComponent {
  const comp = createRangeComponent(id, value, group);
  comp.label = 'Rotation';
  comp.min = 0;
  comp.max = 360;
  comp.ticks = 90;
  comp.step = 1;
  comp.transform = getRadiansTransform();
  return comp;
}

/**
 * Creates a scale component.
 *
 * @param id
 * @param x
 * @param y
 * @param group
 */
export function createScaleComponent(
  id = 'transformation.scale',
  x = 1,
  y = 1,
  group = 'transformation'
): PointSceneComponent {
  const comp = createPointComponent(id, x, y, group);
  comp.label = 'Scale';
  comp.transform = getPointTransform(getScaleTransform());
  return comp;
}

/**
 * Creates a skew component.
 *
 * @param id
 * @param x
 * @param y
 * @param group
 */
export function createSkewComponent(
  id = 'transformation.skew',
  x = 0,
  y = 0,
  group = 'transformation'
): PointSceneComponent {
  const comp = createPointComponent(id, x, y, group);
  comp.label = 'Skew';
  comp.transform = getPointTransform(getRadiansTransform());
  return comp;
}

/**
 * Creates a transformation component and returns all parts of it.
 *
 * @param id
 * @param group
 */
export function createTransformationComponents(id = 'transformation', group?: string): SceneComponent[] {
  const transform = createGroupComponent(
    id,
    [
      'transformation.position',
      'transformation.scale',
      'transformation.rotation',
      'transformation.skew',
      'transformation.pivot',
    ],
    group
  );
  transform.label = 'Transformation';
  transform.allowedMemberTypes = [];
  transform.allowedMemberItems = [];

  const position = createPointComponent('transformation.position');
  const pivot = createPointComponent('transformation.pivot');
  const scale = createScaleComponent();
  const rotation = createRotationComponent();
  const skew = createSkewComponent();

  position.label = 'Position';
  pivot.label = 'Pivot';

  position.group = transform.id;
  pivot.group = transform.id;
  scale.group = transform.id;
  rotation.group = transform.id;
  skew.group = transform.id;

  return [transform, position, scale, rotation, skew, pivot];
}
