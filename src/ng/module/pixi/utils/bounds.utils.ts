import { SceneEntity } from 'common/scene';
import { Container, IPoint, Point } from 'pixi.js';
import { PixiRendererService } from '../services/renderer.service';
import { transformTo } from './transform.utils';

/**
 * A container which can be used to calculate bounds for a list of given scene entities.
 *
 * Usage:
 * ```ts
 * const boundsContainer = new BoundsContainer(service);
 * // Start a "session"
 * boundsContainer.begin(myEntities, [optionalParent]);
 * // ... calculate stuff and stop the "session"
 * boundsContainer.end();
 * ```
 *
 * Note that you have to call `end` once you called `begin` to ensure consistency.
 */
export class BoundsContainer extends Container {

  /**
   * Previous parent mapping.
   *
   * @internal
   */
  prevParents!: { [id: string]: Container };

  /**
   * The entities bound to the current session.
   */
  entities?: SceneEntity[];

  /**
   * The pixi renderer service instance.
   */
  constructor(public service: PixiRendererService) {
    super();
  }

  /**
   * Starts a "session" for the given scene entities.
   *
   * @param entities The entities to put into this container.
   * @param parent Optional parent.
   */
  begin(entities: SceneEntity[], parent: Container = this.service.scene): void {
    if (this.entities) this.end();
    this.entities = entities;
    parent.addChild(this);
    this.transform.updateTransform(this.parent.transform);
    this.prevParents = { };
    this.entities.forEach(it => {
      const container = this.service.getContainer(it.id) as Container;
      if (!container) return;
      this.prevParents[it.id] = container.parent;
      container.transform.updateTransform(container.parent.transform);
      this.addChild(container);
      transformTo(container, this);
    });
  }

  /**
   * Ends the previously started "session".
   */
  end(): void {
    if (!this.entities) return;
    this.entities.forEach(it => {
      const container = this.service.getContainer(it.id);
      if (!container) return;
      const parent = this.prevParents[it.id] || this.service.scene;
      container.transform.updateTransform(container.parent.transform);
      parent.addChild(container);
      transformTo(container, parent);
    });
    this.parent.removeChild(this);
    delete this.entities;
  }

  /**
   * Returns the bound points for the currently bound scene entities.
   *
   * @param target Optional target to map the points to.
   * @return A list with top left, top right, bottom left and bottom right points.
   */
  getBoundingPoints(target: Container = this.service.stage!): IPoint[] {
    const bounds = this.getLocalBounds();
    const boundingPoints = [new Point(), new Point(), new Point(), new Point()];
    boundingPoints[0].set(bounds.x, bounds.y);
    boundingPoints[1].set(bounds.x + bounds.width, bounds.y);
    boundingPoints[2].set(bounds.x + bounds.width, bounds.y + bounds.height);
    boundingPoints[3].set(bounds.x, bounds.y + bounds.height);
    boundingPoints.forEach(point => target.toLocal(point, this, point));
    return boundingPoints;
  }
}