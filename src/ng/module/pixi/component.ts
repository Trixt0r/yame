import { PixiService } from './service';
import { Component, ElementRef, EventEmitter, HostListener, Output, ViewChild, OnDestroy } from '@angular/core';

import * as PIXI from 'pixi.js';
import { DragDropData } from 'ng2-dnd';
import { Asset } from '../../../common/asset';
import { Entity } from './scene/entity';
import { Layer } from './scene/idx';

/**
 * A pixi component provides a canvas element and initializes the injected pixi service.
 *
 * @export
 * @class PixiComponent
 */
@Component({
  moduleId: module.id.toString(),
  selector: 'pixi',
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
})
export class PixiComponent implements OnDestroy {

  @Output() resized = new EventEmitter();
  @ViewChild('canvas') canvas: ElementRef;

  private preview: PIXI.DisplayObject;
  private dragLeft = false;

  constructor(public ref: ElementRef, public pixiService: PixiService) {
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
    this.pixiService.setUp(this.ref, {
      view: <HTMLCanvasElement>this.canvas.nativeElement,
      transparent: true,
    });
  }

  /** @returns {void} Handler for resizing the canvas. Delegate to the pixi service. */
  @HostListener('window:resize')
  onResize() {
    let newSize;
    if (newSize = this.pixiService.resize())
      this.resized.emit( { width: newSize.x, height: newSize.y } );
  }

  /**
   * The onDrop handler.
   * Creates a new display object by using the pixi service and adds it to the scene at the mouse position.
   *
   * @param {DragDropData} event
   * @returns {Entity}
   */
  onDrop(event: DragDropData): Promise<Entity> {
    var asset: Asset = event.dragData;
    return this.pixiService.createFromAsset(asset)
      .then(entity => {
        return this.pixiService.scene.addEntity(entity)
                .then(() => {
                  entity.position.copy(this.pixiService.toScene(event.mouseEvent));
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
    var asset: Asset = event.dragData;
    return this.pixiService.createFromAsset(asset)
      .then(object => {
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
    var asset: Asset = event.dragData;
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
    this.pixiService.dispose()
      .catch(error => alert(error.message));
  }
}
