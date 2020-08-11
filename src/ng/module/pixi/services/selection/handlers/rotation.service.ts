import { Point, DisplayObject, Container, Graphics, InteractionEvent, Polygon } from 'pixi.js';
import { Injectable, Inject } from '@angular/core';
import { YAME_RENDERER, UpdateEntity } from 'ng/module/scene';
import { PixiRendererService } from '../..';
import { PixiSelectionContainerService } from '..';
import { PixiSelectionRendererService } from '../renderer.service';
import { SceneEntity, RangeSceneComponent } from 'common/scene';
import { angleBetween } from 'common/math';
import { Subscription } from 'rxjs';
import { ofActionDispatched } from '@ngxs/store';

const tempPoint = new Point();

@Injectable({ providedIn: 'root' })
export class PixiSelectionHandlerRotationService {

  readonly area = new DisplayObject();
  readonly hitArea = new Polygon();

  protected mouseStartPos = new Point();
  protected mouseCurrentPos = new Point();

  protected initRot = 0;
  protected clickedRot = 0;
  protected clickedPos = new Point();

  protected mouseupFn: EventListenerObject;
  protected mouseLeft = false;

  protected topLeft = new Point();
  protected topRight = new Point();
  protected bottomLeft = new Point();

  protected debugPoints: Point[];
  protected debugGraphics: Graphics;
  protected debug = false;

  protected tmp = new Point();

  /**
   * The update entity subscription, for updates via sidebar.
   */
  protected updateSub: Subscription;

  /**
   * Creates an instance of SelectionRotateHandler.
   */
  constructor(
    @Inject(YAME_RENDERER) protected rendererService: PixiRendererService,
    protected containerService: PixiSelectionContainerService,
    protected selectionRenderer: PixiSelectionRendererService
  ) {
    this.mouseupFn = this.mouseup.bind(this);

    selectionRenderer.attached$.subscribe(() => this.attached());
    selectionRenderer.detached$.subscribe(() => this.detached());
    selectionRenderer.update$.subscribe(() => this.updateAreaPositions());

    this.area.interactive = true;
    this.area.zIndex = 9;
    this.area.hitArea = this.hitArea;
    this.hitArea.points = new Array(20);
    this.area.on('pointerdown', this.mousedown, this);
    this.area.on('pointerover', this.updateCursor, this);
    this.area.on('pointerout', this.resetCursor, this);
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
   * Sets the cursor to the rotation cursor on the current pixi view.
   *
   * @param event Optional interaction event.
   */
  updateCursor(event?: InteractionEvent): void {
    this.mouseLeft = event === void 0;
    if (this.containerService.isHandling && this.containerService.currentHandler !== this) return;
    this.rendererService.view.style.cursor = 'url("assets/rotate-icon.svg"), auto';
  }

  /**
   * Resets the cursor of the pixi view.
   *
   * @param event Optional event
   */
  resetCursor(event?: any): void {
    if (event !== void 0) this.mouseLeft = true;
    if ((this.containerService.isHandling && this.containerService.currentHandler === this) || !this.mouseLeft) return;
    this.rendererService.view.style.cursor = '';
  }

  /**
   * Mouse down handler.
   * Starts the handling and sets up all temp variables for rotating the container.
   *
   * @param event The triggered interaction event.
   */
  mousedown(event: InteractionEvent) {
    if (event.data.originalEvent.which !== 1) return;
    if (this.containerService.isHandling) return;
    this.area.on('pointermove', this.mousemove, this);
    this.area.off('pointerover', this.updateCursor, this);
    this.area.off('pointerout', this.resetCursor, this);
    window.addEventListener('mouseup', this.mouseupFn);
    this.clickedPos.set(this.containerService.container.position.x, this.containerService.container.position.y);
    this.containerService.beginHandling(this, event);
    this.mouseStartPos.set(event.data.global.x, event.data.global.y);
    this.containerService.container.parent.toLocal(this.mouseStartPos, null, this.mouseStartPos);
    this.initRot = this.containerService.container.rotation;
    this.clickedRot = angleBetween(this.containerService.container.position, this.mouseStartPos);
  }

  /**
   * Handles the mouse up event.
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
   * Mouse move handler.
   * Executes the actual rotation.
   *
   * @param event
   */
  mousemove(event: InteractionEvent): void {
    if (!this.containerService.isHandling || this.containerService.currentHandler !== this) return;
    this.mouseCurrentPos.set(event.data.global.x, event.data.global.y);
    this.containerService.container.parent.toLocal(this.mouseCurrentPos, null, this.mouseCurrentPos);
    this.containerService.container.rotation = this.initRot + angleBetween(this.clickedPos, this.mouseCurrentPos) - this.clickedRot;
    this.containerService.dispatchUpdate(this.containerService.components.byId('transformation.rotation'));
  }

  /**
   * Updates the clickable rotation areas on the container.
   */
  updateAreaPositions(): void {
    const bnds = this.containerService.container.getLocalBounds();

    const horRatio = Math.abs(this.rendererService.scene.scale.x * this.containerService.container.scale.x);
    const verRatio = Math.abs(this.rendererService.scene.scale.y * this.containerService.container.scale.y);
    const thickness = 50;
    const offset = 15;
    const thicknessHor = thickness / horRatio;
    const offsetHor = offset / horRatio;
    const thicknessVer = thickness / verRatio;
    const offsetVer = offset / verRatio;

    this.area.position.set(0, 0);
    const points = this.hitArea.points;
    // inner bottom left
    points[0] = bnds.x - offsetHor; points[1] = bnds.y + bnds.height + offsetVer;
    // inner top left
    points[2] = bnds.x - offsetHor; points[3] = bnds.y - offsetVer;
    // inner top right
    points[4] = bnds.x + bnds.width + offsetHor; points[5] = bnds.y - offsetVer;
    // inner bottom right
    points[6] = bnds.x + bnds.width + offsetHor; points[7] = bnds.y + bnds.height + offsetVer;

    // inner bottom left
    points[8] = bnds.x - offsetHor; points[9] = bnds.y + bnds.height + offsetVer;

    // outer bottom left
    points[10] = bnds.x - offsetHor - thicknessHor; points[11] = bnds.y + bnds.height + offsetVer + thicknessVer;
    // outer top left
    points[12] = bnds.x - offsetHor - thicknessHor; points[13] = bnds.y - offsetVer - thicknessVer;
    // outer top right
    points[14] = bnds.x + bnds.width + offsetHor + thicknessHor; points[15] = bnds.y - offsetVer - thicknessVer;
    // outer bottom right
    points[16] = bnds.x + bnds.width + offsetHor + thicknessHor; points[17] = bnds.y + bnds.height + offsetVer + thicknessVer;

    // outer bottom left
    points[18] = bnds.x - offsetHor - thicknessHor; points[19] = bnds.y + bnds.height + offsetVer + thicknessVer;

    this.rendererService.stage.toLocal(this.area.position, this.containerService.container, this.area.position);

    const tmp = this.tmp;
    for (let i = 0; i < points.length; i += 2) {
      tmp.set(points[i], points[i + 1]);
      this.area.toLocal(tmp, this.containerService.container, tmp);
      points[i] = tmp.x;
      points[i + 1] = tmp.y;
    }

    // this.areas.forEach((it) => it.updateTransform());
    this.debugDraw();
  }

  protected debugDraw(): void {
    if (!this.debug) return;
    this.debugGraphics.clear();
    this.debugGraphics.beginFill(0xccaaee, 0.25);
    const points = this.debugPoints;
    const polyPoints = this.hitArea.points;
    for (let i = 0; i < points.length; i++) {
      points[i].set(polyPoints[i * 2], polyPoints[i * 2 + 1]);
      this.debugGraphics.toLocal(points[i], this.area, points[i]);
    }
    this.debugGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++)
      this.debugGraphics.lineTo(points[i].x, points[i].y);
    this.debugGraphics.endFill();
  }

  /**
   * The attached handler.
   * Adds all clickable areas to the stage.
   */
  attached(): void {
    this.rendererService.stage.addChild(this.area);
    if (this.debug) {
      if (!this.debugGraphics) this.debugGraphics = new Graphics();
      if (!this.debugPoints) {
        this.debugPoints = new Array(10);
        for (let i = 0; i < 10; i++)
          this.debugPoints[i] = new Point();
      }
      (this.rendererService.stage.getChildByName('debug') as Container).addChild(this.debugGraphics);
    }
    this.updateAreaPositions();
    this.clearSub();
    this.updateSub = this.rendererService.actions.pipe(ofActionDispatched(UpdateEntity))
                          .subscribe((action: UpdateEntity) => {
                            const data = Array.isArray(action.data) ? action.data : [action.data];
                            if (data.length <= 0) return;
                            const rotation = data[0].components.find(comp => comp.id === 'transformation.rotation') as RangeSceneComponent;
                            if (!rotation) return;
                            this.containerService.container.rotation = rotation.value;
                          });
  }

  /**
   * The detached handler.
   * Removes all clickable areas to the stage.
   */
  detached(): void {
    this.clearSub();
    if (this.debugGraphics) (this.rendererService.stage.getChildByName('debug') as Container).removeChild(this.debugGraphics);
    this.rendererService.stage.removeChild(this.area);
  }
}
