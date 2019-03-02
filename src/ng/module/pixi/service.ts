import { PixiAppNotInitializedException } from './exception/service/not-initialized';
import { ElementRef, Injectable, NgZone } from '@angular/core';
import * as PIXI from 'pixi.js';
import { Asset } from '../../../common/asset';
import { PixiAssetConverter } from './service/converter';
import { Map } from './scene/map';
import { Entity } from './scene/entity';
import { Subject, Observable } from 'rxjs/Rx';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { DeleteEntity, UpdateEntity, CreateEntity, EntityAction } from './ngxs/actions';

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
  private internalScene: Map;
  private viewRef: ElementRef;
  private newSize = new PIXI.Point();
  private internalAssetConverter = new PixiAssetConverter();

  private resizeSource = new Subject<PIXI.Point>();
  private readySource = new Subject<void>();
  private disposeSource = new Subject<void>();

  resize$ = this.resizeSource.asObservable();
  ready$ = this.readySource.asObservable();
  dipose$ = this.disposeSource.asObservable();

  constructor(protected zone: NgZone, protected store: Store, protected actions: Actions) {}

  /** @type {PIXI.Application} app The pixi js application instance. */
  get app(): PIXI.Application {
    return this.internalApp;
  }

  /** @type {PIXI.WebGLRenderer | PIXI.CanvasRenderer} renderer The pixi js renderer instance. */
  get renderer(): PIXI.WebGLRenderer | PIXI.CanvasRenderer {
    return this.internalApp.renderer;
  }

  /** @type {Map} scene The scene container. Attach your content there.*/
  get scene(): Map {
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

  /** @type {PixiAssetConverter} The asset converter. */
  get assetConverter(): PixiAssetConverter {
    return this.internalAssetConverter;
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
    this.internalApp = new PIXI.Application(
      viewRef.nativeElement.offsetWidth,
      viewRef.nativeElement.offsetHeight,
      options
    );
    this.internalScene = new Map();
    this.internalApp.stage.addChild(this.internalScene);
    this.readySource.next();
    this.resize();
    if (this.store) {
      this.zone.runOutsideAngular(() => {
        this.actions.pipe(ofActionSuccessful(CreateEntity, UpdateEntity, DeleteEntity))
          .subscribe((action: EntityAction) => {
            if (action instanceof CreateEntity) {
              return this.scene.addEntity(action.entity);
            } else if (action instanceof UpdateEntity) {
              const data = Array.isArray(action.data) ? action.data : [action.data];
              const proms = data.map(d => {
                const found = this.scene.find(entity => d.id === entity.id);
                if (found) return found.apply(d);
              });
              return Promise.all(proms);
            } else if (action instanceof DeleteEntity) {
              const found = this.scene.find(entity => action.id === entity.id);
              if (found) return this.scene.removeEntity(found);
            }
          });
      });
    }
  }

  /**
   * Resizes the pixi renderer based on the canvas' parent dimensions.
   *
   * @returns {(boolean | PIXI.Point)}
   */
  resize(): boolean | PIXI.Point {
    if (!this.viewRef) throw new PixiAppNotInitializedException('Can\'t resize');
    this.newSize.set(this.viewRef.nativeElement.offsetWidth, this.viewRef.nativeElement.offsetHeight);
    if (this.renderer.width !== this.newSize.x || this.renderer.height !== this.newSize.y) {
      this.renderer.resize(this.newSize.x, this.newSize.y);
      this.resizeSource.next(this.newSize);
      return this.newSize;
    }
    return false;
  }

  /**
   * Converts the mouse coordinates from the given mouse event to local scene coordinates.
   *
   * @param {MouseEvent} event The mouse event from which to convert the coordinates.
   * @param {PIXI.PointLike} [target] Optional parameter to store the result in.
   * @returns {PIXI.PointLike}
   */
  toScene(event: MouseEvent | PIXI.PointLike, target?: PIXI.PointLike): PIXI.PointLike {
    if (event instanceof MouseEvent)
      return this.scene.toLocal(<PIXI.PointLike>{ x: event.clientX, y: event.clientY }, void 0, target);
    else return this.scene.toLocal(event, void 0, target);
  }

  /**
   * Creates an entity from the given asset.
   * This is a proxy an alias for `this.assetConverter.get(asset)`.
   *
   * @param {Asset} asset The asset to create the display object from.
   * @returns {Promise<Entity>} Resolves the created entity.
   */
  createFromAsset(asset: Asset): Promise<Entity> {
    return this.internalAssetConverter.get(asset);
  }

  /**
   * Disposes this service
   * @returns {Promise<void>}
   */
  dispose(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.internalApp) throw new PixiAppNotInitializedException('Can\'t dispose!');
        this.internalApp.destroy();
        this.internalApp = null;
        this.disposeSource.next();
        resolve();
      } catch (e) {
        console.warn('An unexpected error occurred while disposing the pixi service', e);
        reject(e);
      }
    });
  }
}
