/**
 * Describes a point in 2D space.
 */
export interface IPoint {

  /**
   * The x-coordinate of the point.
   */
  x: number;

  /**
   * The y-coordinate of the point.
   */
  y: number;
}

/**
 * A point in 2D space can be an object with the properties `x` and `y` or a tuple of two numbers.
 */
export type Point2D = IPoint | [number, number];

export interface Segment {
  /**
   * Start point of the segment.
   */
  v: Point2D;

  /**
   * End point of the segment.
   */
  w: Point2D;
}

/**
 * Calculates the __squared__ distance between both given points.
 *
 * @param p1 The first point.
 * @param p2 The second point.
 * @returns The __squared__ distance between the given two points.
 */
export function distanceSquared(p1: Point2D, p2: Point2D): number {
  const isP1Tuple = Array.isArray(p1);
  const isP2Tuple = Array.isArray(p2);

  const x1 = isP1Tuple ? p1[0] : (p1 as IPoint).x;
  const y1 = isP1Tuple ? p1[1] : (p1 as IPoint).y;
  const x2 = isP2Tuple ? p2[0] : (p2 as IPoint).x;
  const y2 = isP2Tuple ? p2[1] : (p2 as IPoint).y;

  return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}

/**
 * Calculates the distance between both given points.
 *
 * @param p1 The first point.
 * @param p2 The second point.
 * @returns The distance between the given two points.
 */
export function distance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt(distanceSquared(p1, p2));
}

/**
 * Calculates the squared distance from the given point to the given segment.
 *
 * @param point The point in 2D space.
 * @param segment The segment in 2D space.
 * @return The squared distance.
 *
 * @note Taken from: https://gist.github.com/mattdesl/47412d930dcd8cd765c871a65532ffac
 */
export function distanceToSegmentSquared (point: Point2D, segment: Segment): number {
  const length = distanceSquared(segment.v, segment.w);
  if (length === 0) return distanceSquared(point, segment.v);
  const isPTuple = Array.isArray(point);
  const isVTuple = Array.isArray(segment.v);
  const isWTuple = Array.isArray(segment.w);

  const pX = isPTuple ? point[0] : (point as IPoint).x;
  const pY = isPTuple ? point[1] : (point as IPoint).y;
  const vX = isVTuple ? segment.v[0] : (segment.v as IPoint).x;
  const vY = isVTuple ? segment.v[1] : (segment.v as IPoint).y;
  const wX = isWTuple ? segment.w[0] : (segment.w as IPoint).x;
  const wY = isWTuple ? segment.w[1] : (segment.w as IPoint).y;

  const t = ((pX - vX) * (wX - vX) + (pY - vY) * (wY - vY)) / length;
  // t = Math.max(-1, Math.min(1, t));
  return distanceSquared(point, { x: vX + t * (wX - vX), y: vY + t * (wY - vY)});
}

/**
 * Calculates the distance from the given point to the given segment.
 *
 * @param point The point in 2D space.
 * @param segment The segment in 2D space.
 * @return The distance.
 *
 * @note Taken from: https://gist.github.com/mattdesl/47412d930dcd8cd765c871a65532ffac
 */
export function distanceToSegment(point: Point2D, segment: Segment): number {
  return Math.sqrt(distanceToSegmentSquared(point, segment));
}

/**
 * Calculates the angle between the two given points.
 *
 * @param p1 The first point.
 * @param p2 The second point.
 * @returns The angle between the given two points in radians.
 */
export function angleBetween(p1: Point2D, p2: Point2D): number {
  const isP1Tuple = Array.isArray(p1);
  const isP2Tuple = Array.isArray(p2);

  const x1 = isP1Tuple ? p1[0] : (p1 as IPoint).x;
  const y1 = isP1Tuple ? p1[1] : (p1 as IPoint).y;
  const x2 = isP2Tuple ? p2[0] : (p2 as IPoint).x;
  const y2 = isP2Tuple ? p2[1] : (p2 as IPoint).y;

  return Math.atan2(y2 - y1, x2 - x1);
}
