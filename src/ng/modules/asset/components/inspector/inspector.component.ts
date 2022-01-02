import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  NgZone,
  Type,
  ViewEncapsulation,
} from '@angular/core';
import { Actions, ofActionSuccessful, Select } from '@ngxs/store';
import { Asset } from 'common/asset';
import { flatten } from 'lodash';
import { DestroyLifecycle, notify } from 'ng/modules/utils';
import { merge, Observable, takeUntil, tap } from 'rxjs';
import { IAssetOwner } from '../../interfaces';
import { AssetState, LoadAssetResource } from '../../states';

@Component({
  selector: 'yame-asset-inspector',
  templateUrl: './inspector.component.html',
  styleUrls: ['./inspector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [DestroyLifecycle],
})
export class AssetInspectorComponent {
  /**
   * Selector for subscribing to icon updates.
   */
  @Select(AssetState.tabComponents) tabs$!: Observable<{ [icon: string]: Type<IAssetOwner>[] }>;

  /**
   * Selector for subscribing to icon updates.
   */
  @Select(AssetState.icons) icons$!: Observable<{ [icon: string]: string }>;

  /**
   * The currently selected asset.
   */
  @Input() set asset(val: Asset | null) {
    this._asset = val;
    this.cdr.markForCheck();
  }
  get asset(): Asset | null {
    return this._asset;
  }

  /**
   * All asset tab content components to render for the current asset.
   */
  get tabContent(): Type<IAssetOwner>[] {
    if (!this._asset) return [];

    return flatten(
      Object.keys(this.tabs)
        .filter(_ => _ === '*' || _ === this._asset!.type)
        .map(_ => this.tabs[_])
    );
  }

  /**
   * The current asset icon map.
   */
  tabs: { [type: string]: Type<IAssetOwner>[] } = {};

  /**
   * The current asset icon map.
   */
  icons: { [icon: string]: string } = {};

  /**
   * Internal asset reference.
   */
  private _asset: Asset | null = null;

  constructor(private cdr: ChangeDetectorRef, actions: Actions, zone: NgZone, destroy$: DestroyLifecycle) {
    zone.runOutsideAngular(() => {
      merge(
        this.tabs$.pipe(tap(_ => (this.tabs = _))),
        this.icons$.pipe(tap(_ => (this.icons = _))),
        actions.pipe(ofActionSuccessful(LoadAssetResource))
      )
        .pipe(takeUntil(destroy$), notify(cdr))
        .subscribe();
    });
  }

  /**
   * Returns the icon for the given asset.
   *
   * @param asset The asset.
   */
  getIcon(asset: Asset): string {
    return this.icons[asset.type] ?? 'file';
  }
}
