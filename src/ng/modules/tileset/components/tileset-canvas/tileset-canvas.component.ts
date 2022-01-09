import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { Asset } from 'common/asset';
import { IPoint } from 'common/math';
import { CameraState, CameraZoom, UpdateCameraPosition } from 'ng/modules/camera';
import { Camera } from 'ng/modules/pixi';
import { Application, Container, Graphics, InteractionEvent, Point, Sprite } from 'pixi.js';
import { Observable } from 'rxjs';

const CAMERA_ID = 'tileset';

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

  @Select(CameraState.zoom(CAMERA_ID)) zoom$!: Observable<CameraZoom>;
  @Select(CameraState.position(CAMERA_ID)) position$!: Observable<IPoint>;

  app?: Application;
  sprite!: Sprite;
  scene = new Container();
  selection = new Graphics();
  camera = new Camera();
  observer = new ResizeObserver(() => {
    this.app?.resize();
    this.app?.render();
  });

  get mouse(): IPoint {
    return this.app?.renderer?.plugins.interaction.mouse.global;
  }

  readonly cameraId = CAMERA_ID;

  private tileWidth = this.size.x + this.spacing.x + this.offset.x;
  private tileHeight = this.size.y + this.spacing.y + this.offset.y;
  private prevPos: IPoint | null = null;
  private centered = false;
  private downPos: IPoint | null = null;

  constructor(private store: Store, private actions: Actions) {}

  private init(): void {
    this.camera.zoomStep = 0.1;
    this.camera.maxZoom = 10;
    this.camera.attach(this.scene);

    this.center();

    this.app?.render();
  }

  private center(): void {
    if (this.centered || !this.app) return;
    const bounds = this.sprite.getLocalBounds();
    const step = this.camera.zoomStep;
    const value = Math.min(this.app.renderer.width / bounds.width, this.app.renderer.height / bounds.height);
    this.camera.zoomStep = Math.abs(this.camera.zoom - value);
    this.camera.zoom = value;
    this.camera.position = { x: 0, y: 0 };

    const stageBounds = this.sprite.getBounds();
    const widthDiff = this.app.renderer.width - stageBounds.width;
    const heightDiff = this.app.renderer.height - stageBounds.height;
    this.camera.position = {
      x: widthDiff - (stageBounds.x + widthDiff / 2),
      y: heightDiff - (stageBounds.y + heightDiff / 2),
    };

    this.camera.zoomStep = step;
    this.camera.zoom = value;
    this.centered = true;
  }

  private preview(point: IPoint): void {
    this.selection.clear();
    const position = this.selection.toLocal(this.downPos ?? point);
    position.x += -this.offset.x / 2 + this.spacing.x / 2;
    position.y += -this.offset.y / 2 + this.spacing.y / 2;

    const pos = this.selection.toLocal(point);
    pos.x += -this.offset.x / 2 + this.spacing.x / 2;
    pos.y += -this.offset.y / 2 + this.spacing.y / 2;

    if (pos.x < position.x) {
      const x = pos.x;
      pos.x = position.x;
      position.x = x;
    }
    if (pos.y < position.y) {
      const y = pos.y;
      pos.y = position.y;
      position.y = y;
    }

    this.selection.lineStyle(1, 0x3399bb, 1, 1);

    const x = Math.min(
      this.sprite.texture.width - (this.size.x - this.offset.x),
      Math.max(this.offset.x, this.offset.x + Math.floor(position.x / this.tileWidth) * this.tileWidth)
    );
    const y = Math.min(
      this.sprite.texture.height - (this.size.y - this.offset.y),
      Math.max(this.offset.y, this.offset.y + Math.floor(position.y / this.tileHeight) * this.tileHeight)
    );

    const xx = Math.min(
      this.sprite.texture.width + this.tileWidth - (this.size.x - this.offset.x),
      Math.max(this.offset.x, this.offset.x + (1 + Math.floor(pos.x / this.tileWidth)) * this.tileWidth)
    );
    const yy = Math.min(
      this.sprite.texture.height + this.tileHeight - (this.size.y - this.offset.y),
      Math.max(this.offset.y, this.offset.y + (1 + Math.floor(pos.y / this.tileHeight)) * this.tileHeight)
    );

    const width = xx - x - this.spacing.x - this.offset.x;
    const height = yy - y - this.spacing.y - this.offset.y;

    this.selection.drawRect(x, y, width, height);
    this.app?.render();
  }

  /**
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    this.app = new Application({
      antialias: false,
      clearBeforeRender: true,
      autoStart: false,
      transparent: true,
      resizeTo: this.canvas!.nativeElement,
      view: this.canvas!.nativeElement,
      width: this.canvas!.nativeElement.clientWidth,
      height: this.canvas!.nativeElement.clientHeight,
    });
    this.observer.observe(this.canvas!.nativeElement);
    this.scene.on('camera:updated', () => this.app?.render());
    this.app.stage.addChild(this.scene);
    this.init();

    this.zoom$.subscribe(zoom => {
      (this.camera.targetPosition as Point).copyFrom(zoom.target);
      this.camera.minZoom = zoom.min ?? this.camera.minZoom;
      this.camera.maxZoom = zoom.max ?? this.camera.maxZoom;
      this.camera.zoomStep = zoom.step ?? this.camera.zoomStep;
      this.camera.zoom = zoom.value;
      const pos = { x: this.camera.position?.x ?? 0, y: this.camera.position?.y ?? 0 } as IPoint;
      this.store.dispatch(new UpdateCameraPosition(CAMERA_ID, pos));
    });
    this.actions.pipe(ofActionSuccessful(UpdateCameraPosition)).subscribe((action: UpdateCameraPosition) => {
      if (action.id === CAMERA_ID) this.camera.position = action.position;
    });
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.scene.removeChildren();
    if (this.sprite) this.sprite.destroy();
    this.sprite = Sprite.from(this.asset.resource.uri);
    this.scene.interactive = true;

    this.tileWidth = this.size.x + this.spacing.x + this.offset.x;
    this.tileHeight = this.size.y + this.spacing.y + this.offset.y;
    this.scene.on('pointerdown', (event: InteractionEvent) => {
      if (event.data.button !== 0) return;
      this.downPos = { x: event.data.global.x, y: event.data.global.y };
    });
    this.scene.on('pointermove', (event: InteractionEvent) => this.preview(event.data.global));
    this.scene.on('pointerup', () => (this.downPos = null));

    this.scene.addChild(this.sprite, this.selection);
    this.preview({ x: 0, y: 0 });

    if (this.centered && changes.asset) this.centered = false;
    if (this.sprite.texture.baseTexture.valid) return this.init();
    this.sprite.texture.baseTexture.on('update', () => {
      this.centered = false;
      this.init();
    });
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.observer.disconnect();
    this.camera.detach();
    this.app?.destroy();
  }
}
