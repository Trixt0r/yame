import { PixiService } from './service';
import { Component, ElementRef, EventEmitter, HostListener, Output, ViewChild, OnDestroy, OnInit, NgZone } from '@angular/core';

import * as PIXI from 'pixi.js';
import { DragDropData } from 'ng2-dnd';
import { Asset } from '../../../common/asset';
import { Entity } from './scene/entity';
import { Store } from '@ngxs/store';
import { CreateEntity } from './ngxs/actions';
import { PointLike } from 'pixi.js';

/**
 * A pixi component provides a canvas element and initializes the injected pixi service.
 *
 * @export
 * @class PixiComponent
 */
@Component({
  moduleId: module.id.toString(),
  selector: 'yame-pixi',
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
})
export class PixiComponent implements OnDestroy, OnInit {
  @Output() resized = new EventEmitter();
  @ViewChild('canvas') canvas: ElementRef;

  private preview: PIXI.DisplayObject;
  private dragLeft = false;
  protected onResizeBind: EventListenerObject;

  constructor(public ref: ElementRef,
              public pixiService: PixiService,
              public store: Store,
              public zone: NgZone) {
  this.onResizeBind = this.onResize.bind(this);
  zone.runOutsideAngular(() => window.addEventListener('resize', this.onResizeBind));
  }

  /** @type {PIXI.DisplayObject} The current drag and drop preview. */
  get dndPreview(): PIXI.DisplayObject {
    return this.preview;
  }

  /**
   * Initializes the pixi service.
   * @inheritdoc
   */
  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.pixiService.setUp(this.ref, {
        view: <HTMLCanvasElement>this.canvas.nativeElement,
        transparent: true,
      });
    });
  }

  /** @returns {void} Handler for resizing the canvas. Delegate to the pixi service. */
  onResize() {
    let newSize;
    if ((newSize = this.pixiService.resize()))
      this.resized.emit({ width: newSize.x, height: newSize.y });
  }

  /**
   * The onDrop handler.
   * Creates a new display object by using the pixi service and adds it to the scene at the mouse position.
   *
   * @param {DragDropData} event
   * @returns {Entity}
   */
  onDrop(event: DragDropData): Promise<Entity> {
    const asset: Asset = event.dragData;
    return this.pixiService.createFromAsset(asset)
            .then(entity => {
              this.pixiService.toScene(event.mouseEvent, entity.position);
              return this.store.dispatch(new CreateEntity(entity)).toPromise()
                .then(() => {
                  this.onDragLeave(event);
                  return entity;
                });
            });
  }

  /**
   * The onDragEnter handler.
   * Creates a preview for the dragged asset by using the pixi service.
   *
   * @param {DragDropData} event
   * @returns {Promise<Entity>}
   */
  onDragEnter(event: DragDropData): Promise<Entity> {
    this.dragLeft = false;
    const asset: Asset = event.dragData;
    return this.pixiService.createFromAsset(asset).then(object => {
      if (this.dragLeft) {
        this.dragLeft = false;
        return;
      }
      this.preview = object;
      this.preview.alpha = 0.5;
      this.pixiService.scene.addChild(object); // Do not add it as an entity, since it is just a preview
      object.position.copy(this.pixiService.toScene(event.mouseEvent));
      return object;
    });
  }

  /**
   * The onDragLeave handler.
   * Makes sure that the current preview gets removed from the scene as soon as the drag has been aborted.
   *
   * @param {DragDropData} event
   * @returns {void}
   */
  onDragLeave(event: DragDropData) {
    this.dragLeft = true;
    if (!this.preview) return;
    this.pixiService.scene.removeChild(this.preview);
    delete this.preview;
  }

  /**
   * The onDragOver handler.
   * Makes sure the preview is always placed at the mouse position.
   *
   * @param {DragDropData} event
   * @returns {void}
   */
  onDragOver(event: DragDropData) {
    const asset: Asset = event.dragData;
    if (!this.preview) return;
    this.preview.position.copy(this.pixiService.toScene(event.mouseEvent));
  }

  /**
   * Function for defining whether a drop is allowed or not.
   * For now, only single assets can be dropped.
   *
   * @returns {Function} The function which says `true` or `false`.
   */
  allowDrop(): Function {
    return (event: DragDropData) => {
      return event.dragData instanceof Asset && this.pixiService.assetConverter.has(event.dragData);
    };
  }

  /**
   * Disposes the pixi service.
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.pixiService.dispose().catch(error => alert(error.message));
    this.zone.runOutsideAngular(() => window.removeEventListener('resize', this.onResizeBind));
  }
}
