import {
  Component,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
  ViewEncapsulation,
} from '@angular/core';
import { AssetSceneComponent as AssetComponent } from 'common/scene/component/asset';
import { DragDropData } from 'ng2-dnd';
import { Asset } from 'common/asset';
import { AssetState } from 'ng/modules/asset/states/asset.state';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { filter, first, take, takeUntil } from 'rxjs/operators';
import { ScanResource } from 'ng/modules/asset/states/actions/asset.action';
import { TranslateService } from '@ngx-translate/core';
import { AbstractTypeComponent } from 'ng/modules/sidebar/components/selection/types/abstract';

// TODO: use tree select instead of list
@Component({
  selector: 'yame-component-type-asset',
  templateUrl: 'asset-type.component.html',
  styleUrls: ['asset-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AssetTypeComponent<T extends AssetComponent> extends AbstractTypeComponent<T> implements OnChanges {
  static readonly type: string = 'asset';

  /**
   * A list of all assets for the current asset type.
   */
  protected allAssets: Asset[] = [];

  /**
   * Whether assets are being loaded or not.
   */
  loading = false;

  /**
   * The current index.
   */
  currentIndex: number = 0;

  /**
   * The list of assets which is displayed.
   */
  assetBuffer: Asset[] = [];

  bufferThreshold = 10;

  @Select(AssetState.assets) assets$!: Observable<Asset[]>;

  /**
   * Stream for subscribing to the group loading state.
   */
  @Select(AssetState.scanningResource) loading$!: Observable<string>;

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
    this.currentIndex = id ? this.allAssets.findIndex(it => it.id === id) : -1;
    const asset = this.allAssets[this.currentIndex];
    if (id === this.component?.asset && id && !asset) this.loadMoreAssets();
    if (!this.component || (this.component && this.component.asset === id)) return;
    const data = {
      originalEvent: null,
      value: id,
      component: this.component,
    };
    this.component.asset = asset ? id : null;
    delete this.component.mixed;
    this.cdr.markForCheck();
    this.updateEvent.emit(data);
  }

  constructor(
    protected translate: TranslateService,
    protected cdr: ChangeDetectorRef,
    protected zone: NgZone,
    protected store: Store
  ) {
    super(translate);
  }

  /**
   * @inheritdoc
   */
  onAttach(): void {
    let waitingForResource = false;
    this.zone.runOutsideAngular(() => {
      this.assets$.pipe(takeUntil(this.detach$)).subscribe(async assets => {
        this.allAssets = assets.slice();

        if (waitingForResource) return;

        // Wait for the current resource until it is loaded
        waitingForResource = !!(await this.loading$.pipe(take(1)).toPromise());
        if (waitingForResource) {
          await this.loading$
            .pipe(
              filter(val => val === null),
              first()
            )
            .toPromise();
          waitingForResource = false;
        }
        this.updateAssetBuffer();
      });

      this.loading$.pipe(takeUntil(this.detach$)).subscribe(async loading => {
        this.loading = !!loading;
        this.cdr.markForCheck();
      });
    });
  }

  /**
   * Updates the asset buffer.
   */
  updateAssetBuffer(): void {
    const before = this.assetBuffer.length;
    this.assetBuffer = this.allAssets.filter(it => this.checkType(it));
    this.cdr.markForCheck();
    if (this.assetBuffer.length < this.bufferThreshold || before === this.assetBuffer.length) this.loadMoreAssets();
  }

  /**
   * Loads assets, which were not loaded yet.
   */
  loadMoreAssets(): void {
    const notLoaded = this.allAssets.find(it => it.type === 'group' && !it.resource.loaded);
    if (!notLoaded) return;
    this.store.dispatch(new ScanResource(notLoaded.resource.uri, notLoaded.resource.source));
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
    this.updateAssetBuffer();
  }

  /**
   * @inheritdoc
   */
  onExternalUpdate(): void {
    if (this.component?.mixed) {
      this.cdr.markForCheck();
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
      if (end + this.bufferThreshold >= this.allAssets.filter(it => this.checkType(it)).length) this.loadMoreAssets();
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
    this.updateAssetBuffer();
  }
}
