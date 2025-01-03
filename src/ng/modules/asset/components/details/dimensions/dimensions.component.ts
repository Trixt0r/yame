import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, ViewEncapsulation } from '@angular/core';
import { Select } from '@ngxs/store';
import { Asset } from 'common/asset';
import { DestroyLifecycle } from 'ng/modules/utils';
import { AssetState } from 'ng/modules/asset/states';
import { Observable, takeUntil } from 'rxjs';
import { AssetDetailsComponent } from '../../../decorators/details.decorator';

@Component({
    templateUrl: 'dimensions.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DestroyLifecycle],
    standalone: false
})
@AssetDetailsComponent('png', 'jpg', 'jpeg', 'gif', 'svg')
export class AssetDimensionsDetailsComponent {
  /**
   * The label to display in the asset details view.
   */
  static label = 'asset.imageDimensions';

  /**
   * Returns whether this component is visible for the given asset.
   *
   * @param asset The asset.
   */
  static isVisibleFor(asset?: Asset<unknown>): boolean {
    return typeof asset?.resource?.width === 'number' && typeof asset?.resource?.height === 'number';
  }

  /**
   * Stream emitting the currently selected asset.
   */
  @Select(AssetState.selectedAsset) asset$!: Observable<Asset<unknown>>;

  /**
   * The current asset.
   */
  asset?: Asset<unknown>;

  /**
   * Whether the asset has dimensions or not.
   */
  get hasDimensions(): boolean {
    return AssetDimensionsDetailsComponent.isVisibleFor(this.asset);
  }

  constructor(cdr: ChangeDetectorRef, zone: NgZone, destroy$: DestroyLifecycle) {
    zone.runOutsideAngular(() => {
      this.asset$.pipe(takeUntil(destroy$)).subscribe(_ => {
        this.asset = _;
        if (!this.asset) return;
        const img = new Image();
        img.onload = () => {
          this.asset!.resource.width = img.width;
          this.asset!.resource.height = img.height;
          cdr.markForCheck();
        };
        img.src = this.asset.resource.uri;
      });
    });
  }
}
