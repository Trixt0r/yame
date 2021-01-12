import { Component, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { AbstractTypeComponent } from '../abstract';
import { AssetSceneComponent as AssetComponent } from 'common/scene/component/asset';
import { DragDropData } from 'ng2-dnd';
import { Asset } from 'common/asset';
import { AssetState } from 'ng/modules/asset/states/asset.state';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ScanResource } from 'ng/modules/asset/states/actions/asset.action';
import { TranslateService } from '@ngx-translate/core';

@Component({
  templateUrl: 'asset.component.html',
  styleUrls: ['../style.scss', 'asset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetTypeComponent<T extends AssetComponent> extends AbstractTypeComponent<T> implements OnChanges {
  static readonly type: string = 'asset';

  /**
   * A list of all assets for the current asset type.
   */
  protected allAssets: Asset[] = [];

  loading = false;

  /**
   * The current index.
   */
  currentIndex: number = 0;

  assetBuffer: Asset[] = [];

  bufferSize = 25;
  bufferThreshold = 10;

  @Select(AssetState.assets) assets$!: Observable<Asset[]>;

  /**
   * The current asset instance.
   */
  get currentAsset(): Asset | null {
    return this.currentIndex >= 0 ? this.allAssets[this.currentIndex] : null;
  }

  /**
   * The currently selected asset value.
   */
  get selected(): string | null | undefined {
    return this.component?.mixed ? null : this.component?.asset;
  }

  set selected(id: string | null | undefined) {
    if (!this.component || (this.component && this.component.asset === id)) return;
    const data = {
      originalEvent: null,
      value: id,
      component: this.component,
    };
    this.currentIndex = id ? this.allAssets.findIndex((it) => it.id === id) : -1;
    const asset = this.allAssets[this.currentIndex];
    if (!this.component) return;
    this.component.asset = asset ? id : null;
    delete this.component.mixed;
    this.cdr.detectChanges();
    this.updateEvent.emit(data);
  }

  constructor(
    protected translate: TranslateService,
    protected cdr: ChangeDetectorRef,
    protected zone: NgZone,
    protected store: Store
  ) {
    super(translate);
    zone.runOutsideAngular(() => {
      this.assets$.pipe(takeUntil(this.destroy$)).subscribe((assets) => {
        this.allAssets = assets;
        this.assetBuffer.slice().forEach((it) => {
          const found = this.allAssets.find((asset) => asset.id === it.id);
          if (found) return;
          const idx = this.assetBuffer.indexOf(it);
          if (idx >= 0) this.assetBuffer.splice(idx, 1);
        });
        this.updateAssetBuffer();
        this.cdr.markForCheck();
      });
    });
  }

  /**
   * Updates the asset buffer.
   *
   * @param initial Indicates whether a full initial load should be done.
   */
  updateAssetBuffer(initial = false) {
    if (initial) this.assetBuffer = [];
    const filtered = this.allAssets.filter((it) => this.checkType(it));
    const length = this.assetBuffer.length;
    let idx = initial ? filtered.findIndex((it) => it.id === this.selected) : length + this.bufferSize;
    idx = Math.max(Math.min(length + this.bufferSize, filtered.length), idx + 1);
    this.assetBuffer = this.assetBuffer.concat(filtered.slice(length, idx));
  }

  loadMoreAssets() {
    const notLoaded = this.allAssets.find((it) => it.type === 'group' && !it.resource.loaded);
    if (notLoaded) {
      this.loading = true;
      this.store
        .dispatch(new ScanResource(notLoaded.resource.uri, notLoaded.resource.source))
        .subscribe(() => (this.loading = false));
    }
  }

  /**
   * Checks the type of the given asset.
   *
   * @param asset The asset to check.
   * @return Whether the asset can be used as a value or not.
   */
  checkType(asset: Asset): boolean {
    if (asset.type === 'group' || !asset.parent) return false;
    let allowedTypes = this.component?.allowedTypes;
    if (allowedTypes && typeof allowedTypes === 'string') allowedTypes = [allowedTypes];
    return Array.isArray(allowedTypes) && allowedTypes.length > 0 ? allowedTypes.indexOf(asset.type) >= 0 : true;
  }

  /**
   * Returns a function which returns `true` if a drop is allowed onto this component.
   */
  allowDrop(): (event: DragDropData) => boolean {
    return (event: DragDropData) => {
      return event.dragData instanceof Asset && this.checkType(event.dragData);
    };
  }

  /**
   * Handles an asset drop onto this component.
   *
   * @param data The drop data.
   */
  onDrop(data: DragDropData): void {
    if (!this.checkType(data.dragData)) return;
    this.selected = data.dragData.id;
    this.updateAssetBuffer(true);
    this.cdr.detectChanges();
  }

  /**
   * @inheritdoc
   */
  onExternalUpdate(): void {
    if (this.component?.mixed) {
      this.cdr.detectChanges();
    } else {
      this.selected = this.component?.asset;
    }
  }

  /**
   * Handles the scroll end event.
   */
  onScrollToEnd(): void {
    if (this.loading) return;
    this.loadMoreAssets();
  }

  /**
   * Handles the scroll event.
   */
  onScroll({ end }: { end: number }) {
    if (this.loading || this.allAssets.length <= this.assetBuffer.length) return;
    if (end + this.bufferThreshold >= this.assetBuffer.length) {
      if (end + this.bufferThreshold >= this.allAssets.filter((it) => this.checkType(it)).length) this.loadMoreAssets();
      else this.updateAssetBuffer();
    }
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.component) return;
    if (this.component?.mixed) return;
    this.selected = this.component?.asset;
    this.updateAssetBuffer(true);
    this.cdr.markForCheck();
  }
}
