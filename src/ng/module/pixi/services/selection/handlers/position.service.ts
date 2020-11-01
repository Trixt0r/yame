import { Container, Point, InteractionEvent } from 'pixi.js';
import { Injectable, Inject } from '@angular/core';
import { PixiSelectionContainerService } from '../container.service';
import { PixiRendererService } from '../../renderer.service';
import { YAME_RENDERER, UpdateEntity } from 'ng/module/scene';
import { PointSceneComponent } from 'common/scene';
import { PixiSelectionRendererService } from '../renderer.service';
import { Subscription } from 'rxjs';
import { ofActionDispatched } from '@ngxs/store';
import { HotkeyService } from 'ng/services/hotkey.service';
import { takeUntil } from 'rxjs/operators';

/**
 * The position handler is responsible to move the selection container in the scene.
 */
@Injectable({ providedIn: 'root' })
export class PixiSelectionHandlerPositionService {

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
    protected selectionRenderer: PixiSelectionRendererService,
    protected hotkeys: HotkeyService
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

  /**
   * Handles keyboard events `left`, `right`, `up` and `down`.`
   *
   * @param data Addition data information such as the triggered event and the position.
   */
  keydown(data: { event: KeyboardEvent, x?: number, y?: number }): void {
    if (this.containerService.currentHandler !== this) {
      if (this.containerService.isHandling) this.containerService.endHandling(this.containerService.currentHandler, data.event);
      this.containerService.beginHandling(this, data.event);
    }
    if (typeof data.x === 'number') this.container.position.x = data.x;
    if (typeof data.y === 'number') this.container.position.y = data.y;
    this.containerService.dispatchUpdate(this.containerService.components.byId('transformation.position'));
  }

  /**
   * Handles keyboard events `left`, `right`, `up` and `down`.`
   *
   * @param data Addition data information such as the triggered event and the position.
   */
  keyup(event) {
    if (this.containerService.currentHandler !== this) return;
    this.containerService.endHandling(this, event);
  }

  /**
   * Handles the attachment event of the selection container.
   * Registers keyboard hotkeys for moving the selection.
   */
  onAttached(): void {

    this.hotkeys.register({ keys: 'arrowleft' }).pipe(takeUntil(this.selectionRenderer.detached$))
                .subscribe(event => this.keydown({ event, x: this.container.position.x - 1 }));

    this.hotkeys.register({ keys: 'arrowright' }).pipe(takeUntil(this.selectionRenderer.detached$))
                .subscribe(event => this.keydown({ event, x: this.container.position.x + 1 }));

    this.hotkeys.register({ keys: 'arrowup' }).pipe(takeUntil(this.selectionRenderer.detached$))
                .subscribe(event => this.keydown({ event, y: this.container.position.y - 1 }));

    this.hotkeys.register({ keys: 'arrowdown' }).pipe(takeUntil(this.selectionRenderer.detached$))
                .subscribe(event => this.keydown({ event, y: this.container.position.y + 1 }));

    this.hotkeys.register({ event: 'keyup', keys: ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'] })
                .pipe(takeUntil(this.selectionRenderer.detached$))
                .subscribe(event => this.keyup(event));
  }
}
