import { Text, TextStyleOptions, Container, Rectangle, interaction, Point } from 'pixi.js';
import { SelectionContainer } from "../container";
import { Entity } from "../../../../pixi/idx";
import { SelectionRenderer } from '../renderer';

const textStyle: TextStyleOptions = {
  fontFamily: 'Material Icons',
  fontSize: 48,
  fill: 0xffffff,
}
let indicator = new Text('cached', textStyle);
indicator.anchor.set(0.5, 0.5);
indicator.interactive = true;


export class SelectionRotateHandler {

  private mouseStartPos: PIXI.Point;
  private mouseCurrentPos: PIXI.Point;

  constructor(private container: SelectionContainer, private renderer: SelectionRenderer) {

    this.mouseCurrentPos = new PIXI.Point();
    this.mouseStartPos = new PIXI.Point();

    renderer.on('attached', (stage: Container) => stage.addChild(indicator) );
    renderer.on('detached', (stage: Container) => stage.removeChild(indicator));
    renderer.on('updated', (bounds: Rectangle) => {
      indicator.position.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    });

    let initRot = 0;
    let clickedRot = 0;
    let clickedPos = new Point();

    indicator.on('mousedown', (event: interaction.InteractionEvent) => {
      if (this.container.isHandling) return;
      clickedPos.set(this.container.position.x, this.container.position.y);
      this.container.beginHandling(this, event);
      this.mouseStartPos.set(event.data.global.x, event.data.global.y);
      this.container.parent.toLocal(this.mouseStartPos, null, this.mouseStartPos);
      initRot = container.rotation;
      clickedRot = Math.atan2(this.mouseStartPos.y - this.container.position.y, this.mouseStartPos.x - this.container.position.x);
    });

    indicator.on('mousemove', (event: interaction.InteractionEvent) => {
      if (!this.container.isHandling || this.container.currentHandler !== this) return;
      this.mouseCurrentPos.set(event.data.global.x, event.data.global.y);
      this.container.parent.toLocal(this.mouseCurrentPos, null, this.mouseCurrentPos);
      this.container.rotation = initRot + Math.atan2(this.mouseCurrentPos.y - clickedPos.y, this.mouseCurrentPos.x - clickedPos.x) - clickedRot;
      this.container.emit('moved');
    });

    window.addEventListener('mouseup', () => {
      if (!this.container.isHandling || this.container.currentHandler !== this) return;
     this.container.endHandling();
    })

    container.on('selected', () => {
      if (container.length === 1) {
        container.rotation = container.entities[0].rotation;
        container.entities[0].rotation = 0;
      }
    });

    container.on('unselected', (unselected: Entity[]) => {
      unselected.forEach(entity => entity.rotation += container.rotation);
      container.rotation = 0;
    });
  }

}
