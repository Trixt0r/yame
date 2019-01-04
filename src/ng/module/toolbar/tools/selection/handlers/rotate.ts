import { Text, TextStyleOptions, Container, Rectangle, interaction, Point, Graphics, DisplayObject } from 'pixi.js';
import { SelectionContainer } from '../container';
import { Entity, PixiService } from '../../../../pixi/idx';
import { SelectionRenderer } from '../renderer';
import { Store } from '@ngxs/store';
import { Rotate } from '../ngxs/actions';

/**
 * The rotation handler is responsible for changing the rotation of the current selection.
 *
 * @export
 * @class SelectionRotateHandler
 */
export class SelectionRotateHandler {
  private mouseStartPos: Point;
  private mouseCurrentPos: Point;

  private initRot: number;
  private clickedRot: number;
  private clickedPos: Point;

  private mouseupFn: EventListenerObject;
  private mouseLeft = false;

  readonly areas: DisplayObject[] = [];

  /**
   * Creates an instance of SelectionRotateHandler.
   * @param {SelectionContainer} container The selection container.
   * @param {SelectionRenderer} renderer The selection renderer.
   * @param {PixiService} service The pixi service.
   * @memberof SelectionRotateHandler
   */
  constructor(
    private container: SelectionContainer,
    private renderer: SelectionRenderer,
    private service: PixiService,
    private store: Store
  ) {
    this.mouseCurrentPos = new Point();
    this.mouseStartPos = new Point();
    this.initRot = 0;
    this.clickedRot = 0;
    this.clickedPos = new Point();
    this.mouseupFn = this.mouseup.bind(this);

    renderer.on('attached', this.attached, this);
    renderer.on('detached', this.detached, this);
    renderer.on('updated', this.updated, this);

    this.areas.push(new DisplayObject(), new DisplayObject(), new DisplayObject(), new DisplayObject());
    this.areas.forEach(area => {
      area.interactive = true;
      area.on('mousedown', this.mousedown, this);
      area.on('mousemove', this.mousemove, this);
      area.on('mouseover', this.updateCursor, this);
      area.on('mouseout', this.resetCursor, this);
    });
    window.addEventListener('mouseup', this.mouseupFn);

    container.on('selected', this.selected, this);
    container.on('unselected', this.unselected, this);
  }

  /**
   * Sets the cursor to the rotation cursor on the current pixi view.
   *
   * @param {interaction.InteractionEvent} [event]
   * @returns {void}
   * @memberof SelectionRotateHandler
   */
  updateCursor(event?: interaction.InteractionEvent): void {
    this.mouseLeft = event === void 0;
    if (this.container.isHandling && this.container.currentHandler !== this) return;
    this.service.view.style.cursor = 'url("assets/rotate-icon.svg"), pointer';
  }

  /**
   * Resets the cursor of the pixi view.
   *
   * @param {interaction.InteractionEvent} [event]
   * @returns {void}
   */
  resetCursor(event?: interaction.InteractionEvent): void {
    if (event !== void 0) this.mouseLeft = true;
    if ((this.container.isHandling && this.container.currentHandler === this) || !this.mouseLeft) return;
    this.service.view.style.cursor = '';
  }

  /**
   * Mouse down handler.
   * Starts the handling and sets up all temp variables for rotating the container.
   *
   * @param {interaction.InteractionEvent} event
   * @returns {void}
   */
  mousedown(event: interaction.InteractionEvent) {
    if (this.container.isHandling) return;
    this.clickedPos.set(this.container.position.x, this.container.position.y);
    this.container.beginHandling(this, event);
    this.mouseStartPos.set(event.data.global.x, event.data.global.y);
    this.container.parent.toLocal(this.mouseStartPos, null, this.mouseStartPos);
    this.initRot = this.container.rotation;
    this.clickedRot = Math.atan2(
      this.mouseStartPos.y - this.container.position.y,
      this.mouseStartPos.x - this.container.position.x
    );
  }

  /**
   * Mouse up handler.
   * Finishs the handling.
   *
   * @returns {void}
   * @memberof SelectionRotateHandler
   */
  mouseup(): void {
    if (!this.container.isHandling || this.container.currentHandler !== this) return;
    this.container.endHandling(this);
    this.resetCursor();
  }

  /**
   * Mouse move handler.
   * Executes the actual rotation.
   *
   * @param {interaction.InteractionEvent} event
   * @returns {void}
   */
  mousemove(event: interaction.InteractionEvent): void {
    if (!this.container.isHandling || this.container.currentHandler !== this) return;
    this.mouseCurrentPos.set(event.data.global.x, event.data.global.y);
    this.container.parent.toLocal(this.mouseCurrentPos, null, this.mouseCurrentPos);
    this.container.rotation =
      this.initRot +
      Math.atan2(this.mouseCurrentPos.y - this.clickedPos.y, this.mouseCurrentPos.x - this.clickedPos.x) -
      this.clickedRot;
    this.store.dispatch(new Rotate(this.container.rotation));
  }

  /**
   * Updates the clickable rotation areas on the container.
   *
   * @param {Container} stage
   * @returns {void}
   */
  updateAreaPostions(stage: Container): void {
    const bnds = this.container.getLocalBounds();
    const threshold = 50;
    const offset = this.container.length === 1 ? 15 : 0;
    const topLeft = new Point(bnds.x, bnds.y);
    const topRight = new Point(bnds.x + bnds.width, bnds.y);
    const bottomLeft = new Point(bnds.x, bnds.y + bnds.height);
    stage.toLocal(topLeft, this.container, topLeft);
    stage.toLocal(topRight, this.container, topRight);
    stage.toLocal(bottomLeft, this.container, bottomLeft);
    const horDiff = { x: topLeft.x - topRight.x, y: topLeft.y - topRight.y };
    const verDiff = { x: bottomLeft.x - topLeft.x, y: bottomLeft.y - topLeft.y };
    const width = Math.sqrt(horDiff.x * horDiff.x + horDiff.y * horDiff.y) + (offset + threshold) * 2;
    const height = Math.sqrt(verDiff.x * verDiff.x + verDiff.y * verDiff.y);
    // Top
    this.areas[0].hitArea = new Rectangle(-offset - threshold, -offset - threshold, width, threshold);
    this.areas[0].position.set(bnds.x, bnds.y);
    // Right
    this.areas[1].hitArea = new Rectangle(offset, 0, threshold, height);
    this.areas[1].position.set(bnds.x + bnds.width, bnds.y);
    // Bottom
    this.areas[2].hitArea = new Rectangle(-offset - threshold, offset, width, threshold);
    this.areas[2].position.set(bnds.x, bnds.y + bnds.height);
    // Left
    this.areas[3].hitArea = new Rectangle(-offset - threshold, 0, threshold, height);
    this.areas[3].position.set(bnds.x, bnds.y);
    this.areas.forEach(area => {
      area.rotation = this.container.rotation;
      stage.toLocal(area.position, this.container, area.position);
    });
  }

  /**
   * The attached handler.
   * Adds all clickable areas to the stage.
   *
   * @param {Container} stage
   * @returns {void}
   */
  attached(stage: Container): void {
    this.updateAreaPostions(stage);
    this.areas.forEach(area => stage.addChild(area));
  }

  /**
   * The detached handler.
   * Removes all clickable areas to the stage.
   *
   * @param {Container} stage
   * @returns {void}
   */
  detached(stage: Container): void {
    this.areas.forEach(area => stage.removeChild(area));
  }

  /**
   * Update handler.
   * Makes sure that the clickable areas are aligned properly.
   *
   * @param {Container} stage
   * @returns {void}
   */
  updated(stage: Container): void {
    this.updateAreaPostions(stage);
  }

  /**
   * The selected handler.
   * Apply the rotation of the entity if only one entity is selected.
   *
   * @returns {void}
   */
  selected(): void {
    if (this.container.length === 1) {
      const tmp = this.container.entities[0].rotation;
      this.container.entities[0].rotation = 0;
      this.container.rotation = tmp;
      this.container.emit('updated');
    }
  }

  /**
   * The unselected handler.
   * Applies the rotation back to all entities in the container.
   *
   * @param {Entity[]} unselected
   * @returns {void}
   */
  unselected(unselected: Entity[]): void {
    unselected.forEach(entity => (entity.rotation += this.container.rotation));
    this.container.rotation = 0;
  }
}
