import { PixiAppNotInitializedException } from './exception/service/not-initialized';
import { ElementRef, Injectable } from '@angular/core';
import * as PIXI from 'pixi.js';
import { Asset } from '../../../common/asset';
import { ImageAsset } from 'common/asset/image';

/**
 * The pixi service is responsible for setting up a pixi js application.
 * The service needs to be initialized with the PixiService#setUp method.
 * Preferably in the ngOnInit method of your (pixi js) component.
 * @todo: Log stuff
 * @export
 * @class PixiService
 */
@Injectable()
export class PixiService {

  private internalApp: PIXI.Application;
  private internalScene: PIXI.Container;
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
      return this.newSize;
    }
    return false;
  }

  /**
   * Converts the mouse coordinates from the given mouse event to local scene coordinates.
   *
   * @param {MouseEvent} event The mouse event from which to convert the coordinates.
   * @param {PIXI.PointLike} [point] Optional parameter to store the result
   * @returns {PIXI.PointLike}
   */
  toScene(event: MouseEvent, point?: PIXI.PointLike): PIXI.PointLike {
    return this.scene.toLocal(<PIXI.PointLike>{ x: event.clientX, y: event.clientY }, void 0, point);
  }

  /**
   * Creates a display object from the given asset.
   * For now we only know how to create sprites from image assets.
   *
   * @todo Make this more generic, so other modules can provide implementations for different assets.
   * @param {Asset} asset The asset to create the display object from.
   * @returns {PIXI.DisplayObject} The created display object
   */
  createFromAsset(asset: Asset): Promise<PIXI.DisplayObject> {
    if (!(asset instanceof ImageAsset))
      return Promise.reject(new Error(`Asset of type '${asset.type}' is not supported`));
    let sprite = new PIXI.Sprite(PIXI.Texture.fromImage(asset.content.path));
    sprite.anchor.set(0.5);
    let baseTexture = sprite.texture.baseTexture;
    if (baseTexture.hasLoaded)
      return Promise.resolve(sprite);
    else if (baseTexture.isLoading)
      {
      return new Promise((resolve, reject) => {
        baseTexture.once('loaded', () => {
          baseTexture.off('error', null, this);
          resolve(sprite);
        }, this);
        baseTexture.once('error', e => {
          baseTexture.off('loaded', null, this);
          reject(e);
        }, this);
      });
      }
    else
      return Promise.reject(new Error('Texture for ' + asset.content.path + 'could not be created'));
  }
}
