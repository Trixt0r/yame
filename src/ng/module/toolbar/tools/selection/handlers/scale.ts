import { Container, Point } from "pixi.js";
import { Anchor } from "./scale/anchor";
import { SelectionRenderer } from "../renderer";
import { SelectionContainer } from "../container";
import { Entity } from "ng/idx";
import { Group } from "ng/module/pixi/idx";

const points = [
  new Anchor(new Point(0, 0), Anchor.ALL, -1, -1), // top left
  new Anchor(new Point(0.5, 0), Anchor.VERT, 1, -1), // top mid
  new Anchor(new Point(1, 0), Anchor.ALL, 1, -1), // top right
  new Anchor(new Point(1, 0.5), Anchor.HOR), // right mid
  new Anchor(new Point(1, 1), Anchor.ALL), // bot right
  new Anchor(new Point(0.5, 1), Anchor.VERT), // bot mid
  new Anchor(new Point(0, 1), Anchor.ALL, -1, 1), // bot left
  new Anchor(new Point(0, 0.5), Anchor.HOR, -1, -1), // left mid
];

export class SelectionScaleHandler {

  private active: boolean;

  constructor(private container: SelectionContainer, private renderer: SelectionRenderer) {
    this.active = false;
    renderer.on('attached', this.attached, this);
    renderer.on('detached', this.detached, this);
    renderer.on('updated', this.updated, this);

    container.on('selected', this.selected, this);
    container.on('unselected', this.unselected, this);
  }

  attached(stage: Container) {
    if (this.container.length !== 1) return;
    if (this.container.entities[0] instanceof Group) return;
    points.forEach(point => {
      point.render();
      point.setContainer(this.container);
      point.setTarget(this.container.entities[0]);
      point.on('update', () => this.container.emit('update'));
      point.on('handle:start', () => this.container.beginHandling(point));
      point.on('handle:end', () => this.container.endHandling(point));
      stage.addChild(point);
    });
  }

  detached(stage: Container) {
    points.forEach(point => {
      point.off('update');
      point.off('handle:start');
      point.off('handle:end');
      stage.removeChild(point);
    });
  }

  updated(stage: Container) {
    const bnds = this.container.getLocalBounds();
    points.forEach(point => {
      point.position.set(bnds.x + bnds.width * point.offset.x, bnds.y + bnds.height * point.offset.y);
      stage.toLocal(point.position, this.container, point.position);
    });
  }

  selected(entities: Entity[]) {
    this.active = entities.length === 1;
  }

  unselected() {
    this.active = false;
  }

}
