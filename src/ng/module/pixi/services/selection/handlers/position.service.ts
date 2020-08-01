import { Container, Point, InteractionEvent } from 'pixi.js';
import { Injectable, Inject } from '@angular/core';
import { PixiSelectionContainerService } from '../container.service';
import { PixiRendererService } from '../../renderer.service';
import { YAME_RENDERER, UpdateEntity } from 'ng/module/scene';
import { SceneEntity, PointSceneComponent } from 'common/scene';
import { PixiSelectionRendererService } from '../renderer.service';
import { Subscription } from 'rxjs';
import { ofActionDispatched } from '@ngxs/store';

/**
 * The position handler is responsible to move the selection container in the scene.
 */
@Injectable({ providedIn: 'root' })
export class PixiSelectionHandlerPositionService {

  /**
   * The update entity subscription, for updates via sidebar.
   */
  protected updateSub: Subscription;

  protected startPos: Point;
  protected mouseCurrentPos: Point;
  protected mouseStartPos: Point;
  protected mouseupFn: EventListenerObject;
  protected container: Container;

  /**
   * Creates an instance of SelectionTranslateHandler.
   */
  constructor(
    @Inject(YAME_RENDERER) protected rendererService: PixiRendererService,
    protected containerService: PixiSelectionContainerService,
    protected selectionRenderer: PixiSelectionRendererService
  ) {
    this.startPos = new Point();
    this.mouseCurrentPos = new Point();
    this.mouseStartPos = new Point();
    this.mouseupFn = this.mouseup.bind(this);
    this.container = this.containerService.container;
    this.container.on('pointerdown', this.mousedown, this);
    selectionRenderer.attached$.subscribe(() => this.attached());
    selectionRenderer.detached$.subscribe(() => this.detached());
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
   * The mouse down handler.
   * Begins the handling and sets up all variables for moving.
   *
   * @param event
   */
  mousedown(event: InteractionEvent) {
    if (event.data.originalEvent.which !== 1) return;
    if (this.containerService.isHandling) return;
    this.container.on('pointermove', this.mousemove, this);
    window.addEventListener('mouseup', this.mouseupFn);
    this.containerService.beginHandling(this, event);
    this.mouseStartPos.set(event.data.global.x, event.data.global.y);
    this.container.parent.toLocal(this.mouseStartPos, null, this.mouseStartPos);
    this.startPos.set(this.container.position.x, this.container.position.y);
    this.rendererService.view.style.cursor = 'move';
  }

  /**
   * Handles the mouse up event, i.e. ends the handling.
   *
   * @param event The triggered event
   */
  mouseup(event: MouseEvent): void {
    if (!this.containerService.isHandling || this.containerService.currentHandler !== this) return;
    this.container.off('pointermove', this.mousemove, this);
    window.removeEventListener('mouseup', this.mouseupFn);
    this.containerService.endHandling(this, event);
    this.rendererService.view.style.cursor = '';
  }

  /**
   * The mouse move handler.
   * Applies the new position to the selection container.
   *
   * @param event
   */
  mousemove(event: InteractionEvent): void {
    if (!this.containerService.isHandling || this.containerService.currentHandler !== this) return;
    this.mouseCurrentPos.set(event.data.global.x, event.data.global.y);
    this.container.parent.toLocal(this.mouseCurrentPos, null, this.mouseCurrentPos);
    this.container.position.x = this.startPos.x + (this.mouseCurrentPos.x - this.mouseStartPos.x);
    this.container.position.y = this.startPos.y + (this.mouseCurrentPos.y - this.mouseStartPos.y);
    this.containerService.dispatchUpdate(this.containerService.components.byId('transformation.position'));
  }

  attached(): void {
    this.clearSub();
    this.updateSub = this.rendererService.actions.pipe(ofActionDispatched(UpdateEntity))
                          .subscribe((action: UpdateEntity) => {
                            const data = Array.isArray(action.data) ? action.data : [action.data];
                            const hasPosition = data.find(it => it.components.find(comp => comp.id === 'transformation.position'));
                            if (!hasPosition) return;
                            const position = this.containerService.components.byId('transformation.position') as PointSceneComponent;
                            this.container.position.copyFrom(position);
                          });
  }

  detached(): void {
    this.clearSub();
  }

  /**
   * The unselected handler.
   */
  unselected(entities: SceneEntity[]): void {
    entities.forEach(entity => {
      const child = this.rendererService.getContainer(entity.id);
      const position = entity.components.byId('transformation.position') as PointSceneComponent;
      if (position) {
        position.x = child.position.x;
        position.y = child.position.y;
      }
    });
  }
}
