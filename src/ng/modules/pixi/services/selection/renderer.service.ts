import { Graphics, Container, Rectangle, Point } from 'pixi.js';
import { SceneEntity } from 'common/scene';
import { PixiRendererService } from '../renderer.service';
import { Subject } from 'rxjs';
import { PixiSelectionContainerService } from './container.service';
import { Injectable, Inject } from '@angular/core';
import { YAME_RENDERER } from 'ng/modules/scene';
import { System } from '@trixt0r/ecs';
import { maxBy, minBy, defaultTo } from 'lodash';

/**
 * The config interface for the rendering.
 *
 * @export
 * @interface SelectionRendererConfig
 */
export interface SelectionRendererConfig {
  fill: { alpha?: number; color?: number };
  line: { width?: number; color?: number; alpha?: number };
}

class SelectionRendererSystem extends System {
  constructor(private service: PixiSelectionRendererService, priority?: number) {
    super(priority);
  }

  /**
   * @inheritdoc
   */
  process(options?: any): void {
    this.service.update(options && options.textureLoaded);
  }
}

/**
 * The selection renderer, i.e. the part, which renders the entities in the provided selection container.
 * An instance of this class makes sure, that the bounds are properly rendered, no matter how the camera is configured,
 * so scaling is not messed up while zooming or moving.
 */
@Injectable({ providedIn: 'root' })
export class PixiSelectionRendererService {
  // Point pool
  private static points = [new Point(), new Point(), new Point(), new Point()];

  /**
   * @type {SelectionRendererConfig} The rendering config.
   */
  config: SelectionRendererConfig = { fill: {}, line: {} };

  // Protected fields, for handling the rendering
  protected stage?: Container;
  protected outerBounds: Rectangle;
  protected attached: boolean;
  protected lastPositionUpdate = new Point();
  protected lastSizeUpdate = new Point();

  /**
   * @type {Point[]} Clockwise bounding points, topLeft, topRight, bottomRight, bottomLeft
   */
  readonly boundingPoints: Point[];

  readonly graphics: Graphics = new Graphics();

  readonly attached$ = new Subject<void>();
  readonly detached$ = new Subject<void>();
  readonly update$ = new Subject<Rectangle>();

  readonly system: SelectionRendererSystem;

  /**
   * Creates an instance of SelectionRenderer.
   *
   * @param service The pixi service.
   * @param container The selection container.
   */
  constructor(
    @Inject(YAME_RENDERER) public readonly service: PixiRendererService,
    protected container: PixiSelectionContainerService
  ) {
    this.system = new SelectionRendererSystem(this, 998);
    this.system.active = false;
    this.outerBounds = new Rectangle();
    this.attached = false;
    this.boundingPoints = [new Point(), new Point(), new Point(), new Point()];
    this.setConfig({ line: {}, fill: {} });
    service.init$.subscribe(() => {
      this.stage = this.service.stage;
      container.selected$.subscribe(() => this.attach());
      container.unselected$.subscribe(() => {
        if (container.entities.length === 0) this.detach();
      });
      container.update$.subscribe(() => {
        this.lastSizeUpdate.set(0, 0);
        service.engineService.run();
      });
    });
    service.engineService.engine.systems.add(this.system);
  }

  /**
   * Attaches this renderer to the stage container.
   * It takes a snapshot of the current selection container bounds.
   */
  attach(): void {
    if (this.attached) return;
    if (this.container.entities.length <= 0) return this.detach();
    this.system.active = true;
    (this.stage?.getChildByName('foreground') as Container).addChild(this.graphics);
    this.attached = true;
    this.attached$.next();
    this.update(true);
  }

  /**
   * Updates the global coordinates of the bounds and re-renders them.
   */
  update(force = false): void {
    if (!this.attached) return;
    if (
      this.service.scene.position.x === this.lastPositionUpdate.x &&
      this.service.scene.position.y === this.lastPositionUpdate.y &&
      this.service.scene.scale.x === this.lastSizeUpdate.x &&
      this.service.scene.scale.y === this.lastSizeUpdate.y &&
      !force
    )
      return;
    this.graphics.clear();

    const lineWidth = this.config?.line?.width as number;
    const lineColor = this.config?.line?.color;
    const lineAlpha = this.config?.line?.alpha;
    const fillColor = this.config?.fill?.color;
    const fillAlpha = this.config?.fill?.alpha;

    if (fillAlpha) this.graphics.beginFill(fillColor, fillAlpha);

    if (this.container.entities.length > 1) {
      this.graphics.lineStyle(lineWidth, lineColor, (lineAlpha || 1) * 0.25);
      this.container.entities.forEach(entity => this.drawBounds(entity));
      this.graphics.drawShape(this.container.container.getBounds());
    }

    const bnds = this.container.container.getLocalBounds();
    this.boundingPoints[0].set(bnds.x, bnds.y);
    this.boundingPoints[1].set(bnds.x + bnds.width, bnds.y);
    this.boundingPoints[2].set(bnds.x + bnds.width, bnds.y + bnds.height);
    this.boundingPoints[3].set(bnds.x, bnds.y + bnds.height);

    this.boundingPoints.forEach(point => this.stage?.toLocal(point, this.container.container, point));
    this.outerBounds.x = minBy(this.boundingPoints, 'x')!.x;
    this.outerBounds.width = maxBy(this.boundingPoints, 'x')!.x - this.outerBounds.x;
    this.outerBounds.y = minBy(this.boundingPoints, 'y')!.y;
    this.outerBounds.height = maxBy(this.boundingPoints, 'y')!.y - this.outerBounds.y;
    this.graphics.lineStyle(lineWidth, lineColor, (lineAlpha || 0) * 0.5);
    this.graphics.drawShape(this.outerBounds);
    this.graphics.lineStyle(lineWidth, lineColor, lineAlpha);
    this.drawBounds(void 0, this.boundingPoints);

    if (fillAlpha) this.graphics.endFill();

    this.lastPositionUpdate.copyFrom(this.service.scene.position);
    this.lastSizeUpdate.copyFrom(this.service.scene.scale);
    this.update$.next(this.outerBounds);
  }

  /**
   * Detaches this renderer from the stage, so it will not be rendered, while nothing is selected.
   *
   * @param [force=false]
   */
  detach(force = false): void {
    if (typeof force !== 'boolean') force = false;
    if (!this.attached) return;
    this.system.active = false;
    if (this.container.entities.length !== 0 && !force) return this.update();
    this.graphics.clear();
    (this.stage?.getChildByName('foreground') as Container).removeChild(this.graphics);
    this.attached = false;
    this.detached$.next();
  }

  /**
   * Determines whether this renderer is currently attached to the stage for rendering.
   */
  get isAttached(): boolean {
    return this.attached;
  }

  setConfig(config: SelectionRendererConfig) {
    this.config.line.width = defaultTo(config.line?.width, 1);
    this.config.line.color = defaultTo(config.line?.color, 0xffffff);
    this.config.line.alpha = defaultTo(config.line?.alpha, 1);
    this.config.fill.color = defaultTo(config.fill?.color, 0xffffff);
    this.config.fill.alpha = defaultTo(config.fill?.alpha, 0);
  }

  /**
   * Draws rotated bounds of the given entity mapped to the given target.
   *
   * @param entity The entity to draw the bounds for.
   * @param points Optional parameter for pooled points. Can be used to prevent unnecessary calculations, if already
   *               done. Points have to be mapped to the parent coordinates of the target.
   *               If not passed, an internal pool will be used.
   */
  drawBounds(entity?: SceneEntity, points: Point[] = PixiSelectionRendererService.points) {
    if (points === PixiSelectionRendererService.points && entity instanceof SceneEntity) {
      const container = this.service.getContainer(entity.id);
      if (container) {
        const bnds = container.getLocalBounds();
        points[0].set(bnds.x, bnds.y);
        points[1].set(bnds.x + bnds.width, bnds.y);
        points[2].set(bnds.x + bnds.width, bnds.y + bnds.height);
        points[3].set(bnds.x, bnds.y + bnds.height);
        points.forEach(point => this.graphics.toLocal(point, container, point));
      }
    }
    this.graphics.moveTo(points[0].x, points[0].y);
    points.push(points.shift() as Point);
    points.forEach(point => this.graphics.lineTo(point.x, point.y));
  }
}
