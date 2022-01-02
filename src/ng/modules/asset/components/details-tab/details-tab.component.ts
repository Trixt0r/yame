import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Actions, ofActionSuccessful, Select } from '@ngxs/store';
import { Asset } from 'common/asset';
import { DestroyLifecycle, notify } from 'ng/modules/utils';
import { merge, Observable, takeUntil, tap } from 'rxjs';
import { AssetTabComponent } from '../../decorators/tab.decorator';
import { IAssetDetailsComponent, IAssetOwner } from '../../interfaces';
import { AssetState, LoadAssetResource } from '../../states';

const dragImage = new Image(0, 0);

interface AssetDescription {
  label: string;
  content: IAssetDetailsComponent;
}

@Component({
  selector: 'yame-asset-details-tab',
  templateUrl: './details-tab.component.html',
  styleUrls: ['./details-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [DestroyLifecycle],
})
@AssetTabComponent()
export class AssetDetailsTabComponent implements IAssetOwner {
  static readonly icon = 'info-circle';

  static readonly title = 'asset.details.title';

  /**
   * Selector for subscribing to type label updates.
   */
  @Select(AssetState.typeLabels) labels$!: Observable<{ [label: string]: string }>;

  /**
   * Selector for reacting to details component updates.
   */
  @Select(AssetState.detailsComponents) details$!: Observable<{ [key: string]: IAssetDetailsComponent[] }>;

  /**
   * The asset to preview.
   */
  set asset(val: Asset) {
    this._asset = val;
    this.updateDescriptions();
    this.cdr.markForCheck();
  }
  get asset(): Asset {
    return this._asset!;
  }

  /**
   * The current asset type label map.
   */
  labels: { [label: string]: string } = {};

  /**
   * The current asset details map.
   */
  details: { [key: string]: IAssetDetailsComponent[] } = {};

  /**
   * The current language.
   */
  lang: string;

  /**
   * A list of descriptions to display.
   */
  descriptions: AssetDescription[] = [];

  /**
   * Internal asset reference.
   */
  private _asset?: Asset;

  constructor(
    protected cdr: ChangeDetectorRef,
    translate: TranslateService,
    actions: Actions,
    zone: NgZone,
    destroy$: DestroyLifecycle
  ) {
    this.lang = translate.currentLang;
    zone.runOutsideAngular(() => {
      merge(
        this.labels$.pipe(tap(_ => (this.labels = _))),
        this.details$.pipe(tap(_ => (this.details = _))),
        translate.onLangChange.pipe(tap(_ => (this.lang = _.lang))),
        actions.pipe(ofActionSuccessful(LoadAssetResource))
      )
        .pipe(takeUntil(destroy$), notify(cdr))
        .subscribe(() => this.updateDescriptions());
    });
  }

  private updateDescriptions(): void {
    if (!this._asset) return;
    const components = this.details[this._asset.type];
    if (!Array.isArray(components)) return;
    this.descriptions = components.map(content => ({
      label: (content as any).label,
      content,
    }));
  }

  /**
   * Returns the type label for the given asset.
   *
   * @param asset The asset.
   * @return The label name.
   */
  getLabel(asset: Asset): string {
    return this.labels[asset.type] || asset.type;
  }

  /**
   * Overrides the default drag image.
   *
   * @param event The triggered event.
   */
  onDragStart(event: DragEvent): void {
    event.dataTransfer?.setDragImage(dragImage, 0, 0);
  }
}
