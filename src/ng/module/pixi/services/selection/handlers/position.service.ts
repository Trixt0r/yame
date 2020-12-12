import { Container, Point, InteractionEvent } from 'pixi.js';
import { Injectable, Inject } from '@angular/core';
import { PixiSelectionContainerService } from '../container.service';
import { PixiRendererService } from '../../renderer.service';
import { YAME_RENDERER } from 'ng/module/scene';
import { PixiSelectionRendererService } from '../renderer.service';
import { Actions, ofActionSuccessful } from '@ngxs/store';
import { takeUntil } from 'rxjs/operators';
import { Keydown, Keyup } from 'ng/states/hotkey.state';
import { PointSceneComponent } from 'common/scene';
import { CursorService } from 'ng/services/cursor.service';

/**
 * The position handler is responsible to move the selection container in the scene.
 */
@Injectable({ providedIn: 'root' })
export class PixiSelectionHandlerPositionService {
  protected startPos: Point;
  protected mouseCurrentPos: Point;
  protected mouseStartPos: Point;
  protected mouseupFn: (event: MouseEvent) => void;
  protected container: Container;

  /**
   * Creates an instance of SelectionTranslateHandler.
   */
  constructor(
    @Inject(YAME_RENDERER) protected rendererService: PixiRendererService,
    protected containerService: PixiSelectionContainerService,
    protected selectionRenderer: PixiSelectionRendererService,
    protected cursorService: CursorService,
    protected actions: Actions,
  ) {
    this.startPos = new Point();
    this.mouseCurrentPos = new Point();
    this.mouseStartPos = new Point();
    this.mouseupFn = this.mouseup.bind(this);
    this.container = this.containerService.container;
    this.container.on('pointerdown', this.mousedown, this);
    selectionRenderer.attached$.subscribe(() => this.onAttached());
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
    this.container.parent.toLocal(this.mouseStartPos, void 0, this.mouseStartPos);
    this.startPos.set(this.container.position.x, this.container.position.y);
    if (this.rendererService.view) {
      this.cursorService.begin(this.rendererService.view);
      this.rendererService.view.style.cursor = 'move';
    }
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
    this.cursorService.end();
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
    this.container.parent.toLocal(this.mouseCurrentPos, void 0, this.mouseCurrentPos);
    this.container.position.x = this.startPos.x + (this.mouseCurrentPos.x - this.mouseStartPos.x);
    this.container.position.y = this.startPos.y + (this.mouseCurrentPos.y - this.mouseStartPos.y);
    this.containerService.dispatchUpdate(
      this.containerService.components.byId('transformation.position') as PointSceneComponent
    );
  }

  /**
   * Handles keydown events `left`, `right`, `up` and `down`.`
   *
   * @param data Additional data information such as the triggered event and the position values.
   */
  keydown(data: { event: KeyboardEvent; x?: number; y?: number }): void {
    if (this.containerService.currentHandler !== this) {
      if (this.containerService.isHandling)
        this.containerService.endHandling(this.containerService.currentHandler, data.event);
      this.containerService.beginHandling(this, data.event);
    }
    if (typeof data.x === 'number') this.container.position.x = data.x;
    if (typeof data.y === 'number') this.container.position.y = data.y;
    this.containerService.dispatchUpdate(
      this.containerService.components.byId('transformation.position') as PointSceneComponent
    );
  }

  /**
   * Handles keyup events `left`, `right`, `up` and `down`.`
   *
   * @param event The triggered event.
   */
  keyup(event: KeyboardEvent) {
    if (this.containerService.currentHandler !== this) return;
    this.containerService.endHandling(this, event);
  }

  /**
   * Handles the attachment event of the selection container.
   * Registers keyboard hotkeys for moving the selection.
   */
  onAttached(): void {
    this.actions.pipe(ofActionSuccessful(Keydown), takeUntil(this.selectionRenderer.detached$))
                .subscribe((action: Keydown) => {
                  if (action.shortcut.id !== 'selection.move') return;
                  switch (action.event.key.toLowerCase()) {
                    case 'arrowleft': this.keydown({ event: action.event, x: this.container.position.x - 1 }); break;
                    case 'arrowright': this.keydown({ event: action.event, x: this.container.position.x + 1 }); break;
                    case 'arrowup': this.keydown({ event: action.event, y: this.container.position.y - 1 }); break;
                    case 'arrowdown': this.keydown({ event: action.event, y: this.container.position.y + 1 }); break;
                  }
                });

    this.actions.pipe(ofActionSuccessful(Keyup), takeUntil(this.selectionRenderer.detached$))
                .subscribe((action: Keyup) => {
                  if (action.shortcut.id !== 'selection.move') return;
                  this.keyup(action.event);
                });
  }
}
