import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Asset } from 'common/asset';
import { DestroyLifecycle, notify, ResizableComponent } from 'ng';
import { Observable, takeUntil } from 'rxjs';
import { AssetState, SelectAsset, UnselectAsset } from '../../states';

@Component({
    selector: 'yame-asset-explorer',
    templateUrl: './explorer.component.html',
    styleUrls: ['./explorer.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class AssetExplorerComponent {
  static readonly PREVIEW_MIN_HEIGHT = 250;

  /**
   * Selector for subscribing to asset selection.
   */
  @Select(AssetState.selectedAsset) asset$!: Observable<Asset>;

  /**
   * The currently selected asset.
   */
  set asset(val: Asset | null) {
    this.store.dispatch(!val ? new UnselectAsset() : new SelectAsset(val!));
  }
  get asset(): Asset | null {
    return this._asset;
  }

  get maxResizerValue(): number {
    return this._asset ? window.innerHeight - AssetExplorerComponent.PREVIEW_MIN_HEIGHT : window.innerHeight;
  }

  protected _asset: Asset | null = null;

  constructor(protected store: Store, cdr: ChangeDetectorRef, zone: NgZone, destroy$: DestroyLifecycle) {
    zone.runOutsideAngular(() => {
      this.asset$.pipe(takeUntil(destroy$), notify(cdr)).subscribe(_ => (this._asset = _));
    });
  }
}
