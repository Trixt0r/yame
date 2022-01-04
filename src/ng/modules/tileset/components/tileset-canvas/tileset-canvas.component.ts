import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Asset } from 'common/asset';
import { IPoint } from 'common/math';
import { Camera } from 'ng/modules/pixi';
import { Application, Container, Graphics, InteractionEvent, Point, Sprite } from 'pixi.js';

const tmpPos = new Point();

@Component({
  selector: 'yame-tileset-canvas',
  templateUrl: './tileset-canvas.component.html',
  styleUrls: ['./tileset-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TilesetCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() asset!: Asset;
  @Input() size: IPoint = { x: 8, y: 8 };
  @Input() spacing: IPoint = { x: 0, y: 0 };
  @Input() offset: IPoint = { x: 0, y: 0 };

  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;

  app?: Application;
  sprite!: Sprite;
  scene = new Container();
  selection = new Graphics();
  camera = new Camera();

  /**
   * Whether track pad mode is active (for notebooks without a mouse).
   */
  trackPad = false;

  /**
   * The mouse button to be pressed for moving the camera.
   */
  mouseMoveButton = 1;

  /**
   * Determines whether the movement session is active.
   */
  get moving(): boolean {
    return !!this.canvas?.nativeElement && this.prevPos !== null;
  }

  get mouse(): IPoint {
    return this.app?.renderer?.plugins.interaction.mouse.global;
  }

  private prevPos: IPoint | null = null;
  private camPos: IPoint | null = null;
  private onMouseWheelBound: (event: WheelEvent) => void = this.onMouseWheel.bind(this);
  private onPointerDownBound: (event: PointerEvent) => void = this.onPointerDown.bind(this);
  private onPointerMoveBound: (event: PointerEvent) => void = this.onPointerMove.bind(this);
  private onPointerUpBound: (event: PointerEvent) => void = this.onPointerUp.bind(this);

  private init(): void {
    this.camera.zoomStep = 0.1;
    this.camera.maxZoom = 20;
    this.camera.attach(this.scene);
    this.app?.render();
  }

  /**
   * Removes all listeners and subscriptions.
   */
  private clearListenersAndSubs() {
    this.canvas!.nativeElement.removeEventListener('mousewheel', this.onMouseWheelBound as any);
    this.canvas!.nativeElement.removeEventListener('pointerdown', this.onPointerDownBound);
  }

  /**
   * Begins the camera movement session.
   */
  private begin(): void {
    if (this.moving) return;
    this.canvas!.nativeElement.setAttribute('style', 'cursor: grabbing !important');
    this.prevPos = this.app!.stage.toLocal(this.mouse) as IPoint;
    this.camPos = { x: this.camera.position?.x ?? 0, y: this.camera.position?.y ?? 0 };
    window.addEventListener('pointermove', this.onPointerMoveBound);
  }

  /**
   * Ends the camera movement session.
   */
  private end(): void {
    this.prevPos = null;
    this.canvas?.nativeElement?.setAttribute('style', '');
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
  }

  /**
   * Handles the mouse wheel event, which causes the camera to zoom.
   *
   * @param event The triggered mouse wheel event.
   */
  onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    if (this.trackPad && !event.ctrlKey) {
      if (!this.moving) this.begin();
      tmpPos.set(
        this.camera.position!.x + event.deltaX * (2 - this.camera.zoom),
        this.camera.position!.y + event.deltaY * (2 - this.camera.zoom)
      );
    } else {
      if (this.moving) this.end();
      this.camera.targetPosition = this.app!.stage!.toLocal(this.mouse);
      this.camera.zoom = event.deltaY < 0 ? this.camera.maxZoom : this.camera.minZoom;
    }
  }

  /**
   * Handles the mouse down event, which starts a camera move, if the right mouse button has been pressed.
   *
   * @param event The triggered mouse down event.
   */
  onPointerDown(event: PointerEvent): void {
    if (this.moving) this.end();
    if (event.button !== this.mouseMoveButton) return; // Only listen for right click
    event.preventDefault();
    window.addEventListener('pointerup', this.onPointerUpBound);
    this.begin();
  }

  /**
   * Handles the mouse up event, which resets the internal data.
   */
  onPointerUp(event: PointerEvent): void {
    if (!this.moving) return; // Only listen for right click
    this.end();
  }

  /**
   * Handles the mouse up event, which makes the camera move.
   *
   * @param event The triggered mouse move event.
   */
  onPointerMove(event: PointerEvent): void {
    if (!this.moving) return this.end(); // Only listen for right click
    const pos = this.app!.stage!.toLocal(this.mouse);
    tmpPos.set(this.camPos!.x + (pos.x - this.prevPos!.x), this.camPos!.y + (pos.y - this.prevPos!.y));
    this.camera.position = { x: tmpPos.x, y: tmpPos.y };
  }

  /**
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    this.clearListenersAndSubs();
    this.canvas!.nativeElement.addEventListener(
      'mousewheel',
      this.onMouseWheelBound as EventListenerOrEventListenerObject,
      {
        capture: true,
      }
    );
    this.canvas!.nativeElement.addEventListener('pointerdown', this.onPointerDownBound);

    this.app = new Application({
      antialias: false,
      clearBeforeRender: true,
      autoStart: false,
      transparent: true,
      view: this.canvas!.nativeElement,
      width: this.canvas!.nativeElement.clientWidth,
      height: this.canvas!.nativeElement.clientHeight,
    });
    this.scene.on('camera:updated', () => this.app?.render());
    this.app.stage.addChild(this.scene);
    this.init();
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(): void {
    this.scene.removeChildren();
    if (this.sprite) this.sprite.destroy();
    this.sprite = Sprite.from(this.asset.resource.uri);
    this.scene.interactive = true;

    const tileWidth = this.size.x + this.spacing.x + this.offset.x;
    const tileHeight = this.size.y + this.spacing.y + this.offset.y;
    this.scene.on('pointermove', (event: InteractionEvent) => {
      this.selection.clear();
      const position = event.data.getLocalPosition(this.selection);
      position.x += -this.offset.x / 2 + this.spacing.x / 2;
      position.y += -this.offset.y / 2 + this.spacing.y / 2;
      this.selection.lineStyle(1, 0x3399bb, 1, 1);
      this.selection.drawRect(
        Math.min(
          this.sprite.texture.width - (this.size.x - this.offset.x),
          Math.max(this.offset.x, this.offset.x + Math.floor(position.x / tileWidth) * tileWidth)
        ),
        Math.min(
          this.sprite.texture.height - (this.size.y - this.offset.y),
          Math.max(this.offset.y, this.offset.y + Math.floor(position.y / tileHeight) * tileHeight)
        ),
        this.size.x,
        this.size.y
      );
      this.app?.render();
    });

    this.scene.addChild(this.sprite, this.selection);
    this.selection.clear();
    this.selection.lineStyle(1, 0x3399bb, 1, 1);
    this.selection.drawRect(this.offset.x, this.offset.y, this.size.x, this.size.y);
    if (!this.sprite.texture.baseTexture.valid) this.sprite.texture.baseTexture.on('update', () => this.init());
    else this.init();
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.camera.detach();
    this.app?.destroy();
  }
}
