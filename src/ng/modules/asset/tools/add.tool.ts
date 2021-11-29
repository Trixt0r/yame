import { Injectable } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Asset } from 'common/asset';
import { SceneAssetConverterService, SceneService } from 'ng/modules/scene';
import { Tool } from 'ng/modules/toolbar/tool';
import { SelectionToolService } from 'ng/modules/toolbar/tools/selection';
import { Observable, of } from 'rxjs';
import { catchError, take, takeUntil } from 'rxjs/operators';
import { AssetState } from '../states/asset.state';

@Injectable({ providedIn: 'root' })
export class AddToolService extends Tool {
  private mouseLeft = true;

  @Select(AssetState.selectedAsset)
  private selectAsset$!: Observable<Asset>;

  private selectedAsset?: Asset;
  private onMouseenter: (event: MouseEvent) => void;
  private onMousemove: (event: MouseEvent) => void;
  private onMouseleave: (event: MouseEvent) => void;
  private onClick: (event: MouseEvent) => void;

  constructor(
    // private store: Store,
    // private selection: SelectionToolService,
    private scene: SceneService,
    private converter: SceneAssetConverterService
  ) {
    super('add-entity', 'plus-square', 1);
    this.onMouseenter = this.mouseenter.bind(this);
    this.onMousemove = this.mousemove.bind(this);
    this.onMouseleave = this.mouseleave.bind(this);
    this.onClick = this.click.bind(this);
  }

  mouseenter(event: MouseEvent): void {
    if (!this.mouseLeft || !this.selectedAsset || !this.converter.has(this.selectedAsset)) {
      this.mouseLeft = false;
      return;
    }
    this.mouseLeft = false;
    this.scene.createPreview(event.clientX, event.clientY, this.selectedAsset);
  }

  mouseleave(event: MouseEvent): void {
    this.scene.removePreview();
    this.mouseLeft = true;
  }

  mousemove(event: MouseEvent): void {
    this.scene.updatePreview(event.offsetX, event.offsetY);
  }

  click(event: MouseEvent): void {
    this.scene
      .addEntity(event.offsetX, event.offsetY, this.selectedAsset)
      .pipe(
        catchError((error) => {
          console.log(error);
          return of(null);
        }),
        take(1)
      )
      .subscribe(() => {
        this.mouseenter(event);
      });
  }

  async onActivate(): Promise<void> {
    delete this.selectedAsset;
    this.selectAsset$.pipe(takeUntil(this.deactivated$)).subscribe((asset) => {
      console.log('asset', asset);
      this.selectedAsset = asset;
    });

    this.scene.renderer.component?.ref.nativeElement.addEventListener('mouseenter', this.onMouseenter);
    this.scene.renderer.component?.ref.nativeElement.addEventListener('mousemove', this.onMousemove);
    this.scene.renderer.component?.ref.nativeElement.addEventListener('mouseleave', this.onMouseleave);
    this.scene.renderer.component?.ref.nativeElement.addEventListener('click', this.onClick);
  }

  async onDeactivate(): Promise<void> {
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mouseenter', this.onMouseenter);
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mousemove', this.onMousemove);
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('mouseleave', this.onMouseleave);
    this.scene.renderer.component?.ref.nativeElement.removeEventListener('click', this.onClick);
  }
}
