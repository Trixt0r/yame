import { Inject, Injectable, Optional } from '@angular/core';
import { Select } from '@ngxs/store';
import { Asset } from 'common/asset';
import { IPoint } from 'common/math';
import { SceneComponent, SceneEntity } from 'common/scene';
import { SceneAssetConverterService, SceneService, SceneState, SelectState } from 'ng/modules/scene';
import { ToolEvent, ToolInterceptor } from 'ng/modules/toolbar/interceptor';
import { Tool } from 'ng/modules/toolbar/tool';
import { SelectionToolService } from 'ng/modules/toolbar/tools/selection';
import { CursorService } from 'ng/services/cursor.service';
import { merge, Observable, of } from 'rxjs';
import { catchError, take, takeUntil, tap } from 'rxjs/operators';
import { AssetExplorerComponent } from '../components';
import { AssetState } from '../states/asset.state';

@Injectable({ providedIn: 'root' })
export class AddToolService extends Tool {
  settingsMinWidth = 250;

  private mouseLeft = true;

  settingsComponent = AssetExplorerComponent as any;

  previewComponents: SceneComponent[] = [];
  grid: IPoint | null = null;
  mousePressed = false;

  @Select(AssetState.selectedAsset)
  private selectAsset$!: Observable<Asset>;

  @Select(SelectState.entities)
  private selectedEntities$!: Observable<string[]>;

  private onMouseenter: (event: MouseEvent) => void;
  private onMousemove: (event: MouseEvent) => void;
  private onMouseleave: (event: MouseEvent) => void;
  private onMousedown: (event: MouseEvent) => void;
  private onMouseup: (event: MouseEvent) => void;

  private selectedAsset?: Asset;
  private selectedEntities: string[] = [];
  private lastMouseX = 0;
  private lastMouseY = 0;
  private isPreviewActive = false;

  constructor(
    private selection: SelectionToolService,
    private scene: SceneService,
    private converter: SceneAssetConverterService,
    private cursor: CursorService,
    @Optional()
    @Inject(ToolInterceptor.tokenFor(AddToolService))
    interceptors?: ToolInterceptor<MouseEvent, AddToolService>[]
  ) {
    super('add-entity', 'plus-square', 1);
    this.onMouseenter = this.mouseenter.withToolInterceptors(this, interceptors);
    this.onMousemove = this.mousemove.withToolInterceptors(this, interceptors);
    this.onMouseleave = this.mouseleave.withToolInterceptors(this, interceptors);
    this.onMousedown = this.mousedown.withToolInterceptors(this, interceptors);
    this.onMouseup = this.mouseup.withToolInterceptors(this, interceptors);
  }

  createPreview(): void {
    if (!this.selectedAsset || this.isPreviewActive || this.mouseLeft || this.selectedEntities.length > 0) return;
    this.isPreviewActive = true;
    this.scene.createPreview(
      this.lastMouseX,
      this.lastMouseY,
      this.previewComponents.length ? undefined : this.selectedAsset,
      ...this.previewComponents
    );
    requestAnimationFrame(() => this.scene.updatePreview(this.lastMouseX, this.lastMouseY));
  }

  mouseenter(): void {
    if (!this.mouseLeft) return;
    this.mouseLeft = false;
    if (
      this.selectedAsset &&
      (this.converter.has(this.selectedAsset) || this.previewComponents.length) &&
      this.selectedEntities.length <= 0
    )
      this.createPreview();
  }

  mouseleave(left: ToolEvent<MouseEvent> | boolean): void {
    this.scene.removePreview();
    this.mouseLeft = typeof left === 'boolean' ? left : !!left;
    this.isPreviewActive = false;
  }

  mousedown({ origin }: ToolEvent<MouseEvent>): void {
    this.updateMouse(origin);
    const selected = this.selectedEntities.length;
    if (selected > 0) this.selection.mousedown(origin);
    this.mousePressed =
      selected <= 0 && this.selectedEntities.length <= 0 && origin.button === 0 && !this.selection.handledByExternal;
  }

  mouseup({ origin }: ToolEvent<MouseEvent>): void {
    this.updateMouse(origin);
    if (this.selection.handledByExternal) return;
    const wasPressed = this.mousePressed;
    this.mousePressed = false;
    if (!wasPressed || this.selectedEntities.length > 0) return this.selection.mouseup(origin);
    this.addPreview(origin);
  }

  mousemove({ origin }: ToolEvent<MouseEvent>): void {
    this.updateMouse(origin);
    this.createPreview();
    const { x, y } = this.getPoint(origin);
    this.selection.mousemove(origin);
    this.scene.updatePreview(x, y);
  }

  updateMouse(event: MouseEvent): void {
    this.lastMouseX = event.offsetX;
    this.lastMouseY = event.offsetY;
  }

  getPoint(event: MouseEvent): IPoint {
    const point = this.scene.renderer.projectToScene(event.offsetX, event.offsetY);
    return {
      x: typeof this.grid?.x === 'number' ? Math.round(point.x / this.grid.x) * this.grid.x : point.x,
      y: typeof this.grid?.y === 'number' ? Math.round(point.y / this.grid.y) * this.grid.y : point.y,
    };
  }

  addEntity({ x, y }: IPoint): Observable<SceneEntity | null> {
    return this.scene
      .addEntity(x, y, this.previewComponents.length ? undefined : this.selectedAsset, ...this.previewComponents)
      .pipe(
        catchError(() => of(null)),
        take(1)
      );
  }

  addPreview(event: MouseEvent): void {
    this.addEntity(this.getPoint(event)).subscribe(() => this.mouseenter());
  }

  /**
   * @inheritdoc
   */
  override async onActivate(): Promise<void> {
    delete this.selectedAsset;
    this.selectedEntities = [];
    merge(
      this.selectAsset$.pipe(tap(_ => (this.selectedAsset = _))),
      this.selectedEntities$.pipe(
        tap(_ => {
          this.selectedEntities = _;
          if (this.selectedEntities.length > 0) this.mouseleave(this.mouseLeft);
          else this.createPreview();
        })
      )
    )
      .pipe(takeUntil(this.deactivated$))
      .subscribe();

    this.cursor.end();
    this.scene.renderer.component?.ref.nativeElement.addEventListener('mouseenter', this.onMouseenter);
    this.scene.renderer.component?.ref.nativeElement.addEventListener('mousemove', this.onMousemove);
    this.scene.renderer.component?.ref.nativeElement.addEventListener('mouseleave', this.onMouseleave);
    this.scene.renderer.component?.ref.nativeElement.addEventListener('mousedown', this.onMousedown);
    this.scene.renderer.component?.ref.nativeElement.addEventListener('mouseup', this.onMouseup);
  }

  override async onDeactivate(): Promise<void> {
    this.cursor.end();
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mouseenter', this.onMouseenter);
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mousemove', this.onMousemove);
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mouseleave', this.onMouseleave);
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mousedown', this.onMousedown);
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mouseup', this.onMouseup);
  }
}
