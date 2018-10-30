import * as _ from 'lodash';
import { Graphics, interaction, Point, DisplayObject, Rectangle } from 'pixi.js';
import { SelectionContainer } from '../../container';

/**
 * The config interface for the rendering.
 *
 * @export
 * @interface AnchorRenderingConfig
 */
export interface AnchorRenderingConfig {
  fill?: { alpha?: number; color?: number; };
  line?: { width?: number, color?: number; alpha?: number; },
  size?: number;
}

export class Anchor extends Graphics {

  private clickedPos = new Point();
  private containerPos = new Point();
  private clickedScale = new Point();
  private clickedSize = new Point();
  private clickedBound = new Point();
  private tmp = new Point();
  private tmpXDirection: number;
  private tmpYDirection: number;
  private tmpXSignBounds: number;
  private tmpYSignBounds: number;
  private tmpLocalBounds: Rectangle;
  private target: DisplayObject;
  private mouseupFn: EventListenerObject;
  private container: SelectionContainer;

  static ALL = 0;
  static HOR = 1;
  static VERT = 2;

  protected config: AnchorRenderingConfig = {
    fill: { },
    line: { },
    size: 10
  };

  constructor(public offset: Point, public type: number, public xDirection = 1, public yDirection = 1) {
    super();
    this.interactive = true;
    this.mouseupFn = this.mouseup.bind(this);
    this.on('mousedown', this.mousedown, this);
    this.on('mousemove', this.mousemove, this);
    window.addEventListener('mouseup', this.mouseupFn);
  }

  setContainer(container: SelectionContainer) {
    this.container = container;
  }

  setTarget(target: DisplayObject) {
    this.target = target;
  }

  render() {
    const lineWidth = _.defaultTo(this.config.line.width, 1);
    const lineColor = _.defaultTo(this.config.line.color, 0xffffff);
    const lineAlpha = _.defaultTo(this.config.line.alpha, 1);
    const fillColor = _.defaultTo(this.config.fill.color, 0x000000);
    const fillAlpha =_.defaultTo(this.config.fill.alpha, 1);

    this.clear();
    if (fillAlpha)
      this.beginFill(fillColor, fillAlpha);

    this.lineStyle(lineWidth, lineColor, lineAlpha);
    this.drawRect(-this.config.size / 2, -this.config.size / 2, this.config.size, this.config.size);

    if (fillAlpha)
      this.endFill();
    this.hitArea = this.getLocalBounds().clone();
    (<Rectangle>this.hitArea).pad(10, 10);
  }

  mousedown(event: interaction.InteractionEvent) {
    if (this.clickedPos) return;
    this.clickedScale.copy(this.target.scale);
    this.target.scale.set(1);
    this.clickedPos = this.target.toLocal(event.data.global, null, null, false);
    this.containerPos.set(this.container.position.x, this.container.position.y);
    this.target.scale.copy(this.clickedScale);
    this.tmpLocalBounds = this.target.getLocalBounds().clone();
    const bnds = this.tmpLocalBounds;
    this.tmpXDirection = this.xDirection * Math.sign(this.clickedScale.x);
    this.tmpYDirection = this.yDirection * Math.sign(this.clickedScale.y);
    this.tmpXSignBounds = Math.sign(this.tmpXDirection + 1);
    this.tmpYSignBounds = Math.sign(this.tmpYDirection + 1);
    this.clickedBound.set(bnds.x + bnds.width * this.tmpXSignBounds,
                          bnds.y + bnds.height * this.tmpYSignBounds);
    this.clickedSize.set(bnds.width, bnds.height);

    this.container.parent.toLocal(this.clickedBound, this.target, this.clickedBound);

    this.emit('handle:start');
  }

  mousemove(event: interaction.InteractionEvent) {
    if (!this.clickedPos) return;
    this.container.position.copy(this.containerPos);
    const tmpScale = this.tmp;
    tmpScale.set(this.target.scale.x, this.target.scale.y);
    this.target.scale.set(1);
    const currentPos = this.target.toLocal(event.data.global);
    this.target.scale.copy(tmpScale);
    const diff = this.tmp;
    diff.set(currentPos.x - this.clickedPos.x, currentPos.y - this.clickedPos.y);
    diff.x *= this.tmpXDirection;
    diff.y *= this.tmpYDirection;
    const scaleX = (diff.x / this.clickedSize.x);
    const scaleY = (diff.y / this.clickedSize.y);

    if (this.type === Anchor.HOR || this.type === Anchor.ALL) {
      this.target.scale.x = this.clickedScale.x + scaleX;
    }
    if (this.type === Anchor.VERT || this.type === Anchor.ALL) {
      this.target.scale.y = this.clickedScale.y + scaleY;
    }
    const bnds = this.tmpLocalBounds;
    const bound = this.tmp;
    bound.set(bnds.x + bnds.width * this.tmpXSignBounds,
              bnds.y + bnds.height * this.tmpYSignBounds);
    this.container.parent.toLocal(bound, this.target, bound);
    bound.set((bound.x - this.clickedBound.x), (bound.y - this.clickedBound.y));
    this.container.position.x = this.containerPos.x + bound.x;
    this.container.position.y = this.containerPos.y + bound.y;
    this.emit('update');
  }

  mouseup(event: interaction.InteractionEvent) {
    if (!this.clickedPos) return;
    this.clickedPos = null;
    this.emit('handle:end');
  }

}
