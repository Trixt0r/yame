import { PixiService } from './service';
import { AbstractComponent } from '../../component/abstract';
import { Component, ElementRef, Output, EventEmitter } from '@angular/core';

import * as PIXI from 'pixi.js';

/**
 * A pixi component provides a canvas element and initializes the injected pixi service.
 *
 * @export
 * @class PixiComponent
 * @extends {AbstractComponent}
 */
@Component({
  moduleId: module.id,
  selector: 'pixi',
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
})
export class PixiComponent extends AbstractComponent {

  @Output() resized = new EventEmitter();

  constructor(protected ref: ElementRef, protected pixiService: PixiService) {
    super(ref);
  }

  /**
   * Initializes the pixi service.
   * @inheritdoc
   */
  ngOnInit() {
    super.ngOnInit();
    let $parent = this.$('canvas').parent();
    this.pixiService.setUp($parent.outerWidth(), $parent.outerHeight(), {
      view: <HTMLCanvasElement>this.$('canvas')[0],
      transparent: true,
    });
  }

  /** @returns {void} Handler for resizing the canvas. Delegate to the pixi service. */
  onResize() {
    let newSize;
    if (newSize = this.pixiService.resize())
      this.resized.emit( { width: newSize.x, height: newSize.y } );
  }
}
