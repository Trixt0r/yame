import { Injectable, Inject } from '@angular/core';
import { Point, InteractionEvent, DisplayObject, Polygon, Graphics, Container } from 'pixi.js';
import { PixiRendererService } from '../..';
import { PixiSelectionContainerService } from '..';
import { PixiSelectionRendererService } from '../renderer.service';
import { YAME_RENDERER, UpdateEntity } from 'ng/module/scene';
import { SceneEntity, PointSceneComponent } from 'common/scene';
import { distanceToSegment, angleBetween } from 'common/math';
import { Subscription } from 'rxjs';
import { ofActionDispatched } from '@ngxs/store';

const tempPoint = new Point();

/**
 * Service for handling skew transformation on the selection container.
 */
@Injectable({ providedIn: 'root' })
export class PixiSelectionHandlerSkewService {
  /**
   * The skew values, when the mouse button has been pressed.
   */
  protected clickedSkew = new Point();

  /**
   * The local mouse position coordinates, when the mouse button has been pressed.
   */
  protected clickedPos = new Point();

  /**
   * The clicked reference position in local coordinates.
   */
  protected clickRefPos = new Point();

  /**
   * The clicked reference position in parent coordinates.
   */
  protected clickedRefPosTransform = new Point();

  /**
   * The initial angle to the reference.
   */
  protected initAngle = 0;

  /**
   * The size of the container, when clicked.
   */
  protected clickedSize = new Point();

  /**
   * The initial container position.
   */
  protected containerPos = new Point();

  /**
   * The initial container scale.
   */
  protected containerScale = new Point();

  /**
   * The sign direction on x-axis.
   */
  protected xDirection = 0;

  /**
   * The sign direction on y-axis.
   */
  protected yDirection = 0;

  /**
   * The current local mouse coordinates.
   */
  protected currentPos = new Point();

  /**
   * The current reference position
   */
  protected currentRefPos = new Point();

  /**
   * Bound mouse up function.
   */
  protected mouseupFn: EventListenerObject;

  /**
   * Bound key down function.
   */
  protected keyDownFn: EventListenerObject;

  /**
   * Bound key up function.
   */
  protected keyUpFn: EventListenerObject;

  /**
   * Whether the mouse left or not.
   */
  protected mouseLeft = false;

  /**
   * The previous cursor style.
   */
  protected prevCursor: string;

  /**
   * Debug points to render, if active.
   */
  protected debugPoints: Point[];

  /**
   * Debug graphics to render, if active.
   */
  protected debugGraphics: Graphics;

  /**
   * Whether to render debug graphics.
   */
  protected debug = false;

  /**
   * A list of the bound points for the selection container in parent coordinates.
   */
  protected boundPoints = [ new Point(), new Point(), new Point(), new Point() ];

  /**
   * The update entity subscription, for updates via sidebar.
   */
  protected updateSub: Subscription;

  /**
   * The key code for activating the handling.
   */
  keyCode = 16;

  /**
   * The clickable area.
   */
  readonly area = new DisplayObject();

  /**
   * The hit area. Updated on mouse move, if active.
   */
  readonly hitArea = new Polygon();

  /**
   * Whether the mouse is currently over the handle area.
   */
  get mouseOverArea(): boolean {
    this.area.worldTransform.applyInverse(this.rendererService.mouse as Point, tempPoint);
    return this.area.hitArea.contains(tempPoint.x, tempPoint.y);
  }

  /**
   * Whether the handling is active, i.e. whether the according key is pressed.
   */
  get active(): boolean {
    return this.area.interactive;
  }

  /**
   * Returns the container.
   */
  get container(): Container {
    return this.containerService.container;
  }

  constructor(
    @Inject(YAME_RENDERER) protected rendererService: PixiRendererService,
    protected containerService: PixiSelectionContainerService,
    protected selectionRenderer: PixiSelectionRendererService
  ) {
    this.mouseupFn = this.mouseup.bind(this);
    this.keyDownFn = this.keydown.bind(this);
    this.keyUpFn = this.keyup.bind(this);

    this.hitArea.points = new Array(20);
    this.area.interactive = false;
    this.area.hitArea = this.hitArea;

    this.area.on('pointerdown', this.mousedown, this);
    this.area.on('pointerover', this.updateCursor, this);
    this.area.on('pointerout', this.resetCursor, this);

    selectionRenderer.attached$.subscribe(() => this.attached());
    selectionRenderer.detached$.subscribe(() => this.detached());
    selectionRenderer.update$.subscribe(() => this.updateAreaPositions());
    containerService.unselected$.subscribe((entities) => this.unselected(entities));
  }

  /**
   * Clears the update sub.
   */
  protected clearSub(): void {
    if (!this.updateSub) return;
    this.updateSub.unsubscribe();
    this.updateSub = null;
  }

  /**
   * Draws the hit area.
   */
  protected debugDraw(): void {
    if (!this.debug) return;
    this.debugGraphics.clear();
    this.debugGraphics.beginFill(0x4499ff, 0.25);
    const points = this.debugPoints;
    const polyPoints = this.hitArea.points;
    for (let i = 0; i < points.length; i++) {
      points[i].set(polyPoints[i * 2], polyPoints[i * 2 + 1]);
      this.debugGraphics.toLocal(points[i], this.area, points[i]);
    }
    this.debugGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) this.debugGraphics.lineTo(points[i].x, points[i].y);
    this.debugGraphics.endFill();
  }

  protected getBoundPoints(): Point[] {
    const bounds = this.container.getLocalBounds();
    this.boundPoints[0].set(bounds.x, bounds.y);
    this.boundPoints[1].set(bounds.x + bounds.width, bounds.y);
    this.boundPoints[2].set(bounds.x, bounds.y + bounds.height);
    this.boundPoints[3].set(bounds.x + bounds.width , bounds.y + bounds.height);
    this.boundPoints.forEach((point) => this.container.parent.toLocal(point, this.container, point));
    return this.boundPoints;
  }

  /**
   * Handles the keydown event, i.e. updates the active state,
   * based on which key has to be pressed on the keyboard.
   *
   * @param event The triggered DOM event.
   */
  keydown(event: KeyboardEvent): void {
    this.area.interactive = event.keyCode === this.keyCode;
    if (this.active) {
      this.updateAreaPositions();
      if (this.mouseOverArea) {
        this.prevCursor = this.rendererService.view.style.cursor;
        this.updateCursor();
      }
    }
  }

  /**
   * Handles the key up event.
   * Shifts the service into inactive state, if the bound key has been released.
   *
   * @param event The triggered DOM event.
   */
  keyup(event: KeyboardEvent): void {
    if (event.keyCode === this.keyCode && this.active) {
      this.area.interactive = false;
      // Restore the old cursor
      if (this.prevCursor) this.rendererService.view.style.cursor = this.prevCursor;
      else this.resetCursor(true);
    }
  }

  /**
   * Starts the handling and sets up all temp variables for skewing the container.
   *
   * @param event The triggered interaction event.
   */
  mousedown(event: InteractionEvent): void {
    if (!this.active) return;
    if (event.data.originalEvent.which !== 1) return;
    if (this.containerService.isHandling) return;
    this.containerService.beginHandling(this, event);

    // Setup the event handlers
    this.area.on('pointermove', this.mousemove, this);
    this.area.off('pointerover', this.updateCursor, this);
    this.area.off('pointerout', this.resetCursor, this);
    window.addEventListener('mouseup', this.mouseupFn);

    // Store initial values
    this.containerPos.copyFrom(this.container.position);
    this.containerScale.copyFrom(this.container.scale);
    this.clickedSkew.copyFrom(this.container.skew);
    this.clickedPos.copyFrom(event.data.global);
    this.container.toLocal(this.clickedPos, null, this.clickedPos);

    const bounds = this.container.getLocalBounds();
    if (this.clickedPos.y <= bounds.y) {
      this.xDirection = 1;
      this.clickRefPos.set(this.clickedPos.x, bounds.y + bounds.height);
    } else if (this.clickedPos.y >= bounds.y + bounds.height) {
      this.xDirection = 1;
      this.clickRefPos.set(this.clickedPos.x, bounds.y);
    } else this.xDirection = 0;

    if (this.xDirection === 0 && this.clickedPos.x <= bounds.x) {
      this.yDirection = 1;
      this.clickRefPos.set(bounds.x + bounds.width, this.clickedPos.y);
    } else if (this.xDirection === 0 && this.clickedPos.x >= bounds.x + bounds.width) {
      this.yDirection = 1;
      this.clickRefPos.set(bounds.x, this.clickedPos.y);
    } else this.yDirection = 0;

    const points = this.getBoundPoints();
    const width = distanceToSegment(points[0], { v: points[1], w: points[3] });
    const height = distanceToSegment(points[0], { v: points[2], w: points[3] });
    this.clickedSize.set(width, height);

    this.container.parent.toLocal(this.clickRefPos, this.container, this.clickedRefPosTransform);
    tempPoint.copyFrom(this.clickedPos);
    if (this.yDirection !== 0)
      tempPoint.x = Math.min(bounds.x + bounds.width, Math.max(bounds.x, tempPoint.x));
    if (this.xDirection !== 0)
      tempPoint.y = Math.min(bounds.y + bounds.height, Math.max(bounds.y, tempPoint.y));
    this.container.parent.toLocal(tempPoint, this.container, tempPoint);
    this.initAngle = angleBetween(this.clickedRefPosTransform, tempPoint);
  }

  /**
   * Finishes the handling.
   */
  mouseup(): void {
    if (!this.containerService.isHandling || this.containerService.currentHandler !== this) return;
    this.area.off('pointermove', this.mousemove, this);
    this.area.on('pointerover', this.updateCursor, this);
    this.area.on('pointerout', this.resetCursor, this);
    window.removeEventListener('mouseup', this.mouseupFn);
    this.containerService.endHandling(this);
    this.area.worldTransform.applyInverse(this.rendererService.mouse as Point, tempPoint);
    const contains = this.area.hitArea.contains(tempPoint.x, tempPoint.y);
    if (!contains) this.resetCursor(true);
  }

  /**
   * Executes the actual skew.
   *
   * @param event
   */
  mousemove(event: InteractionEvent): void {
    if (!this.containerService.isHandling || this.containerService.currentHandler !== this) return;
    this.currentPos.copyFrom(event.data.global);
    this.container.position.copyFrom(this.containerPos);
    this.container.scale.copyFrom(this.containerScale);
    this.container.skew.copyFrom(this.clickedSkew);
    this.container.toLocal(this.currentPos, null, this.currentPos);

    const bounds = this.container.getLocalBounds();
    tempPoint.copyFrom(this.currentPos);
    if (this.yDirection !== 0)
      tempPoint.x = Math.min(bounds.x + bounds.width, Math.max(bounds.x, tempPoint.x));
    if (this.xDirection !== 0)
      tempPoint.y = Math.min(bounds.y + bounds.height, Math.max(bounds.y, tempPoint.y));
    this.container.parent.toLocal(tempPoint, this.container, tempPoint);
    const angle = angleBetween(this.clickedRefPosTransform, tempPoint) - this.initAngle;
    this.container.skew.set(
      this.clickedSkew.x - angle * this.xDirection,
      this.clickedSkew.y + angle * this.yDirection
    );

    const points = this.getBoundPoints();
    const width = distanceToSegment(points[0], { v: points[1], w: points[3] });
    const height = distanceToSegment(points[0], { v: points[2], w: points[3] });
    if (this.yDirection !== 0) this.container.scale.x = this.containerScale.x * (this.clickedSize.x / width);
    if (this.xDirection !== 0) this.container.scale.y = this.containerScale.y * (this.clickedSize.y / height);

    this.currentRefPos.copyFrom(this.clickRefPos);
    this.container.parent.toLocal(this.currentRefPos, this.container, this.currentRefPos);
    this.container.position.x = this.containerPos.x - (this.currentRefPos.x - this.clickedRefPosTransform.x);
    this.container.position.y = this.containerPos.y - (this.currentRefPos.y - this.clickedRefPosTransform.y);

    this.containerService.dispatchUpdate(
      this.containerService.components.byId('transformation.position'),
      this.containerService.components.byId('transformation.scale'),
      this.containerService.components.byId('transformation.skew')
    );
  }

  /**
   * Sets the cursor to the rotation cursor on the current pixi view.
   *
   * @param event Optional interaction event.
   */
  updateCursor(event?: InteractionEvent): void {
    this.mouseLeft = event === void 0;
    if (this.containerService.isHandling && this.containerService.currentHandler !== this) return;
    this.rendererService.view.style.cursor = 'url("assets/skew-icon.svg"), auto';
  }

  /**
   * Resets the cursor of the pixi view.
   *
   * @param event Optional event.
   */
  resetCursor(event?: unknown): void {
    if (event !== void 0) this.mouseLeft = true;
    if ((this.containerService.isHandling && this.containerService.currentHandler === this) || !this.mouseLeft) return;
    this.rendererService.view.style.cursor = '';
  }

  /**
   * Updates the clickable skew areas on the container.
   */
  updateAreaPositions(): void {
    if (!this.active) return;
    const bnds = this.container.getLocalBounds();

    const horRatio = Math.abs(this.rendererService.scene.scale.x * this.container.scale.x);
    const verRatio = Math.abs(this.rendererService.scene.scale.y * this.container.scale.y);
    const thickness = 50;
    const offset = 15;
    const thicknessHor = thickness / horRatio;
    const offsetHor = offset / horRatio;
    const thicknessVer = thickness / verRatio;
    const offsetVer = offset / verRatio;

    this.area.position.set(0, 0);
    const points = this.hitArea.points;
    // inner bottom left
    points[0] = bnds.x - offsetHor;
    points[1] = bnds.y + bnds.height + offsetVer;
    // inner top left
    points[2] = bnds.x - offsetHor;
    points[3] = bnds.y - offsetVer;
    // inner top right
    points[4] = bnds.x + bnds.width + offsetHor;
    points[5] = bnds.y - offsetVer;
    // inner bottom right
    points[6] = bnds.x + bnds.width + offsetHor;
    points[7] = bnds.y + bnds.height + offsetVer;

    // inner bottom left
    points[8] = bnds.x - offsetHor;
    points[9] = bnds.y + bnds.height + offsetVer;

    // outer bottom left
    points[10] = bnds.x - offsetHor - thicknessHor;
    points[11] = bnds.y + bnds.height + offsetVer + thicknessVer;
    // outer top left
    points[12] = bnds.x - offsetHor - thicknessHor;
    points[13] = bnds.y - offsetVer - thicknessVer;
    // outer top right
    points[14] = bnds.x + bnds.width + offsetHor + thicknessHor;
    points[15] = bnds.y - offsetVer - thicknessVer;
    // outer bottom right
    points[16] = bnds.x + bnds.width + offsetHor + thicknessHor;
    points[17] = bnds.y + bnds.height + offsetVer + thicknessVer;

    // outer bottom left
    points[18] = bnds.x - offsetHor - thicknessHor;
    points[19] = bnds.y + bnds.height + offsetVer + thicknessVer;

    this.rendererService.stage.toLocal(this.area.position, this.container, this.area.position);

    const tmp = tempPoint;
    for (let i = 0; i < points.length; i += 2) {
      tmp.set(points[i], points[i + 1]);
      this.area.toLocal(tmp, this.container, tmp);
      points[i] = tmp.x;
      points[i + 1] = tmp.y;
    }

    this.debugDraw();
  }

  /**
   * Handles the attachment to the scene.
   * Adds all clickable areas to the stage.
   */
  attached(): void {
    this.area.interactive = false;
    window.addEventListener('keydown', this.keyDownFn);
    window.addEventListener('keyup', this.keyUpFn);
    this.rendererService.stage.addChild(this.area);
    if (this.debug) {
      if (!this.debugGraphics) this.debugGraphics = new Graphics();
      if (!this.debugPoints) {
        this.debugPoints = new Array(10);
        for (let i = 0; i < 10; i++) this.debugPoints[i] = new Point();
      }
      (this.rendererService.stage.getChildByName('debug') as Container).addChild(this.debugGraphics);
    }
    this.updateAreaPositions();
    this.clearSub();
    this.updateSub = this.rendererService.actions.pipe(ofActionDispatched(UpdateEntity))
                          .subscribe((action: UpdateEntity) => {
                            const data = Array.isArray(action.data) ? action.data : [action.data];
                            if (data.length <= 0) return;
                            const skew = data[0].components.find(comp => comp.id === 'transformation.skew') as PointSceneComponent;
                            if (!skew) return;
                            this.container.skew.copyFrom(skew);
                          });
  }

  /**
   * Handles detachment from the scene.
   * Removes all clickable areas to the stage.
   */
  detached(): void {
    this.area.interactive = false;
    this.clearSub();
    window.removeEventListener('keydown', this.keyDownFn);
    window.removeEventListener('keyup', this.keyUpFn);
    this.area.interactive = false;
    if (this.debugGraphics)
      (this.rendererService.stage.getChildByName('debug') as Container).removeChild(this.debugGraphics);
    this.rendererService.stage.removeChild(this.area);
  }

  /**
   * Applies the rotation back to all entities in the container.
   *
   * @param unselected The entities to update.
   */
  unselected(unselected: SceneEntity[]): void {
    unselected.forEach((entity) => {
      const container = this.rendererService.getContainer(entity.id);
      const skew = entity.components.byId('transformation.skew') as PointSceneComponent;
      if (skew) {
        skew.x = container.skew.x;
        skew.y = container.skew.y;
      }
    });
  }
}
