import { Injectable, Inject } from '@angular/core';
import { Graphics, Circle, Point, Container, InteractionEvent } from 'pixi.js';
import { PixiRendererService } from '../..';
import { PixiSelectionContainerService } from '..';
import { PixiSelectionRendererService } from '../renderer.service';
import { YAME_RENDERER, UpdateEntity } from 'ng/module/scene';
import { PointSceneComponent } from 'common/scene';
import { Subscription } from 'rxjs';
import { ofActionDispatched } from '@ngxs/store';

const tmp1 = new Point();
const tmp2 = new Point();

/**
 * Service for handling pivot positioning on the selection container.
 */
@Injectable({ providedIn: 'root' })
export class PixiSelectionHandlerPivotService {

  /**
   * Bound mouse up function.
   */
  protected onPointerUpFn: EventListenerObject;

  /**
   * Whether the mouse left.
   */
  protected mouseLeft = false;

  /**
   * The update entity subscription, for updates via sidebar.
   */
  protected updateSub: Subscription;

  /**
   * The clicked pivot position.
   */
  protected clickedPivot = new Point();

  /**
   * The clicked local mouse position.
   */
  protected clickedMouse = new Point();

  /**
   * The handler area
   */
  readonly area = new Graphics();

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

    this.area.interactive = true;
    this.area.zIndex = 20;
    const hitArea = new Circle(0, 0, 7.5);
    this.area.hitArea = hitArea

    this.area.lineStyle(1, 0xffffff, 1);
    this.area.beginFill(0x303030, 0.5);
    this.area.drawShape(this.area.hitArea as Circle);
    this.area.moveTo(0, -hitArea.radius);
    this.area.lineTo(0, hitArea.radius);
    this.area.moveTo(-hitArea.radius, 0);
    this.area.lineTo(hitArea.radius, 0);
    this.area.endFill();

    this.onPointerUpFn = this.onPointerUp.bind(this);
    this.area.on('pointerdown', this.onPointerDown, this);
    this.area.on('pointerover', this.updateCursor, this);
    this.area.on('pointerout', this.resetCursor, this);

    selectionRenderer.attached$.subscribe(() => this.attach());
    selectionRenderer.detached$.subscribe(() => this.detach());
    selectionRenderer.update$.subscribe(() => this.updateArea());
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
   * Sets the cursor to the pivot cursor on the current pixi view.
   *
   * @param event Optional interaction event.
   */
  updateCursor(event?: InteractionEvent): void {
    this.mouseLeft = event === void 0;
    if (this.containerService.isHandling && this.containerService.currentHandler !== this) return;
    this.rendererService.view.style.cursor = 'grab';
  }

  /**
   * Resets the cursor of the pixi view.
   *
   * @param event Optional event.
   */
  resetCursor(event?: any): void {
    if (event !== void 0) this.mouseLeft = true;
    if ((this.containerService.isHandling && this.containerService.currentHandler === this) || !this.mouseLeft) return;
    this.rendererService.view.style.cursor = '';
  }

  /**
   * Handles the pointer down event.
   *
   * @param event The triggered interaction event.
   */
  onPointerDown(event: InteractionEvent): void {
    if (event.data.originalEvent.which !== 1) return;
    if (this.containerService.isHandling) return;
    this.containerService.beginHandling(this, event);
    this.clickedPivot.copyFrom(this.container.pivot);
    this.container.toLocal(event.data.global, null, tmp2);
    this.clickedMouse.copyFrom(tmp2);
    this.area.on('pointermove', this.onPointerMove, this);
    this.area.off('pointerover', this.updateCursor, this);
    this.area.off('pointerout', this.resetCursor, this);
    this.rendererService.view.style.cursor = 'grabbing';
    window.addEventListener('pointerup', this.onPointerUpFn);
  }

  /**
   * Handles the point up event.
   */
  onPointerUp(): void {
    if (!this.containerService.isHandling || this.containerService.currentHandler !== this) return;
    this.area.off('pointermove', this.onPointerMove, this);
    window.removeEventListener('pointerup', this.onPointerUpFn);
    this.area.on('pointerover', this.updateCursor, this);
    this.area.on('pointerout', this.resetCursor, this);
    this.containerService.endHandling(this);
    this.area.worldTransform.applyInverse(this.rendererService.mouse as Point, tmp1);
    const contains = this.area.hitArea.contains(tmp1.x, tmp1.y);
    if (!contains) this.resetCursor(true);
    else this.rendererService.view.style.cursor = 'grab';
  }

  /**
   * Handles the pointer move event.
   *
   * @param event The triggered interaction event.
   */
  onPointerMove(event: InteractionEvent): void {
    if (!this.containerService.isHandling || this.containerService.currentHandler !== this) return;
    this.rendererService.view.style.cursor = 'grabbing';

    this.container.toLocal(event.data.global, null, tmp2);
    tmp2.x = this.clickedPivot.x + (tmp2.x - this.clickedMouse.x);
    tmp2.y = this.clickedPivot.y + (tmp2.y - this.clickedMouse.y);
    this.container.parent.toLocal(tmp2, this.container, tmp1);

    this.container.position.copyFrom(tmp1);
    this.container.pivot.copyFrom(tmp2);

    this.updateArea();
    this.containerService.dispatchUpdate(
      this.containerService.components.byId('transformation.pivot'),
      this.containerService.components.byId('transformation.position')
    );
  }

  /**
   * Updates the pivot interaction area.
   */
  updateArea(): void {
    this.area.position.copyFrom(this.container.pivot);
    this.rendererService.stage.toLocal(this.area.position, this.container, this.area.position);
  }

  /**
   * Adds the interaction area to the stage.
   */
  attach(): void {
    (this.rendererService.stage.getChildByName('foreground') as Container).addChild(this.area);
    this.updateArea();
    this.clearSub();
    this.updateSub = this.rendererService.actions.pipe(ofActionDispatched(UpdateEntity))
                          .subscribe((action: UpdateEntity) => {
                            const data = Array.isArray(action.data) ? action.data : [action.data];
                            if (data.length <= 0) return;
                            const pivot = data[0].components.find(it => it.id === 'transformation.pivot') as PointSceneComponent;
                            if (!pivot) return;

                            const oldPos = tmp2.copyFrom(this.container.position);
                            this.container.parent.toLocal(pivot, this.container, this.container.position);

                            const diffX = oldPos.x - this.container.position.x;
                            const diffY = oldPos.y - this.container.position.y;

                            this.container.position.set(oldPos.x - diffX, oldPos.y - diffY);

                            const position = this.containerService.components.byId('transformation.position') as PointSceneComponent;
                            position.x = this.container.position.x;
                            position.y = this.container.position.y;

                            this.container.pivot.copyFrom(pivot);
                            this.containerService.dispatchUpdate(
                              this.containerService.components.byId('transformation.position')
                            );
                          });
  }

  /**
   * Removes the interaction area from the stage.
   */
  detach(): void {
    (this.rendererService.stage.getChildByName('foreground') as Container).removeChild(this.area);
    this.clearSub();
  }

}
