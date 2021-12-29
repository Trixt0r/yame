import { Injectable } from '@angular/core';
import { Select } from '@ngxs/store';
import { Asset } from 'common/asset';
import { SceneAssetConverterService, SceneService, SelectState } from 'ng/modules/scene';
import { Tool } from 'ng/modules/toolbar/tool';
import { SelectionToolService } from 'ng/modules/toolbar/tools/selection';
import { merge, Observable, of } from 'rxjs';
import { catchError, take, takeUntil, tap } from 'rxjs/operators';
import { AssetExplorerComponent } from '../components';
import { AssetState } from '../states/asset.state';

@Injectable({ providedIn: 'root' })
export class AddToolService extends Tool {
  settingsMinWidth = 300;

  private mouseLeft = true;

  settingsComponent = AssetExplorerComponent as any;

  @Select(AssetState.selectedAsset)
  private selectAsset$!: Observable<Asset>;

  @Select(SelectState.entities)
  private selectedEntities$!: Observable<string[]>;

  private selectedAsset?: Asset;
  private selectedEntities: string[] = [];
  private onMouseenter: (event: MouseEvent) => void;
  private onMousemove: (event: MouseEvent) => void;
  private onMouseleave: (event: MouseEvent) => void;
  private onMousedown: (event: MouseEvent) => void;
  private onMouseup: (event: MouseEvent) => void;

  private mousePressed = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor(
    // private store: Store,
    private selection: SelectionToolService,
    private scene: SceneService,
    private converter: SceneAssetConverterService
  ) {
    super('add-entity', 'plus-square', 1);
    this.onMouseenter = this.mouseenter.bind(this);
    this.onMousemove = this.mousemove.bind(this);
    this.onMouseleave = this.mouseleave.bind(this);
    this.onMousedown = this.mousedown.bind(this);
    this.onMouseup = this.mouseup.bind(this);
  }

  mouseenter(event: MouseEvent): void {
    if (
      !this.mouseLeft ||
      !this.selectedAsset ||
      !this.converter.has(this.selectedAsset) ||
      this.selectedEntities.length > 0
    ) {
      this.mouseLeft = false;
      return;
    }
    this.mouseLeft = false;
    this.scene.createPreview(event.clientX, event.clientY, this.selectedAsset);
  }

  mouseleave(): void {
    this.scene.removePreview();
    this.mouseLeft = true;
  }

  mousedown(event: MouseEvent): void {
    this.lastMouseX = event.offsetX;
    this.lastMouseY = event.offsetY;
    const selected = this.selectedEntities.length;
    this.selection.mousedown(event);
    this.mousePressed =
      selected <= 0 && this.selectedEntities.length <= 0 && event.button === 0 && !this.selection.handledByExternal;
  }

  mouseup(event: MouseEvent): void {
    this.lastMouseX = event.offsetX;
    this.lastMouseY = event.offsetY;
    if (this.selection.handledByExternal) return;
    this.selection.mouseup(event);
    if (!this.mousePressed || this.selectedEntities.length > 0) return;
    this.mousePressed = false;
    this.addPreview(event);
  }

  mousemove(event: MouseEvent): void {
    this.lastMouseX = event.offsetX;
    this.lastMouseY = event.offsetY;
    this.selection.mousemove(event);
    this.scene.updatePreview(event.offsetX, event.offsetY);
  }

  addPreview(event: MouseEvent): void {
    this.scene
      .addEntity(event.offsetX, event.offsetY, this.selectedAsset)
      .pipe(
        catchError(() => of(null)),
        take(1)
      )
      .subscribe(() => this.mouseenter(event));
  }

  async onActivate(): Promise<void> {
    delete this.selectedAsset;
    this.selectedEntities = [];
    merge(
      this.selectAsset$.pipe(tap(_ => (this.selectedAsset = _))),
      this.selectedEntities$.pipe(
        tap(_ => {
          this.selectedEntities = _;
          if (this.selectedEntities.length > 0) this.mouseleave();
          else if (this.selectedAsset) {
            this.mouseLeft = false;
            this.scene.createPreview(this.lastMouseX, this.lastMouseY, this.selectedAsset);
            requestAnimationFrame(() => this.scene.updatePreview(this.lastMouseX, this.lastMouseY));
          }
        })
      )
    )
      .pipe(takeUntil(this.deactivated$))
      .subscribe();

    this.scene.renderer.component?.ref.nativeElement.addEventListener('mouseenter', this.onMouseenter);
    this.scene.renderer.component?.ref.nativeElement.addEventListener('mousemove', this.onMousemove);
    this.scene.renderer.component?.ref.nativeElement.addEventListener('mouseleave', this.onMouseleave);
    this.scene.renderer.component?.ref.nativeElement.addEventListener('mousedown', this.onMousedown);
    this.scene.renderer.component?.ref.nativeElement.addEventListener('mouseup', this.onMouseup);
  }

  async onDeactivate(): Promise<void> {
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mouseenter', this.onMouseenter);
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mousemove', this.onMousemove);
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mouseleave', this.onMouseleave);
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mousedown', this.onMousedown);
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mouseup', this.onMouseup);
  }
}
