import { PixiAppNotInitializedException } from './exception/service/not-initialized';
import { Grid } from './utils/grid';
import { Camera } from './utils/camera';
import { ElementRef, Injectable } from '@angular/core';
import * as PIXI from 'pixi.js';

/**
 * The pixi service is responsible for setting up a pixi js application.
 * The service needs to be initialized with the PixiService#setUp method.
 * Preferably in the ngOnInit method of your (pixi js) component.
 * Furthermore it provides utility methods such as rendering a grid in the scene
 * and attaching a camera to it.
 * @todo: Log stuff
 * @export
 * @class PixiService
 */
@Injectable()
export class PixiService {

  private internalApp: PIXI.Application;
  private internalScene: PIXI.Container;
  private internalCam: Camera;
  private internalGrid: Grid;
  private viewRef: ElementRef;
  private newSize = new PIXI.Point();

  /** @type {PIXI.Application} app The pixi js application instance. */
  get app(): PIXI.Application {
    return this.internalApp;
  }

  /** @type {PIXI.WebGLRenderer | PIXI.CanvasRenderer} renderer The pixi js renderer instance. */
  get renderer(): PIXI.WebGLRenderer | PIXI.CanvasRenderer {
    return this.internalApp.renderer;
  }

  /** @type {PIXI.Container} scene The scene container. Attach your content there.*/
  get scene(): PIXI.Container {
    return this.internalScene;
  }

  /** @type {PIXI.Container} stage The stage container. The root container.*/
  get stage(): PIXI.Container {
    return this.internalApp.stage;
  }

  /** @type {HTMLCanvasElement} view The canvas element.*/
  get view(): HTMLCanvasElement {
    return this.internalApp.view;
  }

  /** @type {PIXI.ticker.Ticker} ticker The pixi js ticker, i.e. main loop.*/
  get ticker(): PIXI.ticker.Ticker {
    return this.internalApp.ticker;
  }

  /** @type {PIXI.Rectangle} screen The pixi js scree, i.e. current dimensions.*/
  get screen(): PIXI.Rectangle {
    return this.internalApp.screen;
  }

  /** @type {Camera} camera The attached camera. Maybe `null`.*/
  get camera(): Camera {
    return this.internalCam;
  }

  /** @type {Grid} camera The rendered grid. Maybe `null`.*/
  get grid(): Grid {
    return this.internalGrid;
  }

  /**
   * Initializes a pixi js application.
   * Call this method can only be called one.
   *
   * @param {number} width
   * @param {number} height
   * @param {PIXI.ApplicationOptions} options
   */
  setUp(viewRef: ElementRef, options: PIXI.ApplicationOptions) {
    if (this.internalApp) return;
    this.viewRef = viewRef;
    this.internalApp = new PIXI.Application(viewRef.nativeElement.offsetWidth,
                                            viewRef.nativeElement.offsetHeight,
                                            options);
    this.internalScene = new PIXI.Container();
    this.internalApp.stage.addChild(this.internalScene);
    this.resize();
  }

  /**
   * Resizes the pixi renderer based on the canvas' parent dimensions.
   *
   * @returns {(boolean | PIXI.Point)}
   */
  resize(): boolean | PIXI.Point {
    if (!this.viewRef) throw new PixiAppNotInitializedException("Can't resize");
    this.newSize.set(this.viewRef.nativeElement.offsetWidth, this.viewRef.nativeElement.offsetHeight);
    if (this.renderer.width != this.newSize.x || this.renderer.height != this.newSize.y) {
      this.renderer.resize(this.newSize.x, this.newSize.y);
      if (this.internalGrid)
        this.internalGrid.update(this.newSize.x, this.newSize.y);
      return this.newSize;
    }
    return false;
  }
}
