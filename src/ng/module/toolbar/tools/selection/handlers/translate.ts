import { SelectionContainer } from '../container';
import { interaction } from 'pixi.js';
import { PixiService } from 'ng/idx';
import { Store } from '@ngxs/store';
import { UpdateSelection } from '../ngxs/actions';

/**
 * The translate handler is responsible to move the selection container in the scene.
 *
 * @export
 * @class SelectionTranslateHandler
 */
export class SelectionTranslateHandler {
  private startPos: PIXI.Point;
  private mouseCurrentPos: PIXI.Point;
  private mouseStartPos: PIXI.Point;
  private mouseupFn: EventListenerObject;

  /**
   * Creates an instance of SelectionTranslateHandler.
   * @param {SelectionContainer} container The selection container.
   * @param {PixiService} service The pixi service.
   */
  constructor(private container: SelectionContainer, private service: PixiService, private store: Store) {
    this.startPos = new PIXI.Point();
    this.mouseCurrentPos = new PIXI.Point();
    this.mouseStartPos = new PIXI.Point();
    this.mouseupFn = this.mouseup.bind(this);
    container.on('mousedown', this.mousedown, this);
    container.on('unselected', this.unselected, this);
  }

  /**
   * The mouse down handler.
   * Begins the handling and sets up all variables for moving.
   *
   * @param {interaction.InteractionEvent} event
   * @returns {void}
   */
  mousedown(event: interaction.InteractionEvent) {
    if (this.container.isHandling) return;
    this.container.on('mousemove', this.mousemove, this);
    window.addEventListener('mouseup', this.mouseupFn);
    this.container.beginHandling(this, event);
    this.mouseStartPos.set(event.data.global.x, event.data.global.y);
    this.container.parent.toLocal(this.mouseStartPos, null, this.mouseStartPos);
    this.startPos.set(this.container.position.x, this.container.position.y);
    this.service.view.style.cursor = 'move';
  }

  /**
   * The mouse up handler.
   * Ends the handling.
   *
   * @param {interaction.InteractionEvent} event
   * @returns {void}
   */
  mouseup(event: interaction.InteractionEvent): void {
    if (!this.container.isHandling || this.container.currentHandler !== this) return;
    this.container.off('mousemove', this.mousemove, this);
    window.removeEventListener('mouseup', this.mouseupFn);
    this.container.endHandling(this, event);
    this.service.view.style.cursor = '';
    this.store.dispatch(new UpdateSelection(this.container.getProperties(), this.container.additionalPropertyNames));
  }

  /**
   * The mouse move handler.
   * Applies the new position to the selection container.
   *
   * @param {interaction.InteractionEvent} event
   * @returns {void}
   */
  mousemove(event: interaction.InteractionEvent): void {
    if (!this.container.isHandling || this.container.currentHandler !== this) return;
    this.mouseCurrentPos.set(event.data.global.x, event.data.global.y);
    this.container.parent.toLocal(this.mouseCurrentPos, null, this.mouseCurrentPos);
    this.container.position.x = this.startPos.x + (this.mouseCurrentPos.x - this.mouseStartPos.x);
    this.container.position.y = this.startPos.y + (this.mouseCurrentPos.y - this.mouseStartPos.y);
    this.container.emit('updated');
  }

  /**
   * The unselected handler.
   *
   * @returns {void}
   */
  unselected(): void {
    if (this.container.length === 0) this.container.position.set(0, 0);
  }
}
