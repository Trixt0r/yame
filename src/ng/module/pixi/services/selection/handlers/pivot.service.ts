import { Injectable, Inject } from '@angular/core';
import { Graphics, Circle, Point, Container, InteractionEvent } from 'pixi.js';
import { PixiRendererService } from '../..';
import { PixiSelectionContainerService } from '..';
import { PixiSelectionRendererService } from '../renderer.service';
import { YAME_RENDERER, UpdateEntity } from 'ng/module/scene';
import { SceneEntity, PointSceneComponent } from 'common/scene';
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
  protected mouseupFn: EventListenerObject;

  /**
   * Whether the mouse left.
   */
  protected mouseLeft = false;

  /**
   * The update entity subscription, for updates via sidebar.
   */
  protected updateSub: Subscription;

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

    this.mouseupFn = this.mouseup.bind(this);
    this.area.on('pointerdown', this.mousedown, this);
    this.area.on('pointerover', this.updateCursor, this);
    this.area.on('pointerout', this.resetCursor, this);

    selectionRenderer.attached$.subscribe(() => this.attached());
    selectionRenderer.detached$.subscribe(() => this.detached());
    selectionRenderer.update$.subscribe(() => this.updateArea());
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
   * @param event Optional event
   */
  resetCursor(event?: any): void {
    if (event !== void 0) this.mouseLeft = true;
    if ((this.containerService.isHandling && this.containerService.currentHandler === this) || !this.mouseLeft) return;
    this.rendererService.view.style.cursor = '';
  }

  mousedown(event: InteractionEvent): void {
    if (event.data.originalEvent.which !== 1) return;
    if (this.containerService.isHandling) return;
    this.containerService.beginHandling(this, event);
    this.area.on('pointermove', this.mousemove, this);
    this.area.off('pointerover', this.updateCursor, this);
    this.area.off('pointerout', this.resetCursor, this);
    this.rendererService.view.style.cursor = 'grabbing';
    window.addEventListener('pointerup', this.mouseupFn);
  }

  mouseup(): void {
    if (!this.containerService.isHandling || this.containerService.currentHandler !== this) return;
    this.area.off('pointermove', this.mousemove, this);
    window.removeEventListener('pointerup', this.mouseupFn);
    this.area.on('pointerover', this.updateCursor, this);
    this.area.on('pointerout', this.resetCursor, this);
    this.containerService.endHandling(this);
    this.area.worldTransform.applyInverse(this.rendererService.mouse as Point, tmp1);
    const contains = this.area.hitArea.contains(tmp1.x, tmp1.y);
    if (!contains) this.resetCursor(true);
    else this.rendererService.view.style.cursor = 'grab';
  }

  mousemove(event: InteractionEvent): void {
    if (!this.containerService.isHandling || this.containerService.currentHandler !== this) return;
    this.rendererService.view.style.cursor = 'grabbing';

    this.container.parent.toLocal(event.data.global, null, tmp1);
    this.container.toLocal(event.data.global, null, tmp2);
    this.container.position.copyFrom(tmp1);
    this.container.pivot.copyFrom(tmp2);

    this.updateArea();
    this.containerService.dispatchUpdate(
      this.containerService.components.byId('transformation.pivot'),
      this.containerService.components.byId('transformation.position')
    );
  }

  updateArea(): void {
    this.area.position.copyFrom(this.container.pivot);
    this.rendererService.stage.toLocal(this.area.position, this.container, this.area.position);
    window.removeEventListener('mouseup', this.mouseupFn);
  }

  /**
   * Handles the attachment to the scene.
   * Adds all clickable areas to the stage.
   */
  attached(): void {
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
   * Handles detachment from the scene.
   * Removes all clickable areas to the stage.
   */
  detached(): void {
    (this.rendererService.stage.getChildByName('foreground') as Container).removeChild(this.area);
    this.clearSub();
  }

  /**
   * Handles the un-selection of the given entities.
   *
   * @param entities The unselected entities.
   */
  unselected(entities: SceneEntity[]): void {
    if (entities.length > 1)
      return entities.forEach(entity => {
        const pivot = entity.components.byId('transformation.pivot') as PointSceneComponent;
        if (!pivot) return;
        const child = this.rendererService.getContainer(entity.id);
        if (!child) return;
        pivot.x = child.pivot.x;
        pivot.y = child.pivot.y;
      });
    const entity = entities[0];
    if (!entity) return;
    const child = this.rendererService.getContainer(entity.id);
    const pivot = entity.components.byId('transformation.pivot') as PointSceneComponent;
    if (!pivot) return;
    pivot.x = this.container.pivot.x;
    pivot.y = this.container.pivot.y;
    child.parent.toLocal(pivot, child, entity.components.byId('transformation.position') as unknown as Point);
  }

}
