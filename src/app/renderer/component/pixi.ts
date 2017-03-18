import { AbstractComponent } from './abstract';
import { Component, ElementRef, Output, EventEmitter } from '@angular/core';

import * as PIXI from 'pixi.js';

@Component({
  moduleId: module.id,
  selector: 'pixi',
  templateUrl: 'pixi.html',
  styleUrls: ['pixi.css'],
})
export class PixiComponent extends AbstractComponent {

  app: PIXI.Application;
  canvas: HTMLCanvasElement;
  $canvas: JQuery;
  $parent: JQuery;
  scene: PIXI.Container;

  @Output() resized = new EventEmitter();

  constructor(protected ref: ElementRef) {
    super(ref);
  }

  /**
   * Initializes the
   * @inheritdoc
   */
  ngOnInit() {
    super.ngOnInit();
    this.$canvas = $(this.ref.nativeElement).find('canvas');
    this.$parent = this.$canvas.parent();
    this.canvas = <HTMLCanvasElement>this.$canvas[0];
    this.app = new PIXI.Application(800, 600, {
      view: this.canvas,
      transparent: true,
    });
    this.scene = new PIXI.Container();
    this.app.stage.addChild(this.scene);

    this.onResize();
  }

  onResize() {
    let newWidth = this.$parent.outerWidth();
    let newHeight = this.$parent.outerHeight();
    if (this.app.renderer.width != newWidth || this.app.renderer.height != newHeight) {
      this.app.renderer.resize(newWidth, newHeight);
      this.resized.emit( { width: newWidth, height: newHeight } );
    }
  }
}
