import { SceneEntity } from 'common/scene';
import { maxBy, minBy } from 'lodash';
import { DisplayObject, IPoint, Point, Rectangle } from 'pixi.js';
import { PixiRendererService } from '../services/renderer.service';

/**
 * Returns the corner points for the given scene entities.
 *
 * @param entities A list of scene entities.
 * @param rendererService The renderer service, for getting the actual pixi container.
 * @param space The display object to which the points should be mapped.
 * @return A list containing corner points for each given scene entity.
 */
export function getCornerPoints(
  entities: SceneEntity[],
  rendererService: PixiRendererService,
  space: DisplayObject = rendererService.scene
): IPoint[] {
  let points: IPoint[] = [];
  entities.forEach((it) => {
    const container = rendererService.getContainer(it.id);
    if (!container) return;
    const bounds = container.getLocalBounds();
    const boundingPoints = [new Point(), new Point(), new Point(), new Point()];
    boundingPoints[0].set(bounds.x, bounds.y);
    boundingPoints[1].set(bounds.x + bounds.width, bounds.y);
    boundingPoints[2].set(bounds.x + bounds.width, bounds.y + bounds.height);
    boundingPoints[3].set(bounds.x, bounds.y + bounds.height);
    if (space) boundingPoints.forEach(point => space.toLocal(point, container, point));
    else boundingPoints.forEach(point => container.toGlobal(point, point));
    points = points.concat(boundingPoints);
  });
  return points;
}

/**
 * Calculates bounds for the given scene entities.
 *
 * @param entities A list of scene entities.
 * @param rendererService The renderer service, for getting the actual pixi container.
 * @param space The display object to which the rectangle should be mapped.
 * @param target An optional rectangle, to store the bounds values in.
 * @return The rectangle containing the bounds information.
 */
export function getBoundingRect(
  entities: SceneEntity[],
  rendererService: PixiRendererService,
  space: DisplayObject = rendererService.scene,
  target: Rectangle = new Rectangle()
): Rectangle {
  const boundingPoints = getCornerPoints(entities, rendererService, space!);
  target.x = minBy(boundingPoints, 'x')?.x ?? 0;
  target.width = (maxBy(boundingPoints, 'x')?.x ?? 0) - target.x;
  target.y = minBy(boundingPoints, 'y')?.y ?? 0;
  target.height = (maxBy(boundingPoints, 'y')?.y ?? 0) - target.y;
  return target;
}
