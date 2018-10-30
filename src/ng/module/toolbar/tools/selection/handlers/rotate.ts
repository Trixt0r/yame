import { Text, TextStyleOptions, Container, Rectangle, interaction, Point } from 'pixi.js';
import { SelectionContainer } from "../container";
import { Entity } from "../../../../pixi/idx";
import { SelectionRenderer } from '../renderer';

const textStyle: TextStyleOptions = {
  fontFamily: 'Material Icons',
  fontSize: 48,
  fill: 0xffffff,
}
const indicator = new Text('cached', textStyle);
indicator.pivot.set(24, 19.2);
indicator.interactive = true;


export class SelectionRotateHandler {

  private mouseStartPos: Point;
  private mouseCurrentPos: Point;

  private initRot: number;
  private clickedRot: number;
  private clickedPos: Point;

  private mouseupFn: EventListenerObject;

  constructor(private container: SelectionContainer, private renderer: SelectionRenderer) {

    this.mouseCurrentPos = new Point();
    this.mouseStartPos = new Point();
    this.initRot = 0;
    this.clickedRot = 0;
    this.clickedPos = new Point();
    this.mouseupFn = this.mouseup.bind(this);

    renderer.on('attached', this.attached, this);
    renderer.on('detached', this.detached, this);
    renderer.on('updated', this.updated, this);

    indicator.on('mousedown', this.mousedown, this);
    indicator.on('mousemove', this.mousemove, this);
    window.addEventListener('mouseup', this.mouseupFn);

    container.on('selected', this.selected, this);
    container.on('unselected', this.unselected, this);
  }

  mousedown(event: interaction.InteractionEvent) {
    if (this.container.isHandling) return;
    this.clickedPos.set(this.container.position.x, this.container.position.y);
    this.container.beginHandling(this, event);
    this.mouseStartPos.set(event.data.global.x, event.data.global.y);
    this.container.parent.toLocal(this.mouseStartPos, null, this.mouseStartPos);
    this.initRot = this.container.rotation;
    this.clickedRot = Math.atan2(this.mouseStartPos.y - this.container.position.y, this.mouseStartPos.x - this.container.position.x);
  }

  mouseup() {
    if (!this.container.isHandling || this.container.currentHandler !== this) return;
    this.container.endHandling(this);
  }

  mousemove(event: interaction.InteractionEvent) {
    if (!this.container.isHandling || this.container.currentHandler !== this) return;
    this.mouseCurrentPos.set(event.data.global.x, event.data.global.y);
    this.container.parent.toLocal(this.mouseCurrentPos, null, this.mouseCurrentPos);
    this.container.rotation = this.initRot + Math.atan2(this.mouseCurrentPos.y - this.clickedPos.y, this.mouseCurrentPos.x - this.clickedPos.x) - this.clickedRot;
    indicator.rotation = this.container.rotation;
    this.container.emit('update');
  }

  attached(stage: Container) {
    stage.addChild(indicator);
  }

  detached(stage: Container) {
    stage.removeChild(indicator);
  }

  updated(stage: Container, bounds: Rectangle) {
    const bnds = this.container.getLocalBounds();
    indicator.position.set(bnds.x + bnds.width / 2, bnds.y + bnds.height / 2);
    stage.toLocal(indicator.position, this.container, indicator.position);
  }

  selected() {
    if (this.container.length === 1) {
      const tmp = this.container.entities[0].rotation;
      this.container.entities[0].rotation = 0;
      this.container.rotation = tmp;
      this.container.emit('update');
    }
    indicator.rotation = this.container.rotation;
  }

  unselected(unselected: Entity[]) {
    unselected.forEach(entity => entity.rotation += this.container.rotation);
    this.container.rotation = 0;
  }

}
