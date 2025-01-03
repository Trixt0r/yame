import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { Asset } from 'common/asset';
import { IPoint } from 'common/math';
import { DestroyLifecycle } from 'ng/modules/utils';
import { CameraState, CameraZoom, ICameraState, UpdateCameraPosition, UpdateCameraZoom } from 'ng/modules/camera';
import { Camera } from 'ng/modules/pixi';
import { Application, Container, Graphics, InteractionEvent, Point, Rectangle, Sprite } from 'pixi.js';
import { Observable, takeUntil } from 'rxjs';
import { uniqBy } from 'lodash';

const CAMERA_ID = 'tileset';

const app = new Application({
  antialias: false,
  clearBeforeRender: true,
  autoStart: false,
  backgroundAlpha: 0,
});

@Component({
    selector: 'yame-tileset-canvas',
    templateUrl: './tileset-canvas.component.html',
    styleUrls: ['./tileset-canvas.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [DestroyLifecycle],
    standalone: false
})
export class TilesetCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() set asset(value: Asset) {
    if (this._asset?.id === value.id) return;
    this._asset = value;
    if (this.sprite) this.sprite.destroy();
    this.sprite = Sprite.from(value.resource.uri);
    this.scene.removeChildren();
    this.scene.addChild(this.sprite, this.grid, this.selection, this.preview);
  }
  @Input() size: IPoint = { x: 8, y: 8 };
  @Input() spacing: IPoint = { x: 0, y: 0 };
  @Input() offset: IPoint = { x: 0, y: 0 };

  @ViewChild('canvas') canvas?: ElementRef<HTMLDivElement>;

  @Select(CameraState.zoom(CAMERA_ID)) zoom$!: Observable<CameraZoom>;
  @Select(CameraState.position(CAMERA_ID)) position$!: Observable<IPoint>;

  previewColor = 0x0055ff; // 0x3399bb
  selectionColor = 0xffffff;

  app = app;
  sprite!: Sprite;
  scene = new Container();
  selection = new Graphics();
  preview = new Graphics();
  grid = new Graphics();
  camera = new Camera();
  observer = new ResizeObserver(() => {
    if (!this.app) return;
    this.app.resize();
    (this.app.stage.hitArea as Rectangle).width = this.app.renderer.width;
    (this.app.stage.hitArea as Rectangle).height = this.app.renderer.height;
    this.app.render();
  });
  @Input() selections: IPoint[] = [{ x: 0, y: 0 }];
  @Output() selectionsChange = new EventEmitter<IPoint[]>();

  get mouse(): IPoint {
    return this.app.renderer.plugins.interaction.mouse.global;
  }

  readonly cameraId = CAMERA_ID;

  private tileWidth = this.size.x + this.spacing.x + this.offset.x;
  private tileHeight = this.size.y + this.spacing.y + this.offset.y;
  private centered = false;
  private downPos: IPoint | null = null;
  private _asset?: Asset;

  constructor(private store: Store, private actions: Actions, private destroy$: DestroyLifecycle) {}

  private init(): void {
    this.camera.attach(this.scene);

    const state = this.store.selectSnapshot(_ => _.camera) as ICameraState;
    const zoom = CameraState.zoom(CAMERA_ID)(state);

    if (!state.cameras.some(_ => _.id === CAMERA_ID)) {
      this.camera.zoomStep = zoom.step;
      this.camera.maxZoom = zoom.max;
      this.camera.minZoom = zoom.min;
      this.center();
    } else {
      const position = CameraState.position(CAMERA_ID)(state);
      this.updateCameraZoom(zoom);
      this.camera.position = position;
    }
    this.app.render();
  }

  private fix(from: IPoint, to: IPoint): void {
    if (to.x < from.x) {
      const x = to.x;
      to.x = from.x;
      from.x = x;
    }
    if (to.y < from.y) {
      const y = to.y;
      to.y = from.y;
      from.y = y;
    }
  }

  private getSelection(from: IPoint, to: IPoint): [IPoint, IPoint] {
    from = { x: from.x, y: from.y };
    to = { x: to.x, y: to.y };
    from.x += -this.offset.x / 2 + this.spacing.x / 2;
    from.y += -this.offset.y / 2 + this.spacing.y / 2;
    to.x += -this.offset.x / 2 + this.spacing.x / 2;
    to.y += -this.offset.y / 2 + this.spacing.y / 2;
    this.fix(from, to);

    const hCount = Math.ceil((this.sprite.texture.width - this.offset.x) / this.tileWidth) - 1;
    const vCount = Math.ceil((this.sprite.texture.height - this.offset.y) / this.tileHeight) - 1;
    const x = Math.min(
      this.offset.x + hCount * this.tileWidth,
      Math.max(this.offset.x, this.offset.x + Math.floor(from.x / this.tileWidth) * this.tileWidth)
    );
    const y = Math.min(
      this.offset.y + vCount * this.tileHeight,
      Math.max(this.offset.y, this.offset.y + Math.floor(from.y / this.tileHeight) * this.tileHeight)
    );

    const xx = Math.min(
      this.offset.x + hCount * this.tileWidth + this.tileWidth,
      Math.max(this.offset.x + this.size.x, this.offset.x + (1 + Math.floor(to.x / this.tileWidth)) * this.tileWidth)
    );
    const yy = Math.min(
      this.offset.y + vCount * this.tileHeight + this.tileHeight,
      Math.max(this.offset.y + this.size.y, this.offset.y + (1 + Math.floor(to.y / this.tileHeight)) * this.tileHeight)
    );
    return [
      { x, y },
      { x: xx, y: yy },
    ];
  }

  private center(): void {
    if (this.centered || !this.app || !this.sprite.texture.valid) return;
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

    this.store.dispatch(new UpdateCameraZoom(CAMERA_ID, { value, step }));

    this.centered = true;
  }

  private renderPreview(point: IPoint): void {
    this.preview.clear();

    if (!this.tileWidth || !this.tileHeight) return;

    const from = this.sprite.toLocal(this.downPos ?? point);
    const to = this.sprite.toLocal(point);
    const [start, end] = this.getSelection(from, to);

    const width = Math.max(end.x - start.x - this.offset.x - this.spacing.x, this.size.x);
    const height = Math.max(end.y - start.y - this.offset.y - this.spacing.y, this.size.y);
    this.preview.lineStyle(1, this.previewColor, 1, 1);
    this.preview.fill.color = this.previewColor;
    this.preview.fill.alpha = 0.25;
    this.preview.fill.visible = true;
    this.renderSelections(this.getSelections(start, end), this.preview);
    this.preview.fill.reset();
    this.preview.drawRect(start.x, start.y, width, height);

    this.app.render();
  }

  private getSelections(from: IPoint, to: IPoint): IPoint[] {
    const selections: IPoint[] = [];
    const xOffset = Math.floor(from.x / this.tileWidth);
    const yOffset = Math.floor(from.y / this.tileHeight);
    const xCount = Math.floor((to.x - from.x) / this.tileWidth) + xOffset;
    const yCount = Math.floor((to.y - from.y) / this.tileHeight) + yOffset;

    for (let x = Math.floor(from.x / this.tileWidth); x < xCount; x += 1) {
      for (let y = Math.floor(from.y / this.tileHeight); y < yCount; y += 1) {
        selections.push({ x, y });
      }
    }
    return selections;
  }

  private renderSelections(selections: IPoint[], target: Graphics): void {
    const xCount = Math.floor((this.sprite.texture.width - this.offset.x) / this.tileWidth);
    const yCount = Math.floor((this.sprite.texture.height - this.offset.y) / this.tileHeight);
    const xMax = this.offset.x + xCount * this.tileWidth;
    const yMax = this.offset.y + yCount * this.tileHeight;
    for (let i = 0; i < selections.length; i++) {
      const { x, y } = selections[i];
      const xx = this.offset.x + x * this.tileWidth;
      const yy = this.offset.y + y * this.tileHeight;
      if (xx > xMax || yy > yMax) continue;
      target.drawRect(xx, yy, this.size.x, this.size.y);
    }
  }

  private renderGrid(): void {
    this.grid.clear();

    const width = this.size.x;
    const height = this.size.y;

    if (!width || !height) return;

    this.grid.lineStyle(1, 0x333333, 0.75, 1);
    const xStep = this.tileWidth;
    const yStep = this.tileHeight;

    for (let x = this.offset.x; x < this.sprite.texture.width; x += xStep) {
      for (let y = this.offset.y; y < this.sprite.texture.height; y += yStep) {
        this.grid.drawRect(x, y, width, height);
      }
    }
  }

  private updateCameraZoom(zoom: CameraZoom): void {
    (this.camera.targetPosition as Point).copyFrom(zoom.target);
    this.camera.minZoom = zoom.min ?? this.camera.minZoom;
    this.camera.maxZoom = zoom.max ?? this.camera.maxZoom;
    const step = zoom.step ?? this.camera.zoomStep;
    this.camera.zoomStep = Math.abs(this.camera.zoom - zoom.value);
    this.camera.zoom = zoom.value;
    this.camera.zoomStep = step;
  }

  /**
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    this.app = app;
    this.app.resizeTo = this.canvas!.nativeElement;
    this.app.stage.interactive = true;
    this.app.stage.hitArea = new Rectangle(0, 0, this.app.renderer.width, this.app.renderer.height);
    this.observer.observe(this.canvas!.nativeElement);
    this.scene.on('camera:updated', () => this.app.render());
    this.app.stage.addChild(this.scene);
    this.canvas?.nativeElement.appendChild(this.app.view);

    this.init();

    let firstRun = true;

    this.zoom$.pipe(takeUntil(this.destroy$)).subscribe(zoom => {
      this.updateCameraZoom(zoom);
      if (firstRun) {
        firstRun = false;
        return;
      }
      const pos = { x: this.camera.position?.x ?? 0, y: this.camera.position?.y ?? 0 } as IPoint;
      this.store.dispatch(new UpdateCameraPosition(CAMERA_ID, pos));
    });

    this.actions
      .pipe(ofActionSuccessful(UpdateCameraPosition), takeUntil(this.destroy$))
      .subscribe((action: UpdateCameraPosition) => {
        if (action.id === CAMERA_ID) this.camera.position = action.position;
      });

    this.app.stage.on('pointerdown', (event: InteractionEvent) => {
      if (event.data.button !== 0) return;
      this.downPos = { x: event.data.global.x, y: event.data.global.y };
    });

    this.app.stage.on('pointermove', (event: InteractionEvent) => this.renderPreview(event.data.global));

    this.app.stage.on('pointerup', (event: InteractionEvent) => {
      if (!this.downPos) return;

      const resetSelection = !event.data.originalEvent.shiftKey && !event.data.originalEvent.ctrlKey;
      const toggleSelection = event.data.originalEvent.ctrlKey;

      const from = this.sprite.toLocal(this.downPos);
      const to = this.sprite.toLocal(event.data.global);
      let selections = this.getSelections(...this.getSelection(from, to));
      if (resetSelection) {
        this.selections = selections;
      } else {
        const prevSelections = [...this.selections];
        let toRemove: IPoint[] = [];
        if (toggleSelection) {
          toRemove = prevSelections.filter(({ x, y }) => selections.some(_ => _.x === x && _.y === y));
        }
        this.selections = uniqBy([...prevSelections, ...selections], ({ x, y }) => `${x},${y}`).filter(
          ({ x, y }) => !toRemove.some(_ => _.x === x && _.y === y)
        );
      }

      this.selectionsChange.emit(this.selections);

      this.selection.clear();
      this.selection.lineStyle(1, this.selectionColor, 1, 1);
      this.selection.fill.visible = true;
      this.selection.fill.color = this.selectionColor;
      this.selection.fill.alpha = 0.25;
      this.renderSelections(this.selections, this.selection);

      this.downPos = null;
    });
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.tileWidth = this.size.x + this.spacing.x + this.offset.x;
    this.tileHeight = this.size.y + this.spacing.y + this.offset.y;

    this.renderGrid();

    this.selection.clear();
    this.selection.lineStyle(1, this.selectionColor, 1, 1);
    this.selection.fill.visible = true;
    this.selection.fill.color = this.selectionColor;
    this.selection.fill.alpha = 0.25;
    this.renderSelections(this.selections, this.selection);

    this.app.render();

    if (this.centered && changes.asset) this.centered = false;
    if (this.sprite.texture.baseTexture.valid) return this.init();
    this.sprite.texture.baseTexture.on('update', () => {
      this.centered = false;
      this.renderGrid();
      this.init();
    });
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.observer.disconnect();
    this.camera.detach();
    this.app.stage.removeAllListeners();
    this.app.stage.removeChildren();
  }
}
