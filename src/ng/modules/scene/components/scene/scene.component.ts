import {
  Component,
  OnChanges,
  ElementRef,
  SimpleChanges,
  Input,
  ViewChild,
  AfterViewInit,
  ViewContainerRef,
  HostListener,
} from '@angular/core';
import { SceneService } from '../../services/scene.service';
import { DragDropData } from 'ng2-dnd';
import { SceneEntityData } from 'common/scene';
import { Asset } from 'common/asset';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SceneAssetConverterService } from '../../services/converter.service';

@Component({
  selector: 'yame-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss'],
})
export class SceneComponent implements OnChanges, AfterViewInit {
  /**
   * The view port width of the scene.
   */
  @Input() width!: number;

  // /**
  //  * The view port height of the scene.
  //  */
  // @Input() height!: number;

  get height(): number {
    return this.ref.nativeElement.getBoundingClientRect().height;
  }

  /**
   * The wrapper element.
   * Add the rendered data, e.g. a canvas element, to this element.
   */
  @ViewChild('wrapper', { static: true }) public readonly wrapper!: ElementRef<HTMLElement>;

  /**
   * Reference to the bound window resize handler.
   *
   * @protected
   * @type {EventListenerObject}
   */
  protected onResizeBind: () => void;

  /**
   * Whether the user left the drop zone, i.e. the component.
   *
   * @private
   */
  private dragLeft: boolean = true;

  constructor(
    public readonly ref: ElementRef<HTMLElement>,
    public readonly viewContainerRef: ViewContainerRef,
    protected service: SceneService,
    protected converter: SceneAssetConverterService
  ) {
    this.onResizeBind = this.onResize.bind(this);
  }

  /**
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    this.service.renderer.component = this;
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
    let changed = false;
    if (changes.width) {
      this.ref.nativeElement.style.width = `${changes.width.currentValue}px`;
      changed = true;
    }

    // if (changes.height) {
    //   this.ref.nativeElement.style.height = `${changes.height.currentValue}px`;
    //   changed = true;
    // }

    if (changed) this.onResize();
  }

  /**
   * Handler for resizing the scene view port.
   *
   * @returns {void}
   */
  @HostListener('window:resize')
  onResize() {
    this.service.setSize(this.width, this.height);
  }

  /**
   * Creates a new entity by using the scene service.
   * The entity will be created at the user's mouse position.
   *
   * @param {DragDropData} event
   * @returns {Entity}
   */
  onDrop(event: DragDropData): void {
    const asset: Asset = event.dragData;
    const mouseEvent = event.mouseEvent;
    const sub = this.service
      .addEntity(mouseEvent.offsetX, mouseEvent.offsetY, asset)
      .pipe(
        catchError((error) => {
          console.log(error);
          return of(null);
        })
      )
      .subscribe(() => {
        this.onDragLeave(event);
        sub.unsubscribe();
      });
  }

  /**
   * Creates a preview for the dragged asset by using the scene service.
   *
   * @param {DragDropData} event
   */
  async onDragEnter(event: DragDropData): Promise<SceneEntityData | void> {
    if (!this.dragLeft) {
      this.dragLeft = false;
      return;
    }
    this.dragLeft = false;
    const asset: Asset = event.dragData;
    const mouseEvent = event.mouseEvent;
    this.service.createPreview(mouseEvent.clientX, mouseEvent.clientY, asset);
  }

  /**
   * Makes sure that the current preview gets removed from the scene as soon as the drag has been aborted.
   *
   * @param {DragDropData} event
   * @returns {void}
   */
  onDragLeave(event: DragDropData) {
    this.service.removePreview();
    this.dragLeft = true;
  }

  /**
   * Makes sure the preview is always placed at the mouse position.
   *
   * @param {DragDropData} event
   * @returns {void}
   */
  onDragOver(event: DragDropData) {
    const mouseEvent = event.mouseEvent;
    this.service.updatePreview(mouseEvent.offsetX, mouseEvent.offsetY);
  }

  /**
   * Function for defining whether a drop is allowed or not.
   * For now, only single assets can be dropped.
   *
   * @returns {Function} The function which says `true` or `false`.
   */
  allowDrop(): Function {
    return (event: DragDropData) => {
      return event.dragData instanceof Asset && this.converter.has(event.dragData);
    };
  }
}
