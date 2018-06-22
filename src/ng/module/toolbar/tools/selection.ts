import * as _ from 'lodash';
import { Tool } from '../tool';
import { ReflectiveInjector, NgModuleRef } from '@angular/core';
import { PixiService } from '../../pixi/service';
import { Map } from '../../pixi/scene/map';
import { Pubsub, AppModule } from 'ng/idx';
import { interaction, Rectangle, Graphics } from 'pixi.js';
import { SelectionRectangle } from './selection/rectangle';

export interface SelectionToolConfig {

  fill?: { alpha?: number; color?: number; };
  line?: { width?: number, color?: number; alpha?: number; }

}

export class SelectionTool extends Tool {

  container: PIXI.Container;
  map: Map;

  config: SelectionToolConfig = { fill: { }, line: { } };

  private rectangle: SelectionRectangle;
  private graphics = new Graphics();
  private down = false;
  private service: PixiService;

  private onMousedown: EventListenerObject;
  private onMouseup: EventListenerObject;
  private onMousemove: EventListenerObject;

  constructor(id: string, icon?: string) {
    super(id, icon);
    Pubsub.once('ready', (ref: NgModuleRef<AppModule>) => {
      const service = this.service = ref.injector.get(PixiService);
      this.map = service.scene;
      this.container = service.app.stage;
      this.rectangle = new SelectionRectangle(this.container);
      if (this.isActive)
        this.addToolListeners();
    });
  }

  initFunctions() {
    if (!this.onMousedown)
      this.onMousedown = this.mousedown.bind(this);
    if (!this.onMouseup)
      this.onMouseup = this.mouseup.bind(this);
    if (!this.onMousemove)
      this.onMousemove = this.mousemove.bind(this);
  }

  addToolListeners(): void {
    this.initFunctions();
    const canvas = this.service.view;
    canvas.addEventListener('mousedown', this.onMousedown);
    canvas.addEventListener('mouseup', this.onMouseup);
    canvas.addEventListener('mousemove', this.onMousemove);
  }

  removeToolListeners(): void {
    const canvas = this.service.view;
    canvas.removeEventListener('mousedown', this.onMousedown);
    canvas.removeEventListener('mouseup', this.onMouseup);
    canvas.removeEventListener('mousemove', this.onMousemove);
  }

  /** @inheritDoc */
  onActivate() {
    if (this.service)
      this.addToolListeners();
    return Promise.resolve();
  }

  mousedown(event: MouseEvent) {
    if (event.which !== 1) return;
    if (this.down) return;
    this.rectangle.reset();
    this.container.toLocal((<any>this.service.renderer.plugins).interaction.mouse.global, void 0, this.rectangle.topLeft);
    this.graphics.clear();
    this.container.addChild(this.graphics);
    this.down = true;
  }

  mouseup(event: MouseEvent) {
    if (event.which !== 1) return;
    this.finish();
  }

  mousemove(event: MouseEvent) {
    if (!this.down) return;
    if (event.which !== 1) return this.finish();
    this.container.toLocal((<any>this.service.renderer.plugins).interaction.mouse.global, void 0, this.rectangle.bottomRight);
    this.rectangle.update();
    this.graphics.clear();
    this.graphics.lineStyle(_.defaultTo(this.config.line.width, 1),
                            _.defaultTo(this.config.line.color, 0xffffff),
                            _.defaultTo(this.config.line.alpha, 1));
    this.graphics.beginFill(_.defaultTo(this.config.fill.color, 0xffffff),
                            _.defaultTo(this.config.fill.alpha, 0.25));
    this.graphics.drawShape(this.rectangle.rectangle);
    this.graphics.endFill();
  }

  finish() {
    this.down = false;
    this.container.removeChild(this.graphics);
    const selection = this.map.entities.filter(child => this.rectangle.contains(child));
    this.emit('finish', selection, this.rectangle);
  }

  /** @inheritDoc */
  onDeactivate() {
    this.removeToolListeners();
    return Promise.resolve();
  }

}
